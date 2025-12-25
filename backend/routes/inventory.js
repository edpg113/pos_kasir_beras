const express = require("express");
const router = express.Router();
const db = require("../db");

// API GET Inventory
router.get("/inventory", (req, res) => {
  const query = `
        SELECT
            p.id,
            p.namaProduk AS produk,
            p.stok,
            p.min_stok AS minStok,
            (SELECT qty FROM stok_masuk WHERE produk_id = p.id ORDER BY tanggal DESC LIMIT 1) AS reorder,
            p.updated_at AS lastUpdate,
            (SELECT supplier FROM stok_masuk WHERE produk_id = p.id ORDER BY tanggal DESC LIMIT 1) AS supplier
        FROM produk p
        ORDER BY p.namaProduk ASC
        `;
  db.query(query, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }
    res.json(result);
  });
});

// API ADD STOCK to Inventory
router.patch("/inventory/:id/add-stock", (req, res) => {
  const { id } = req.params;
  const { quantity, supplier } = req.body;

  const qty = parseInt(quantity, 10);

  if (!qty || qty <= 0) {
    return res
      .status(400)
      .json({ message: "Jumlah stok tambahan harus angka positif." });
  }
  if (!supplier) {
    return res.status(400).json({ message: "Nama supplier harus diisi." });
  }

  db.beginTransaction((err) => {
    if (err) {
      console.error("❌ Error starting transaction:", err);
      return res
        .status(500)
        .json({ message: "Gagal memulai transaksi database." });
    }

    // 1. Update stok di tabel produk
    const updateStokQuery = `
      UPDATE produk
      SET stok = stok + ?, updated_at = NOW()
      WHERE id = ?
    `;
    db.query(updateStokQuery, [qty, id], (updateErr, result) => {
      if (updateErr) {
        console.error("❌ DB error on stock update:", updateErr);
        return db.rollback(() => {
          res.status(500).json({ message: "Gagal memperbarui stok produk." });
        });
      }

      if (result.affectedRows === 0) {
        return db.rollback(() => {
          res.status(404).json({ message: "Produk tidak ditemukan." });
        });
      }

      // 2. Catat riwayat di tabel stok_masuk
      const logStockQuery = `
        INSERT INTO stok_masuk (produk_id, supplier, qty, tanggal)
        VALUES (?, ?, ?, NOW())
      `;
      db.query(logStockQuery, [id, supplier, qty], (logErr, logResult) => {
        if (logErr) {
          console.error("❌ DB error on logging stock:", logErr);
          return db.rollback(() => {
            res.status(500).json({ message: "Gagal mencatat riwayat stok." });
          });
        }

        const newStockEntryId = logResult.insertId;

        // Jika semua berhasil, commit transaksi
        db.commit((commitErr) => {
          if (commitErr) {
            console.error("❌ DB error on commit:", commitErr);
            return db.rollback(() => {
              res
                .status(500)
                .json({ message: "Gagal menyelesaikan transaksi." });
            });
          }

          // 3. Ambil data stok masuk yang baru untuk dikembalikan ke client
          const getNewEntryQuery = `SELECT * FROM stok_masuk WHERE id = ?`;
          db.query(getNewEntryQuery, [newStockEntryId], (getErr, rows) => {
            if (getErr) {
              console.error("❌ DB error on fetching new stock entry:", getErr);
              // Transaksi sudah di-commit, jadi kita hanya bisa melaporkan error
              return res.status(500).json({
                message:
                  "Stok berhasil ditambahkan, namun gagal mengambil data terbaru.",
                error: getErr,
              });
            }
            res.json({
              message: "Stok berhasil ditambahkan dan dicatat.",
              data: rows[0],
            });
          });
        });
      });
    });
  });
});

