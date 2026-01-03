const express = require("express");
const router = express.Router();
const db = require("../db");

// ==========================================
// INITIALIZE TABLES (IF NOT EXIST)
// ==========================================
// const initTables = () => {
//   const createReturTable = `
//     CREATE TABLE IF NOT EXISTS retur (
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       tanggal DATETIME NOT NULL,
//       tipe ENUM('penjualan', 'pembelian') NOT NULL,
//       transaksi_id INT DEFAULT NULL,
//       supplier VARCHAR(255) DEFAULT NULL,
//       total_nilai DECIMAL(15, 2) NOT NULL,
//       keterangan TEXT,
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//     )
//   `;

//   const createReturDetailTable = `
//     CREATE TABLE IF NOT EXISTS retur_detail (
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       retur_id INT NOT NULL,
//       produk_id INT NOT NULL,
//       qty INT NOT NULL,
//       harga DECIMAL(15, 2) NOT NULL,
//       subtotal DECIMAL(15, 2) NOT NULL,
//       FOREIGN KEY (retur_id) REFERENCES retur(id) ON DELETE CASCADE
//     )
//   `;

//   db.query(createReturTable, (err) => {
//     if (err) console.error("❌ Error creating retur table:", err);
//     else {
//       // Create detail table only after main table ensures it exists (async check ideally, but flow here is simplified)
//       db.query(createReturDetailTable, (err2) => {
//         if (err2) console.error("❌ Error creating retur_detail table:", err2);
//       });
//     }
//   });
// };

// // Run initialization immediately when module is loaded
// initTables();

// ==========================================
// ENDPOINTS
// ==========================================

