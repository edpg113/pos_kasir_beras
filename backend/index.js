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

// API POST Product
app.post("/api/products", (req, res) => {
  const { namaProduk, kategori, harga, stok, status } = req.body;
  const query =
    "INSERT INTO produk (namaProduk, kategori, harga, stok, status) VALUES (?, ?, ?, ?, ?)";
  db.query(
    query,
    [namaProduk, kategori, harga, stok, status],
    (err, result) => {
      if (err) {
        console.error("❌ Database error:", err);
        return res.status(500).json({ error: "Database error", details: err });
      }
      console.log("✅ Product added with ID:", result.insertId);
      return res
        .status(200)
        .json({ message: "Produk berhasil ditambahkan", result });
    }
  );
});

// API Get Products
app.get("/api/getproducts", (req, res) => {
  const query = "SELECT * FROM produk";
  db.query(query, (err, result) => {
    if (err)
      return res.status(500).json({ error: "Database error", details: err });
    res.json(result);
  });
});

// API POST Transaksi
app.post("/api/transaksi", (req, res) => {
  const { kasir_id, pembeli, total, bayar, kembalian, items } = req.body;

  if (!items || items.length === 0) {
    return res
      .status(400)
      .json({ message: "Item transaksi tidak boleh kosong!" });
  }
  const insertTransaksi = `INSERT INTO transaksi (tanggal, kasir_id, pembeli, total, bayar, kembalian) VALUES (NOW(), ?, ?, ?, ?, ?)`;

  db.query(
    insertTransaksi,
    [kasir_id, pembeli, total, bayar, kembalian],
    (err, result) => {
      if (err) {
        console.error("❌ Gagal insert transaksi", err);
        return res.status(500).json({ error: "Gagal menyimpan transaksi" });
      }

      const transaksiId = result.insertId;

      const insertItems = items.map((item) => [
        transaksiId,
        item.product_id,
        item.qty,
        item.harga,
        item.subtotal,
      ]);

      const queryItem = `INSERT INTO transaksi_item (transaksi_id, produk_id, qty, harga, subtotal) VALUES ?`;

      db.query(queryItem, [insertItems], (err) => {
        if (err) {
          console.error("❌ Gagal insert item transaksi", err);
          return res.status(500).json({ error: "Gagal menyimpan transaksi" });
        }

        // Update stok produk
        items.forEach((item) => {
          db.query("UPDATE produk SET stok = stok - ? WHERE id = ?", [
            item.qty,
            item.product_id,
          ]);
        });

        return res.status(201).json({
          message: "Transaksi berhasil disimpan!",
          transaksi_id: transaksiId,
        });
      });
    }
  );
});

// API Get Transaksi
app.get("/api/gettransaksi", (req, res) => {
  const query = "SELECT * FROM transaksi";
  db.query(query, (err, result) => {
    if (err)
      return res.status(500).json({ error: "Database error", details: err });
    res.json(result);
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
