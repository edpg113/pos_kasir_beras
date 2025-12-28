const express = require("express");
const router = express.Router();
const db = require("../db");

// Ensure is_active column exists
const ensureColumn = () => {
  const query = "SHOW COLUMNS FROM produk LIKE 'is_active'";
  db.query(query, (err, results) => {
    if (!err && results.length === 0) {
      const alterQuery =
        "ALTER TABLE produk ADD COLUMN is_active TINYINT(1) DEFAULT 1";
      db.query(alterQuery, (err2) => {
        if (err2) console.error("❌ Gagal menambah kolom is_active:", err2);
        else console.log("✅ Kolom is_active berhasil ditambahkan");
      });
    }
  });
};
ensureColumn();

// API POST Product
router.post("/products", (req, res) => {
  const { namaProduk, kategori, harga, modal, stok } = req.body;
  const query =
    "INSERT INTO produk (namaProduk, kategori, harga, modal, stok, is_active) VALUES (?, ?, ?, ?, ?, 1)";
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
router.get("/getproducts", (req, res) => {
  const query = "SELECT * FROM produk WHERE is_active = 1";
  db.query(query, (err, result) => {
    if (err)
      return res.status(500).json({ error: "Database error", details: err });
    res.json(result);
  });
});

// API EDIT Products
router.put("/editproduct/:id", (req, res) => {
  const { id } = req.params;
  const { namaProduk, kategori, harga, modal, stok } = req.body;
  const query =
    "UPDATE produk SET namaProduk = ?, kategori = ?, harga = ?, modal = ?, stok = ? WHERE id = ?";
  db.query(query, [namaProduk, kategori, harga, modal, stok, id], (err) => {
    if (err) return res.status(500).json("Gagal mengubah produk");
    res.json("Produk berhasil di ubah");
  });
});

// API DELETE Products (Soft Delete)
router.delete("/deleteproduct/:id", (req, res) => {
  const { id } = req.params;
  const query = "UPDATE produk SET is_active = 0 WHERE id = ?";
  db.query(query, [id], (err) => {
    if (err) {
      console.error("❌ Gagal menonaktifkan produk:", err);
      return res.status(500).json("Gagal menghapus produk");
    }
    res.json("Berhasil menghapus produk");
  });
});

module.exports = router;
