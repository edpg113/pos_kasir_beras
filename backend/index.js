const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "toko_beras",
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection error:", err);
    return;
  }
  console.log("✅ MySQL connected!");
});

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});

// API Create User
app.post("/api/newusers", (req, res) => {
  const { nama, email, password, role } = req.body;

  // Validasi input
  if (!nama || !email || !password || !role) {
    console.log("❌ Validation failed - missing fields");
    return res.status(400).json({ error: "Semua field harus diisi!" });
  }

  const query =
    "INSERT INTO user (nama, email, password, role) VALUES (?, ?, ?, ?)";

  db.query(query, [nama, email, password, role], (err, result) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).json({
        error: "Database error",
        details: err.message,
      });
    }
    console.log("✅ User created with ID:", result.insertId);
    return res.status(201).json({
      message: "User created successfully",
      userId: result.insertId,
    });
  });
});

// API Login User
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const query = "SELECT * FROM user WHERE email = ? AND password = ?";
  db.query(query, [email, password], (err, result) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).json({
        error: "Database error",
        details: err.message,
      });
    }
    if (result.length === 0) {
      console.log("❌ Login failed - invalid credentials");
      return res.status(401).json({ error: "Invalid email or password" });
    }
    console.log("✅ User logged in:", result[0].id);
    return res.status(200).json({
      message: "Login successful",
      user: result[0],
    });
  });
});

// API GET DATA DASHBOARD STATISTIK
app.get("/api/dashboard-stats", (req, res) => {
  const query = `
  SELECT
  (SELECT IFNULL(SUM(total),0) FROM transaksi) AS total_penjualan,
  (SELECT IFNULL(SUM(qty),0) FROM transaksi_detail) AS produk_terjual,
  (SELECT IFNULL(SUM(stok), 0) FROM produk) AS stok_beras
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error("❌ Dashboard stats error:", err);
      return res.status(500).json(err);
    }
    res.json(result[0]);
  });
});

// API POST Product
app.post("/api/products", (req, res) => {
  const { namaProduk, kategori, harga, modal, stok } = req.body;
  const query =
    "INSERT INTO produk (namaProduk, kategori, harga, modal, stok) VALUES (?, ?, ?, ?, ?)";
  db.query(query, [namaProduk, kategori, harga, modal, stok], (err, result) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).json({ error: "Database error", details: err });
    }
    console.log("✅ Product added with ID:", result.insertId);
    return res
      .status(200)
      .json({ message: "Produk berhasil ditambahkan", result });
  });
});

// API GET Products
app.get("/api/getproducts", (req, res) => {
  const query = "SELECT * FROM produk";
  db.query(query, (err, result) => {
    if (err)
      return res.status(500).json({ error: "Database error", details: err });
    res.json(result);
  });
});

// API EDIT Products
app.put("/api/editproduct/:id", (req, res) => {
  const { id } = req.params;
  const { namaProduk, kategori, harga, modal, stok } = req.body;
  const query =
    "UPDATE produk SET namaProduk = ?, kategori = ?, harga = ?, modal = ?, stok = ? WHERE id = ?";
  db.query(query, [namaProduk, kategori, harga, modal, stok, id], (err) => {
    if (err) return res.status(500).json("Gagal mengubah produk", err);
    res.json("Produk berhasil di ubah");
  });
});

// API DELETE Products
app.delete("/api/deleteproduct/:id", (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM produk WHERE id = ?";
  db.query(query, [id], (err) => {
    if (err) return res.status(500).json("Gagal menghapus produk", err);
    res.json("Berhasil menghapus produk");
  });
});

// API POST Kategori
app.post("/api/addcategories", (req, res) => {
  const { category } = req.body;
  const query = "INSERT INTO kategori (kategori) VALUES (?)";
  db.query(query, [category], (err, result) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).json({ error: "Database error", details: err });
    }
    console.log("✅ Category added :", result.insertId);
    return res
      .status(200)
      .json({ message: "Category berhasil ditambahkan", result });
  });
});

// API GET Kategori
app.get("/api/categories", (req, res) => {
  const query = "SELECT * FROM kategori";
  db.query(query, (err, result) => {
    if (err)
      return res.status(500).json({ message: "Gagal menambahkan kategori" });
    res.json(result);
  });
});

// API EDIT Kategori
app.put("/api/editcategories/:id", (req, res) => {
  const {id} = req.params;
  const {kategori} = req.body;
  const query = "UPDATE kategori SET kategori = ? WHERE id = ?";
  db.query(query, [kategori, id], (err) => {
    if (err) return res.status(500).json("Gagal mengubah kategori", err);
    res.json("Kategori berhasil di ubah");
  })
})

// API DELETE Kategori
app.delete("/api/deletecategories/:id", (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM kategori WHERE id = ?";
  db.query(query, [id], (err) => {
    if (err) return res.status(500).json("Gagal menghapus kategori", err);
    res.json("Berhasil menghapus kategori");
  });
});

// API POST Transaksi
app.post("/api/transaksi", (req, res) => {
  const { pembeli, total, bayar, kembalian, items } = req.body;

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

    const queryTransaksi =
      "INSERT INTO transaksi (tanggal, pembeli, total, bayar, kembalian) VALUES (NOW(), ?, ?, ?, ?)";

    db.query(
      queryTransaksi,
      [pembeli, total, bayar, kembalian],
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
app.get("/api/gettransaksi", (req, res) => {
  const query = `
  SELECT
  td.id AS transaksi_detail_id,
  t.id AS transaksi_id,
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
ORDER BY t.tanggal DESC
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }
    res.json(result);
  });
});

