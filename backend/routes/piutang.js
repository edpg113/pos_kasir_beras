const express = require("express");
const router = express.Router();
const db = require("../db");

/**
 * GET /api/piutang
 * List all piutang with filters
 */
router.get("/piutang", (req, res) => {
  const { status, jatuh_tempo, pelanggan, startDate, endDate } = req.query;

  let query = `
    SELECT 
      p.id, 
      pl.nama AS nama, 
      GROUP_CONCAT(pr.namaProduk SEPARATOR ', ') AS produk,
      p.total, 
      p.sisa, 
      p.jatuh_tempo, 
      p.status, 
      t.tanggal
    FROM piutang p
    JOIN pelanggan pl ON p.pelanggan_id = pl.id
    JOIN transaksi t ON p.transaksi_id = t.id
    JOIN transaksi_detail td ON t.id = td.transaksi_id
    JOIN produk pr ON td.produk_id = pr.id
    WHERE 1=1
  `;

  const params = [];

  if (status) {
    query += " AND p.status = ?";
    params.push(status);
  }

  if (jatuh_tempo) {
    query += " AND p.jatuh_tempo = ?";
    params.push(jatuh_tempo);
  }

  if (pelanggan) {
    query += " AND pl.nama LIKE ?";
    params.push(`%${pelanggan}%`);
  }

  // Date filtering
  if (startDate) {
    query += " AND DATE(t.tanggal) >= ?";
    params.push(startDate);
  }

  if (endDate) {
    query += " AND DATE(t.tanggal) <= ?";
    params.push(endDate);
  }

  query += " GROUP BY p.id ORDER BY t.tanggal DESC";

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("❌ Error fetching piutang:", err);
      return res
        .status(500)
        .json({ message: "Gagal mengambil data piutang", error: err.message });
    }
    res.json(results);
  });
});

/**
 * GET /api/piutang/summary
 * Summary statistics for piutang
 */
