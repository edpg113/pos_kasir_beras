const express = require("express");
const router = express.Router();
const db = require("../db");

// API GET Inventory
router.get("/inventory", (req, res) => {
  const query = `
        SELECT
            p.id,
            p.namaProduk AS produk,
            p.namaProduk,
            p.harga,
            p.modal,
            p.stok,
            p.min_stok AS minStok,
        (SELECT qty FROM stok_masuk WHERE produk_id = p.id ORDER BY tanggal DESC LIMIT 1) AS reorder,
        p.updated_at AS lastUpdate,
        (SELECT supplier FROM stok_masuk WHERE produk_id = p.id ORDER BY tanggal DESC LIMIT 1) AS supplier,
        (SELECT harga_beli FROM stok_masuk WHERE produk_id = p.id ORDER BY tanggal DESC LIMIT 1) AS lastHargaBeli,
        (SELECT harga_jual FROM stok_masuk WHERE produk_id = p.id ORDER BY tanggal DESC LIMIT 1) AS lastHargaJual,
        (SELECT qty * harga_beli FROM stok_masuk WHERE produk_id = p.id ORDER BY tanggal DESC LIMIT 1) AS lastTotal
        FROM produk p
        WHERE p.is_active = 1
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
  const { quantity, supplier, hargaBeli, hargaJual } = req.body;

  const qty = parseInt(quantity, 10);
  const hb = parseFloat(hargaBeli || 0);
  const hj = parseFloat(hargaJual || 0);
  const total = Math.round((hb * qty) * 100) / 100;

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

        // 2. Catat riwayat di tabel stok_masuk (tambahkan harga dan total jika kolom ada)
        const logStockQuery = `
          INSERT INTO stok_masuk (produk_id, supplier, qty, tanggal, harga_beli, harga_jual, total)
          VALUES (?, ?, ?, NOW(), ?, ?, ?)
        `;
        db.query(logStockQuery, [id, supplier, qty, hb, hj, total], (logErr, logResult) => {
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
        const { inventoryId, quantity, supplier, hargaBeli, hargaJual, total } = item;
        const qty = parseInt(quantity, 10);
        const hb = parseFloat(hargaBeli || 0);
        const hj = parseFloat(hargaJual || 0);
        const ttl = typeof total !== 'undefined' ? parseFloat(total) : Math.round((hb * qty) * 100) / 100;

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
          "INSERT INTO stok_masuk (produk_id, supplier, qty, tanggal, harga_beli, harga_jual, total) VALUES (?, ?, ?, NOW(), ?, ?, ?)";
        queries.push(
          db.promise().query(logStockQuery, [inventoryId, supplier, qty, hb, hj, ttl])
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
          res.status(500).json({
            message: "Gagal memperbarui salah satu item. Transaksi dibatalkan.",
            error: queryErr.message,
          });
        });
      });
  });
});

// API UPDATE Inventory (Edit Stok & Supplier)
router.put("/inventory/:id", (req, res) => {
  const { id } = req.params;
  const { stok, supplier, hargaBeli, hargaJual } = req.body;

  const newStok = parseInt(stok, 10);
  const hb = parseFloat(hargaBeli || 0);
  const hj = parseFloat(hargaJual || 0);

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

    // 1. Update stok and optionally harga/modal di tabel produk
    const updateProductQuery =
      "UPDATE produk SET stok = ?, modal = ?, harga = ?, updated_at = NOW() WHERE id = ?";
    db.query(updateProductQuery, [newStok, hb, hj, id], (productErr, productResult) => {
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
            "UPDATE stok_masuk SET supplier = ?, harga_beli = ?, harga_jual = ?, total = qty * ? WHERE id = ?";
          db.query(updateSupplierQuery, [supplier, hb, hj, hb, lastEntryId], (suppErr) => {
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

// =======================
// POST RETUR BARANG
// =======================

router.post("/retur", (req, res) => {
  const { items, keterangan } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Item retur kosong" });
  }

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ message: "Gagal mulai transaksi" });

    // 1. Insert ke tabel retur
    const insertRetur = `INSERT INTO retur (keterangan) VALUES (?)`;
    db.query(insertRetur, [keterangan || "-"], (err, result) => {
      if (err) return rollback(res, err);

      const returId = result.insertId;

      // 2. Loop item
      const promises = items.map((item) => {
        return new Promise((resolve, reject) => {
          // Tambah stok produk
          const updateStok = "UPDATE produk SET stok = stok + ? WHERE id = ?";
          db.query(updateStok, [item.qty, item.produk_id], (err) => {
            if (err) return reject(err);

            // Simpan detail retur
            const insertDetail = `
              INSERT INTO retur_detail (retur_id, produk_id, qty)
              VALUES (?, ?, ?)
            `;
            db.query(
              insertDetail,
              [returId, item.produk_id, item.qty],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        });
      });

      Promise.all(promises)
        .then(() => {
          db.commit(() => {
            res.json({ message: "Retur berhasil disimpan" });
          });
        })
        .catch((err) => rollback(res, err));
    });
  });

  function rollback(res, err) {
    console.error(err);
    db.rollback(() => {
      res.status(500).json({ message: "Gagal memproses retur" });
    });
  }
});

// =======================
// STOCK TRANSFER (Kirim Barang ke Cabang)
// =======================

// API Send Stock to Branch (Bulk Support)
router.post("/inventory/transfer", (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Data pengiriman tidak lengkap." });
  }

  db.beginTransaction((err) => {
    if (err) {
      console.error("❌ Error starting transfer transaction:", err);
      return res
        .status(500)
        .json({ message: "Gagal memulai transaksi database." });
    }

    const processItems = items.map((item) => {
      const { produk_id, qty, tujuan, keterangan } = item;
      const quantity = parseInt(qty, 10);

      return new Promise((resolve, reject) => {
        // 1. Check stock availability
        const checkStockQuery =
          "SELECT stok, namaProduk FROM produk WHERE id = ?";
        db.query(checkStockQuery, [produk_id], (checkErr, checkResult) => {
          if (checkErr) return reject(new Error("Gagal mengecek stok produk."));
          if (checkResult.length === 0)
            return reject(new Error(`Produk ID ${produk_id} tidak ditemukan.`));

          const currentStock = checkResult[0].stok;
          const namaProduk = checkResult[0].namaProduk;

          if (currentStock < quantity) {
            return reject(
              new Error(
                `Stok ${namaProduk} tidak cukup. Tersisa: ${currentStock}`
              )
            );
          }

          // 2. Decrease stock
          const updateStockQuery =
            "UPDATE produk SET stok = stok - ?, updated_at = NOW() WHERE id = ?";
          db.query(updateStockQuery, [quantity, produk_id], (updateErr) => {
            if (updateErr)
              return reject(new Error(`Gagal mengurangi stok ${namaProduk}.`));

            // 3. Record transfer in stok_pengiriman
            const insertTransferQuery = `
                INSERT INTO stok_pengiriman (produk_id, qty, tujuan, keterangan, tanggal)
                VALUES (?, ?, ?, ?, NOW())
              `;
            db.query(
              insertTransferQuery,
              [produk_id, quantity, tujuan, keterangan],
              (insertErr) => {
                if (insertErr)
                  return reject(
                    new Error(
                      `Gagal mencatat riwayat pengiriman ${namaProduk}.`
                    )
                  );
                resolve();
              }
            );
          });
        });
      });
    });

    Promise.all(processItems)
      .then(() => {
        db.commit((commitErr) => {
          if (commitErr) {
            console.error("❌ Error committing transfer:", commitErr);
            return db.rollback(() => {
              res
                .status(500)
                .json({ message: "Gagal menyelesaikan transaksi." });
            });
          }
          res.json({ message: "Pengiriman barang berhasil dicatat." });
        });
      })
      .catch((error) => {
        db.rollback(() => {
          res.status(400).json({ message: error.message });
        });
      });
  });
});

// API Get Transfer History (Date Filter Support)
router.get("/inventory/transfer-history", (req, res) => {
  const { date } = req.query;
  let query = `
    SELECT
      sp.id,
      sp.tanggal,
      p.namaProduk,
      sp.qty,
      sp.tujuan,
      sp.keterangan
    FROM stok_pengiriman sp
    JOIN produk p ON sp.produk_id = p.id
  `;

  const params = [];
  if (date) {
    query += " WHERE DATE(sp.tanggal) = ? ";
    params.push(date);
  }

  query += " ORDER BY sp.tanggal DESC";

  db.query(query, params, (err, result) => {
    if (err) {
      console.error("❌ Error fetching transfer history:", err);
      return res
        .status(500)
        .json({ message: "Gagal mengambil riwayat pengiriman." });
    }
    res.json(result);
  });
});

module.exports = router;