// GET History Retur
router.get("/retur", (req, res) => {
  const { startDate, endDate } = req.query;
  let query = `
    SELECT 
        r.*, 
        t.kode_transaksi,
        GROUP_CONCAT(CONCAT(p.namaProduk, ' (', rd.qty, ')') SEPARATOR ', ') AS produk_retur
    FROM retur r
    LEFT JOIN retur_detail rd ON r.id = rd.retur_id
    LEFT JOIN produk p ON rd.produk_id = p.id
    LEFT JOIN transaksi t ON r.transaksi_id = t.id
  `;

  const queryParams = [];
  if (startDate && endDate) {
    query += ` WHERE DATE(r.tanggal) BETWEEN ? AND ? `;
    queryParams.push(startDate, endDate);
  } else if (startDate) {
    query += ` WHERE DATE(r.tanggal) >= ? `;
    queryParams.push(startDate);
  } else if (endDate) {
    query += ` WHERE DATE(r.tanggal) <= ? `;
    queryParams.push(endDate);
  }

  query += `
    GROUP BY r.id
    ORDER BY r.tanggal DESC
  `;

  db.query(query, queryParams, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// GET Items of a Transaction (for Sales Return Selection)
router.get("/retur/transaksi/:id/items", (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT 
      td.produk_id, 
      p.namaProduk, 
      td.qty AS qty_beli, 
      td.harga 
    FROM transaksi_detail td
    JOIN produk p ON p.id = td.produk_id
    JOIN transaksi t ON t.id = td.transaksi_id
    WHERE t.id = ? OR t.kode_transaksi = ?
  `;
  db.query(query, [id, id], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0)
      return res
        .status(404)
        .json({ message: "Transaksi tidak ditemukan atau tanpa item." });
    res.json(results);
  });
});

// POST Return Penjualan (Sales Return)
router.post("/retur/penjualan/:id", (req, res) => {
  const { id } = req.params;
  const { items, keterangan } = req.body;

  if (!id || !items || items.length === 0) {
    return res.status(400).json({ message: "Data retur tidak lengkap." });
  }

  // Helper to get real Transaction ID (INT) from Code or ID
  const getTransactionId = (input) => {
    return new Promise((resolve, reject) => {
      // If input looks like TRX-..., search by code
      if (typeof input === "string" && input.startsWith("TRX-")) {
        const q = "SELECT id FROM transaksi WHERE kode_transaksi = ?";
        db.query(q, [input], (err, res) => {
          if (err) return reject(err);
          if (res.length === 0)
            return reject(new Error("Transaksi tidak ditemukan"));
          resolve(res[0].id);
        });
      } else {
        // Assume it's already an ID
        resolve(input);
      }
    });
  };

  getTransactionId(id)
    .then((transaksiId) => {
      db.beginTransaction((err) => {
        if (err) return res.status(500).json({ message: "Transaction Error" });

        // 1. Hitung total retur
        let totalRetur = 0;
        items.forEach((item) => {
          totalRetur += item.qty * item.harga;
        });

        // 2. Insert ke table retur
        const insertRetur = `
          INSERT INTO retur (tanggal, tipe, transaksi_id, total_nilai, keterangan)
          VALUES (NOW(), 'penjualan', ?, ?, ?)
        `;
        db.query(
          insertRetur,
          [transaksiId, totalRetur, keterangan || "Retur Penjualan"],
          (err, result) => {
            if (err) {
              return db.rollback(() => res.status(500).json(err));
            }
            const returId = result.insertId;

            // 3. Update Stok (BERTAMBAH) & Insert Retur Detail
            const detailQueries = items.map((item) => {
              return new Promise((resolve, reject) => {
                // A. Insert Detail
                const insertDetail = `
                INSERT INTO retur_detail (retur_id, produk_id, qty, harga, subtotal)
                VALUES (?, ?, ?, ?, ?)
              `;
                db.query(
                  insertDetail,
                  [
                    returId,
                    item.produk_id,
                    item.qty,
                    item.harga,
                    item.qty * item.harga,
                  ],
                  (err2) => {
                    if (err2) return reject(err2);

                    // B. Update Stok (+ qty)
                    const updateStock = `UPDATE produk SET stok = stok + ? WHERE id = ?`;
                    db.query(
                      updateStock,
                      [item.qty, item.produk_id],
                      (err3) => {
                        if (err3) return reject(err3);
                        resolve();
                      }
                    );
                  }
                );
              });
            });

            Promise.all(detailQueries)
              .then(() => {
                db.commit((err5) => {
                  if (err5)
                    return db.rollback(() => res.status(500).json(err5));
                  res.json({
                    message: "Retur penjualan berhasil disimpan.",
                    returId,
                  });
                });
              })
              .catch((errParams) => {
                db.rollback(() =>
                  res.status(500).json({
                    message: "Gagal memproses item retur.",
                    error: errParams,
                  })
                );
              });
          }
        );
      });
    })
    .catch((err) => {
      res.status(404).json({ message: err.message });
    });
});

// POST Return Pembelian (Purchase Return)
router.post("/retur/pembelian", (req, res) => {
  const { supplier, items, keterangan } = req.body;
  // items: [{ produk_id, qty, harga }] // harga di sini bisa harga beli rata-rata atau input manual

  if (!supplier || !items || items.length === 0) {
    return res
      .status(400)
      .json({ message: "Data retur pembelian tidak lengkap." });
  }

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ message: "Transaction Error" });

    // 1. Hitung total retur
    let totalRetur = 0;
    items.forEach((item) => {
      totalRetur += item.qty * item.harga;
    });

    // 2. Insert ke table retur
    const insertRetur = `
      INSERT INTO retur (tanggal, tipe, supplier, total_nilai, keterangan)
      VALUES (NOW(), 'pembelian', ?, ?, ?)
    `;
    db.query(
      insertRetur,
      [supplier, totalRetur, keterangan || "Retur Pembelian"],
      (err, result) => {
        if (err) {
          return db.rollback(() => res.status(500).json(err));
        }
        const returId = result.insertId;

        // 3. Update Stok (BERKURANG) & Insert Retur Detail
        const detailQueries = items.map((item) => {
          return new Promise((resolve, reject) => {
            // A. Insert Detail
            const insertDetail = `
            INSERT INTO retur_detail (retur_id, produk_id, qty, harga, subtotal)
            VALUES (?, ?, ?, ?, ?)
          `;
            db.query(
              insertDetail,
              [
                returId,
                item.produk_id,
                item.qty,
                item.harga,
                item.qty * item.harga,
              ],
              (err2) => {
                if (err2) return reject(err2);

                // B. Update Stok (- qty)
                const updateStock = `UPDATE produk SET stok = stok - ? WHERE id = ?`;
                db.query(updateStock, [item.qty, item.produk_id], (err3) => {
                  if (err3) return reject(err3);
                  resolve();
                });
              }
            );
          });
        });

        Promise.all(detailQueries)
          .then(() => {
            db.commit((err5) => {
              if (err5) return db.rollback(() => res.status(500).json(err5));
              res.json({
                message: "Retur pembelian berhasil disimpan.",
                returId,
              });
            });
          })
          .catch((errParams) => {
            db.rollback(() =>
              res.status(500).json({
                message: "Gagal memproses item retur.",
                error: errParams,
              })
            );
          });
      }
    );
  });
});

module.exports = router;
