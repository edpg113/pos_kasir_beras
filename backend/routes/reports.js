const express = require("express");
const router = express.Router();
const db = require("../db");
const exceljs = require("exceljs");

// GET /api/reports/summary
// Returns daily summary (default: today) or specific date
router.get("/reports/summary", (req, res) => {
  const { date } = req.query; // format: YYYY-MM-DD
  const filterDate = date || new Date().toISOString().split("T")[0];

  const query = `
    SELECT 
      COUNT(id) as jumlah_transaksi,
      IFNULL(SUM(total), 0) as total_penjualan,
      (SELECT IFNULL(SUM(td.qty), 0) FROM transaksi_detail td JOIN transaksi t2 ON td.transaksi_id = t2.id WHERE DATE(t2.tanggal) = ?) as total_terjual,
      (SELECT IFNULL(SUM((td.harga - p.modal) * td.qty), 0) 
       FROM transaksi_detail td 
       JOIN transaksi t3 ON td.transaksi_id = t3.id 
       JOIN produk p ON td.produk_id = p.id 
       WHERE DATE(t3.tanggal) = ?) as total_keuntungan
    FROM transaksi 
    WHERE DATE(tanggal) = ?
  `;

  db.query(query, [filterDate, filterDate, filterDate], (err, result) => {
    if (err) {
      console.error("❌ Error fetching summary report:", err);
      return res.status(500).json(err);
    }
    const data = result[0];
    const average =
      data.jumlah_transaksi > 0
        ? Math.round(data.total_penjualan / data.jumlah_transaksi)
        : 0;

    res.json({
      ...data,
      rata_rata: average,
    });
  });
});

// GET /api/reports/top-products
// Returns top products for specific date
router.get("/reports/top-products", (req, res) => {
  const { date } = req.query;
  const filterDate = date || new Date().toISOString().split("T")[0];

  const query = `
    SELECT 
      p.namaProduk as produk,
      SUM(td.subtotal) as penjualan,
      SUM(td.qty) as qty,
      SUM((td.harga - p.modal) * td.qty) as keuntungan
    FROM transaksi_detail td
    JOIN transaksi t ON td.transaksi_id = t.id
    JOIN produk p ON td.produk_id = p.id
    WHERE DATE(t.tanggal) = ?
    GROUP BY p.id
    ORDER BY qty DESC
    LIMIT 5
  `;

  db.query(query, [filterDate], (err, result) => {
    if (err) {
      console.error("❌ Error fetching top products:", err);
      return res.status(500).json(err);
    }
    res.json(result);
  });
});

// GET /api/reports/monthly
// Returns monthly sales for current year
router.get("/reports/monthly", (req, res) => {
  const currentYear = new Date().getFullYear();
  const query = `
    SELECT 
      MONTHNAME(t.tanggal) as bulan,
      SUM(td.subtotal) as total,
      SUM(td.qty) as qty
    FROM transaksi t
    JOIN transaksi_detail td ON t.id = td.transaksi_id
    WHERE YEAR(t.tanggal) = ?
    GROUP BY MONTH(t.tanggal), MONTHNAME(t.tanggal)
    ORDER BY MONTH(t.tanggal) ASC
  `;

  db.query(query, [currentYear], (err, result) => {
    if (err) {
      console.error("❌ Error fetching monthly report:", err);
      return res.status(500).json(err);
    }
    res.json(result);
  });
});

// GET /api/reports/customers
// Returns customer stats
router.get("/reports/customers", (req, res) => {
  const query = `
    SELECT 
      kategori,
      COUNT(*) as jumlah
    FROM pelanggan
    GROUP BY kategori
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error("❌ Error fetching customer stats:", err);
      return res.status(500).json(err);
    }

    // Calculate percentage
    const totalCustomers = result.reduce((sum, item) => sum + item.jumlah, 0);
    const dataWithPercentage = result.map((item) => ({
      ...item,
      persentase:
        totalCustomers > 0
          ? Math.round((item.jumlah / totalCustomers) * 100) + "%"
          : "0%",
    }));

    res.json(dataWithPercentage);
  });
});

// GET /api/reports/export
// Export transaction data to Excel
router.get("/reports/export", async (req, res) => {
  const { date } = req.query;
  const filterDate = date || new Date().toISOString().split("T")[0];

  const query = `
    SELECT 
      t.id,
      t.tanggal,
      t.pembeli,
      t.total,
      p.namaProduk,
      p.modal,
      td.qty,
      td.harga,
      td.subtotal,
      (td.harga - p.modal) * td.qty as keuntungan
    FROM transaksi t
    JOIN transaksi_detail td ON t.id = td.transaksi_id
    JOIN produk p ON td.produk_id = p.id
    WHERE DATE(t.tanggal) = ?
    ORDER BY t.tanggal DESC
  `;

  db.query(query, [filterDate], async (err, result) => {
    if (err) {
      console.error("❌ Error fetching data for export:", err);
      return res.status(500).json(err);
    }

    try {
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet("Laporan Penjualan");

      worksheet.columns = [
        { header: "No Transaksi", key: "id", width: 10 },
        { header: "Tanggal", key: "tanggal", width: 20 },
        { header: "Pembeli", key: "pembeli", width: 20 },
        { header: "Produk", key: "namaProduk", width: 25 },
        { header: "Modal", key: "modal", width: 15 },
        { header: "Harga Jual", key: "harga", width: 15 },
        { header: "Qty", key: "qty", width: 10 },
        { header: "Subtotal", key: "subtotal", width: 15 },
        { header: "Keuntungan", key: "keuntungan", width: 15 },
        { header: "Total Transaksi", key: "total", width: 15 },
      ];

      result.forEach((row) => {
        worksheet.addRow(row);
      });

      // Style header
      worksheet.getRow(1).font = { bold: true };

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=Laporan_Penjualan_${filterDate}.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (exportErr) {
      console.error("❌ Error generating excel:", exportErr);
      res.status(500).send("Error exporting data");
    }
  });
});

module.exports = router;
