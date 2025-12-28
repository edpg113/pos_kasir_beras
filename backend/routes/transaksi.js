const express = require("express");
const router = express.Router();
const db = require("../db");

// Ensure kode_transaksi column exists
const ensureColumn = () => {
  const query = "SHOW COLUMNS FROM transaksi LIKE 'kode_transaksi'";
  db.query(query, (err, results) => {
    if (!err && results.length === 0) {
      const alterQuery =
        "ALTER TABLE transaksi ADD COLUMN kode_transaksi VARCHAR(50) AFTER id";
      db.query(alterQuery, (err2) => {
        if (err2)
          console.error("❌ Gagal menambah kolom kode_transaksi:", err2);
        else console.log("✅ Kolom kode_transaksi berhasil ditambahkan");
      });
    }
  });
};
ensureColumn();

// Helper to generate Transaction ID
const generateTransactionID = () => {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, "0");
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const y = now.getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000); // 4 digit unique random
  return `TRX-${d}${m}${y}-${random}`;
};

// API POST Transaksi
router.post("/transaksi", (req, res) => {
  const { pembeli, total, bayar, kembalian, items } = req.body; // remove items check? no it's below

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Item transaksi kosong!" });
  }

  // Mulai transaksi database untuk memastikan konsistensi data
  db.beginTransaction((err) => {
    if (err) {
      console.error("❌ Error starting transaction:", err);
      return res
        .status(500)
        .json({ message: "Gagal memulai transaksi database." });
    }

    const kodeTransaksi = generateTransactionID();
    const queryTransaksi =
      "INSERT INTO transaksi (kode_transaksi, tanggal, pembeli, total, bayar, kembalian) VALUES (?, NOW(), ?, ?, ?, ?)";

    db.query(
      queryTransaksi,
      [kodeTransaksi, pembeli, total, bayar, kembalian],
      (err, result) => {
        if (err) {
          console.error("❌ Error insert transaksi:", err);
          return db.rollback(() => res.status(500).json(err));
        }

        const transaksiId = result.insertId;
        const itemQuery = `INSERT INTO transaksi_detail (transaksi_id, produk_id, qty, harga, subtotal) VALUES ?`;
        const itemValues = items.map((i) => [
          transaksiId,
          i.produk_id,
          i.qty,
          i.harga,
          i.subtotal,
        ]);

        db.query(itemQuery, [itemValues], (err2) => {
          if (err2) {
            console.error("❌ Error insert transaksi_detail:", err2);
            return db.rollback(() => res.status(500).json(err2));
          }

          // ===== UPDATE STOK =====
          const stokPromises = items.map((item) => {
            return new Promise((resolve, reject) => {
              // Update stok secara atomik untuk mencegah race condition
              const updateStokQuery = `UPDATE produk SET stok = stok - ? WHERE id = ? AND stok >= ?`;
              db.query(
                updateStokQuery,
                [item.qty, item.produk_id, item.qty],
                (err, updateResult) => {
                  if (err) return reject(err);
                  // Jika tidak ada baris yang terpengaruh, berarti stok tidak cukup
                  if (updateResult.affectedRows === 0) {
                    return reject(
                      new Error(
                        `Stok tidak cukup untuk produk ID ${item.produk_id}`
                      )
                    );
                  }
                  resolve();
                }
              );
            });
          });

          Promise.all(stokPromises)
            .then(() => {
              // Jika semua berhasil, commit transaksi
              db.commit((commitErr) => {
                if (commitErr) {
                  return db.rollback(() => res.status(500).json(commitErr));
                }
                // Kirim satu respons sukses di akhir
                res.json({
                  message: "✅ Transaksi berhasil & stok diperbarui",
                  transaksi_id: transaksiId,
                  kode_transaksi: kodeTransaksi,
                });
              });
            })
            .catch((error) => {
              // Jika ada error (misal: stok tidak cukup), rollback transaksi
              db.rollback(() => {
                res.status(400).json({ message: error.message });
              });
            });
        });
      }
    );
  });
  for (const item of items) {
    if (!item.produk_id || item.qty <= 0) {
      return res.status(400).json({
        message: "Data item transaksi tidak valid",
      });
    }
  }
});

// API GET TRANSAKSI
router.get("/gettransaksi", (req, res) => {
  const { date } = req.query;
  let query = `
  SELECT
  td.id AS transaksi_detail_id,
  td.id AS transaksi_detail_id,
  t.id AS transaksi_id,
  t.kode_transaksi,
  t.tanggal,
  t.pembeli,
  t.total,
  t.bayar,
  t.kembalian,
  p.namaProduk,
  td.qty,
  td.harga,
  td.subtotal
FROM transaksi_detail td
JOIN transaksi t ON td.transaksi_id = t.id
JOIN produk p ON p.id = td.produk_id
  `;

  if (date) {
    query += ` WHERE DATE(t.tanggal) = ? `;
  }

  query += ` ORDER BY t.tanggal DESC`;

  const params = date ? [date] : [];

  db.query(query, params, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }
    res.json(result);
  });
});

module.exports = router;
