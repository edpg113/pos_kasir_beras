const express = require("express");
const router = express.Router();
const db = require("../db");

// API Update Setting
router.put("/setting/:id", (req, res) => {
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
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Setting not found" });
      }
      return res.status(200).json({
        message: "Setting saved successfully",
      });
    }
  );
});

// API Get Setting
router.get("/getsetting", (req, res) => {
  const query = "SELECT * FROM setting ORDER BY id DESC LIMIT 1";
  db.query(query, (err, result) => {
    if (err)
      return res
        .status(500)
        .json({ error: "Database error", details: err.message });
    res.json(result);
  });
});

module.exports = router;