router.get("/piutang/summary", (req, res) => {
  const query = `
    SELECT 
      SUM(CASE WHEN status IN ('open', 'partial') THEN sisa ELSE 0 END) as total_piutang_open,
      SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as total_piutang_paid,
      (SELECT SUM(jumlah) FROM pembayaran_piutang WHERE DATE(tanggal) = CURDATE()) as total_bayar_hari_ini
    FROM piutang
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error fetching piutang summary:", err);
      return res.status(500).json({
        message: "Gagal mengambil ringkasan piutang",
        error: err.message,
      });
    }
    res.json(
      results[0] || {
        total_piutang_open: 0,
        total_piutang_paid: 0,
        total_bayar_hari_ini: 0,
      },
    );
  });
});

/**
 * GET /api/piutang/:id
 * Detail piutang + payment history
 */
router.get("/piutang/:id", (req, res) => {
  const { id } = req.params;

  const queryPiutang = `
    SELECT p.*, pl.nama as nama_pelanggan, t.kode_transaksi
    FROM piutang p
    JOIN pelanggan pl ON p.pelanggan_id = pl.id
    JOIN transaksi t ON p.transaksi_id = t.id
    WHERE p.id = ?
  `;

  db.query(queryPiutang, [id], (err, results) => {
    if (err) {
      console.error("❌ Error fetching piutang detail:", err);
      return res.status(500).json({
        message: "Gagal mengambil detail piutang",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Piutang tidak ditemukan" });
    }

    const piutang = results[0];

    const queryHistory = `
      SELECT * FROM pembayaran_piutang 
      WHERE piutang_id = ? 
      ORDER BY tanggal DESC, created_at DESC
    `;

    db.query(queryHistory, [id], (err2, history) => {
      if (err2) {
        console.error("❌ Error fetching payment history:", err2);
        return res.status(500).json({
          message: "Gagal mengambil riwayat pembayaran",
          error: err2.message,
        });
      }

      res.json({
        ...piutang,
        history: history,
      });
    });
  });
});

/**
 * POST /api/piutang/:id/bayar
 * Record a payment and update piutang status
 */
router.post("/piutang/:id/bayar", (req, res) => {
  const { id } = req.params;
  const { jumlah, metode, keterangan } = req.body;

  if (!jumlah || jumlah <= 0) {
    return res.status(400).json({ message: "Jumlah pembayaran tidak valid" });
  }

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ message: "Internal server error" });

    // 1. Get current status and sisa
    db.query(
      "SELECT sisa, status FROM piutang WHERE id = ? FOR UPDATE",
      [id],
      (err, results) => {
        if (err || results.length === 0) {
          return db.rollback(() =>
            res.status(404).json({ message: "Piutang tidak ditemukan" }),
          );
        }

        const piutang = results[0];

        if (piutang.status === "paid") {
          return db.rollback(() =>
            res.status(400).json({ message: "Piutang sudah lunas" }),
          );
        }

        if (jumlah > piutang.sisa) {
          return db.rollback(() =>
            res
              .status(400)
              .json({ message: "Jumlah pembayaran melebihi sisa piutang" }),
          );
        }

        const newSisa = piutang.sisa - jumlah;
        const newStatus = newSisa === 0 ? "paid" : "partial";

        // 2. Insert into pembayaran_piutang
        const queryBayar =
          "INSERT INTO pembayaran_piutang (piutang_id, tanggal, jumlah, metode, keterangan) VALUES (?, CURDATE(), ?, ?, ?)";
        db.query(
          queryBayar,
          [id, jumlah, metode || "cash", keterangan],
          (err2) => {
            if (err2) {
              return db.rollback(() =>
                res.status(500).json({
                  message: "Gagal menyimpan pembayaran",
                  error: err2.message,
                }),
              );
            }

            // 3. Update piutang
            db.query(
              "UPDATE piutang SET sisa = ?, status = ? WHERE id = ?",
              [newSisa, newStatus, id],
              (err3) => {
                if (err3) {
                  return db.rollback(() =>
                    res.status(500).json({
                      message: "Gagal memperbarui data piutang",
                      error: err3.message,
                    }),
                  );
                }

                db.commit((err4) => {
                  if (err4) {
                    return db.rollback(() =>
                      res
                        .status(500)
                        .json({ message: "Gagal menyelesaikan transaksi" }),
                    );
                  }
                  res.json({
                    message: "✅ Pembayaran berhasil dicatat",
                    newSisa,
                    newStatus,
                  });
                });
              },
            );
          },
        );
      },
    );
  });
});

/**
 * DELETE /api/piutang/:id
 * Delete piutang (only if status is 'paid')
 */
router.delete("/piutang/:id", (req, res) => {
  const { id } = req.params;

  db.beginTransaction((err) => {
    if (err) {
      console.error("❌ Error starting transaction:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    // Check if piutang exists and status is 'paid'
    db.query(
      "SELECT status FROM piutang WHERE id = ?",
      [id],
      (err, results) => {
        if (err) {
          return db.rollback(() =>
            res.status(500).json({
              message: "Gagal memeriksa data piutang",
              error: err.message,
            }),
          );
        }

        if (results.length === 0) {
          return db.rollback(() =>
            res.status(404).json({ message: "Piutang tidak ditemukan" }),
          );
        }

        const piutang = results[0];

        if (piutang.status !== "paid") {
          return db.rollback(() =>
            res.status(400).json({
              message: "Hanya piutang dengan status 'Paid' yang dapat dihapus",
            }),
          );
        }

        // Delete payment history first
        db.query(
          "DELETE FROM pembayaran_piutang WHERE piutang_id = ?",
          [id],
          (err2) => {
            if (err2) {
              return db.rollback(() =>
                res.status(500).json({
                  message: "Gagal menghapus riwayat pembayaran",
                  error: err2.message,
                }),
              );
            }

            // Delete piutang
            db.query("DELETE FROM piutang WHERE id = ?", [id], (err3) => {
              if (err3) {
                return db.rollback(() =>
                  res.status(500).json({
                    message: "Gagal menghapus piutang",
                    error: err3.message,
                  }),
                );
              }

              db.commit((err4) => {
                if (err4) {
                  return db.rollback(() =>
                    res.status(500).json({
                      message: "Gagal menyelesaikan transaksi",
                    }),
                  );
                }
                res.json({ message: "✅ Piutang berhasil dihapus" });
              });
            });
          },
        );
      },
    );
  });
});

module.exports = router;
