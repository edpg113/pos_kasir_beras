const express = require("express");
const router = express.Router();
const db = require("../db");

// API GET DATA DASHBOARD STATISTIK
router.get("/dashboard-stats", (req, res) => {
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

module.exports = router;
