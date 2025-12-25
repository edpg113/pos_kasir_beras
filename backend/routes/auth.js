const express = require("express");
const router = express.Router();
const db = require("../db");

// API Create User
router.post("/newusers", (req, res) => {
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
router.post("/login", (req, res) => {
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

// API Change Password
router.put("/user/password/:id", (req, res) => {
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

module.exports = router;
