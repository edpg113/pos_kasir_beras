const express = require("express");
const router = express.Router();
const db = require("../db");

// API POST Kategori
router.post("/addcategories", (req, res) => {
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
router.get("/categories", (req, res) => {
  const query = "SELECT * FROM kategori";
  db.query(query, (err, result) => {
    if (err)
      return res.status(500).json({ message: "Gagal menambahkan kategori" });
    res.json(result);
  });
});

// API EDIT Kategori
router.put("/editcategories/:id", (req, res) => {
  const {id} = req.params;
  const {kategori} = req.body;
  const query = "UPDATE kategori SET kategori = ? WHERE id = ?";
  db.query(query, [kategori, id], (err) => {
    if (err) return res.status(500).json("Gagal mengubah kategori", err);
    res.json("Kategori berhasil di ubah");
  })
})

// API DELETE Kategori
router.delete("/deletecategories/:id", (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM kategori WHERE id = ?";
  db.query(query, [id], (err) => {
    if (err) return res.status(500).json("Gagal menghapus kategori", err);
    res.json("Berhasil menghapus kategori");
  });
});

module.exports = router;
