const express = require("express");
const router = express.Router();
const db = require("../db");

// API GET Pelanggan
router.get("/pelanggan", (req, res) => {
  const query = "SELECT * FROM pelanggan ORDER BY nama ASC";
  db.query(query, (err, result) => {
    if (err) {
      console.error("❌ DB error on get pelanggan:", err);
      return res
        .status(500)
        .json({ message: "Gagal mengambil data pelanggan." });
    }
    res.json(result);
  });
});

// API POST Pelanggan
router.post("/addpelanggan", (req, res) => {
  const { nama, telepon, alamat, kategori } = req.body;
  if (!nama || !telepon || !alamat || !kategori) {
    return res
      .status(400)
      .json({ message: "Nama, telepon, alamat, dan kategori harus diisi." });
  }

  const query =
    "INSERT INTO pelanggan (nama, telepon, alamat, kategori) VALUES (?, ?, ?, ?)";
  db.query(query, [nama, telepon, alamat, kategori], (err, result) => {
    if (err) {
      console.error("❌ DB error on add pelanggan:", err);
      return res.status(500).json({ message: "Gagal menambahkan pelanggan." });
    }

    // Return the newly created customer data
    const newPelanggan = {
      id: result.insertId,
      nama,
      telepon,
      alamat,
      kategori,
    };
    res
      .status(201)
      .json({ message: "Pelanggan berhasil ditambahkan", data: newPelanggan });
  });
});

// API UPDATE Pelanggan
router.put("/pelanggan/:id", (req, res) => {
  const { id } = req.params;
  const { nama, telepon, alamat, kategori } = req.body;

  if (!nama || !telepon || !alamat || !kategori) {
    return res
      .status(400)
      .json({ message: "Nama, telepon, alamat, dan kategori harus diisi." });
  }

  const query =
    "UPDATE pelanggan SET nama = ?, telepon = ?, alamat = ?, kategori = ? WHERE id = ?";
  db.query(query, [nama, telepon, alamat, kategori, id], (err, result) => {
    if (err) {
      console.error("❌ DB error on update pelanggan:", err);
      return res.status(500).json({ message: "Gagal mengupdate pelanggan." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Pelanggan tidak ditemukan." });
    }

    res.json({
      message: "Pelanggan berhasil diupdate",
      data: { id, nama, telepon, alamat, kategori },
    });
  });
});

// API DELETE Pelanggan
router.delete("/pelanggan/:id", (req, res) => {
  const { id } = req.params;

  const query = "DELETE FROM pelanggan WHERE id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("❌ DB error on delete pelanggan:", err);
      return res.status(500).json({ message: "Gagal menghapus pelanggan." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Pelanggan tidak ditemukan." });
    }

    res.json({ message: "Pelanggan berhasil dihapus", id });
  });
});

module.exports = router;
