const express = require("express");
const router = express.Router();
const db = require("../db");

// API POST Product
router.post("/products", (req, res) => {
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
router.get("/getproducts", (req, res) => {
  const query = "SELECT * FROM produk";
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
    if (err) return res.status(500).json("Gagal mengubah produk", err);
    res.json("Produk berhasil di ubah");
  });
});

// API DELETE Products
router.delete("/deleteproduct/:id", (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM produk WHERE id = ?";
  db.query(query, [id], (err) => {
    if (err) return res.status(500).json("Gagal menghapus produk", err);
    res.json("Berhasil menghapus produk");
  });
});

module.exports = router;