// API GET Inventory
app.get("/api/inventory", (req, res) => {
  const query = `
      SELECT
      p.id,
      p.namaProduk AS produk,
      p.stok,
      p.min_stok AS minStok,
      p.reorder_qty AS reorder,
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
app.patch("/api/inventory/:id/add-stock", (req, res) => {
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
      db.query(logStockQuery, [id, supplier, qty], (logErr) => {
        if (logErr) {
          console.error("❌ DB error on logging stock:", logErr);
          return db.rollback(() => {
            res.status(500).json({ message: "Gagal mencatat riwayat stok." });
          });
        }

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
          res.json({ message: "Stok berhasil ditambahkan dan dicatat." });
        });
      });
    });
  });
});

// API Post Setting
app.post("/api/setting/:id", (req, res) => {
  const { id } = req.params;
  const { namaToko, pemilik, email, telepon, alamat } = req.body;
  const query =
    "UPDATE setting SET namaToko = ?, pemilik = ?, email = ?, telepon = ?, alamat = ? WHERE id = ?";
  db.query(
    query,
    [namaToko, pemilik, email, telepon, alamat, id],
    (err, result) => {
      if (err) {
        console.error("❌ Database error:", err);
        return res.status(500).json({
          error: "Database error",
          details: err.message,
        });
      }
      console.log("✅ Setting saved with ID:", result.insertId);
      return res.status(201).json({
        message: "Setting saved successfully",
        settingId: result.insertId,
      });
    }
  );
});

// API Get Setting
app.get("/api/getsetting", (req, res) => {
  const query = "SELECT * FROM setting ORDER BY id DESC LIMIT 1";
  db.query(query, (err, result) => {
    if (err)
      return res
        .status(500)
        .json({ error: "Database error", details: err.message });
    res.json(result);
  });
});

// API Change Password
app.put("/api/user/password/:id", (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ error: "Password lama dan baru harus diisi!" });
  }

  // Ambil password saat ini dari database
  const getUserQuery = "SELECT password FROM user WHERE id = ?";
  db.query(getUserQuery, [id], (err, result) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    const currentPassword = result[0].password;

    // Verifikasi password lama
    if (oldPassword !== currentPassword) {
      return res.status(401).json({ error: "Password lama salah!" });
    }

    // Update ke password baru
    const updatePasswordQuery = "UPDATE user SET password = ? WHERE id = ?";
    db.query(updatePasswordQuery, [newPassword, id], (updateErr) => {
      if (updateErr) {
        console.error("❌ Database error on update:", updateErr);
        return res.status(500).json({ error: "Gagal mengubah password" });
      }

      res.json({ message: "Password berhasil diubah" });
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res
    .status(500)
    .json({ error: "Internal server error", details: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 API Endpoint: http://localhost:${PORT}/api/newusers`);
});

module.exports = db;