// API ADD MULTIPLE STOCKS to Inventory
router.post("/inventory/add-stocks", (req, res) => {
  const { items } = req.body; // Expect an array of items

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ message: "Data item tidak valid atau kosong." });
  }

  db.beginTransaction((err) => {
    if (err) {
      console.error("❌ Error starting transaction:", err);
      return res
        .status(500)
        .json({ message: "Gagal memulai transaksi database." });
    }

    const queries = [];

    try {
      // Prepare all queries
      items.forEach((item) => {
        const { inventoryId, quantity, supplier } = item;
        const qty = parseInt(quantity, 10);

        if (!inventoryId || !supplier || !qty || qty <= 0) {
          // This check is basic. More robust validation might be needed.
          // If one item is invalid, we'll fail the whole transaction.
          throw new Error(
            "Data salah satu item tidak lengkap atau tidak valid."
          );
        }

        // 1. Update stok di tabel produk
        const updateStokQuery =
          "UPDATE produk SET stok = stok + ?, updated_at = NOW() WHERE id = ?";
        queries.push(db.promise().query(updateStokQuery, [qty, inventoryId]));

        // 2. Catat riwayat di tabel stok_masuk
        const logStockQuery =
          "INSERT INTO stok_masuk (produk_id, supplier, qty, tanggal) VALUES (?, ?, ?, NOW())";
        queries.push(
          db.promise().query(logStockQuery, [inventoryId, supplier, qty])
        );
      });
    } catch (error) {
      return db.rollback(() => {
        res.status(400).json({ message: error.message });
      });
    }

    // Execute all queries in parallel
    Promise.all(queries)
      .then(() => {
        // If all succeed, commit the transaction
        db.commit((commitErr) => {
          if (commitErr) {
            console.error("❌ DB error on commit:", commitErr);
            return db.rollback(() => {
              res
                .status(500)
                .json({ message: "Gagal menyelesaikan transaksi." });
            });
          }
          res.json({ message: "Semua stok berhasil ditambahkan dan dicatat." });
        });
      })
      .catch((queryErr) => {
        console.error("❌ DB error during transaction:", queryErr);
        db.rollback(() => {
          res
            .status(500)
            .json({
              message:
                "Gagal memperbarui salah satu item. Transaksi dibatalkan.",
              error: queryErr.message,
            });
        });
      });
  });
});

// API UPDATE Inventory (Edit Stok & Supplier)
router.put("/inventory/:id", (req, res) => {
  const { id } = req.params;
  const { stok, supplier } = req.body;

  const newStok = parseInt(stok, 10);

  if (isNaN(newStok) || newStok < 0) {
    return res
      .status(400)
      .json({ message: "Stok harus angka valid dan tidak negatif." });
  }
  if (!supplier) {
    return res.status(400).json({ message: "Nama supplier harus diisi." });
  }

  db.beginTransaction((err) => {
    if (err) {
      console.error("❌ Error starting transaction:", err);
      return res
        .status(500)
        .json({ message: "Gagal memulai transaksi database." });
    }

    // 1. Update stok di tabel produk
    const updateProductQuery =
      "UPDATE produk SET stok = ?, updated_at = NOW() WHERE id = ?";
    db.query(updateProductQuery, [newStok, id], (productErr, productResult) => {
      if (productErr) {
        return db.rollback(() => {
          console.error("❌ DB error on product update:", productErr);
          res.status(500).json({ message: "Gagal mengupdate stok produk." });
        });
      }

      if (productResult.affectedRows === 0) {
        return db.rollback(() => {
          res.status(404).json({ message: "Produk tidak ditemukan." });
        });
      }

      // 2. Update supplier di entry stok_masuk terakhir (jika ada)
      // Kita cari entry terakhir untuk produk ini
      const findLastEntryQuery =
        "SELECT id FROM stok_masuk WHERE produk_id = ? ORDER BY tanggal DESC LIMIT 1";
      db.query(findLastEntryQuery, [id], (findErr, findResult) => {
        if (findErr) {
          return db.rollback(() => {
            console.error("❌ DB error on finding last stock entry:", findErr);
            res.status(500).json({ message: "Gagal mencari data stok masuk." });
          });
        }

        // Jika ada history stok masuk, update supplier-nya
        if (findResult.length > 0) {
          const lastEntryId = findResult[0].id;
          const updateSupplierQuery =
            "UPDATE stok_masuk SET supplier = ? WHERE id = ?";
          db.query(updateSupplierQuery, [supplier, lastEntryId], (suppErr) => {
            if (suppErr) {
              return db.rollback(() => {
                console.error("❌ DB error on updating supplier:", suppErr);
                res.status(500).json({ message: "Gagal mengupdate supplier." });
              });
            }
            commitTransaction();
          });
        } else {
          // Jika tidak ada history (mungkin produk baru manual di DB), kita skip update supplier di stok_masuk
          // Tapi idealnya produk selalu punya stok_masuk kalau lewat app.
          // Kita bisa juga insert dummy record, tapi untuk sekarang kita biarkan saja.
          commitTransaction();
        }

        function commitTransaction() {
          db.commit((commitErr) => {
            if (commitErr) {
              return db.rollback(() => {
                console.error("❌ DB error on commit:", commitErr);
                res
                  .status(500)
                  .json({ message: "Gagal menyelesaikan transaksi." });
              });
            }
            res.json({ message: "Inventori berhasil diupdate." });
          });
        }
      });
    });
  });
});

module.exports = router;
