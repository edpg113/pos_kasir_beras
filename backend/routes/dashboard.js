const express = require("express");
const router = express.Router();
const db = require("../db");

// API GET DATA DASHBOARD STATISTIK
router.get("/dashboard-stats", (req, res) => {
  const query = `
  SELECT
    (SELECT IFNULL(SUM(total), 0) FROM transaksi WHERE MONTH(tanggal) = MONTH(CURRENT_DATE()) AND YEAR(tanggal) = YEAR(CURRENT_DATE())) AS total_penjualan,
    (SELECT IFNULL(SUM(total_nilai), 0) FROM retur WHERE tipe = 'penjualan' AND MONTH(tanggal) = MONTH(CURRENT_DATE()) AND YEAR(tanggal) = YEAR(CURRENT_DATE())) AS total_retur,
    (SELECT IFNULL(SUM(td.qty), 0) FROM transaksi_detail td JOIN transaksi t ON td.transaksi_id = t.id WHERE MONTH(t.tanggal) = MONTH(CURRENT_DATE()) AND YEAR(t.tanggal) = YEAR(CURRENT_DATE())) AS produk_terjual,
    (SELECT IFNULL(SUM(stok), 0) FROM produk) AS stok_beras
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error("❌ Dashboard stats error:", err);
      return res.status(500).json(err);
    }
    const data = result[0];
    res.json({
      ...data,
      net_sales: data.total_penjualan - data.total_retur,
    });
  });
});

module.exports = router;
