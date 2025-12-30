const express = require("express");
const router = express.Router();
const db = require("../db");
const exceljs = require("exceljs");

// GET /api/reports/summary
// Returns summary for date range (default: today)
router.get("/reports/summary", (req, res) => {
  const { date, startDate, endDate } = req.query;
  const start = startDate || date || new Date().toISOString().split("T")[0];
  const end = endDate || date || new Date().toISOString().split("T")[0];

  const query = `
    SELECT 
      COUNT(id) as jumlah_transaksi,
      IFNULL(SUM(total), 0) as gross_sales,
      (SELECT IFNULL(SUM(total_nilai), 0) FROM retur WHERE tipe = 'penjualan' AND DATE(tanggal) BETWEEN ? AND ?) as total_retur,
      (SELECT IFNULL(SUM(td.qty), 0) FROM transaksi_detail td JOIN transaksi t2 ON td.transaksi_id = t2.id WHERE DATE(t2.tanggal) BETWEEN ? AND ?) as total_terjual,
      (SELECT IFNULL(SUM((td.harga - p.modal) * td.qty), 0) 
       FROM transaksi_detail td 
       JOIN transaksi t3 ON td.transaksi_id = t3.id 
       JOIN produk p ON td.produk_id = p.id 
       WHERE DATE(t3.tanggal) BETWEEN ? AND ?) as total_keuntungan
    FROM transaksi 
    WHERE DATE(tanggal) BETWEEN ? AND ?
  `;

  db.query(
    query,
    [start, end, start, end, start, end, start, end],
    (err, result) => {
      if (err) {
        console.error("❌ Error fetching summary report:", err);
        return res.status(500).json(err);
      }
      const data = result[0];
      const net_sales = data.gross_sales - data.total_retur;
      const average =
        data.jumlah_transaksi > 0
          ? Math.round(data.gross_sales / data.jumlah_transaksi)
          : 0;

      res.json({
        ...data,
        total_penjualan: data.gross_sales,
        net_sales: net_sales,
        rata_rata: average,
      });
    }
  );
});

// GET /api/reports/top-products
// Returns top products for date range
router.get("/reports/top-products", (req, res) => {
  const { date, startDate, endDate } = req.query;
  const start = startDate || date || new Date().toISOString().split("T")[0];
  const end = endDate || date || new Date().toISOString().split("T")[0];

  const query = `
    SELECT 
      p.namaProduk as produk,
      SUM(td.subtotal) as penjualan,
      SUM(td.qty) as qty,
      SUM((td.harga - p.modal) * td.qty) as keuntungan
    FROM transaksi_detail td
    JOIN transaksi t ON td.transaksi_id = t.id
    JOIN produk p ON td.produk_id = p.id
    WHERE DATE(t.tanggal) BETWEEN ? AND ?
    GROUP BY p.id
    ORDER BY qty DESC
    LIMIT 5
  `;

  db.query(query, [start, end], (err, result) => {
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
      m.nama_bulan as bulan,
      IFNULL(sales.total_bruto, 0) as total_bruto,
      IFNULL(returns.total_retur, 0) as total_retur,
      IFNULL(sales.qty, 0) as qty
    FROM (
      SELECT 1 as num, 'Januari' as nama_bulan UNION SELECT 2, 'Februari' UNION SELECT 3, 'Maret' 
      UNION SELECT 4, 'April' UNION SELECT 5, 'Mei' UNION SELECT 6, 'Juni' 
      UNION SELECT 7, 'Juli' UNION SELECT 8, 'Agustus' UNION SELECT 9, 'September' 
      UNION SELECT 10, 'Oktober' UNION SELECT 11, 'November' UNION SELECT 12, 'Desember'
    ) m
    LEFT JOIN (
      SELECT 
        MONTH(t.tanggal) as bulan_num,
        SUM(td.subtotal) as total_bruto,
        SUM(td.qty) as qty
      FROM transaksi t
      JOIN transaksi_detail td ON t.id = td.transaksi_id
      WHERE YEAR(t.tanggal) = ?
      GROUP BY MONTH(t.tanggal)
    ) sales ON m.num = sales.bulan_num
    LEFT JOIN (
      SELECT 
        MONTH(r.tanggal) as bulan_num,
        SUM(r.total_nilai) as total_retur
      FROM retur r
      WHERE YEAR(r.tanggal) = ? AND r.tipe = 'penjualan'
      GROUP BY MONTH(r.tanggal)
    ) returns ON m.num = returns.bulan_num
    ORDER BY m.num ASC
  `;

  db.query(query, [currentYear, currentYear], (err, result) => {
    if (err) {
      console.error("❌ Error fetching monthly report:", err);
      return res.status(500).json(err);
    }

    const formattedResult = result.map((item) => ({
      ...item,
      total: item.total_bruto, // for compatibility
      net_sales: item.total_bruto - item.total_retur,
    }));

    res.json(formattedResult);
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
// Export transaction data for date range to Excel
router.get("/reports/export", async (req, res) => {
  const { date, startDate, endDate } = req.query;
  const start = startDate || date || new Date().toISOString().split("T")[0];
  const end = endDate || date || new Date().toISOString().split("T")[0];

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
    WHERE DATE(t.tanggal) BETWEEN ? AND ?
    ORDER BY t.tanggal DESC
  `;

  db.query(query, [start, end], async (err, result) => {
    if (err) {
      console.error("❌ Error fetching data for export:", err);
      return res.status(500).json(err);
    }

    try {
      const workbook = new exceljs.Workbook();
      const worksheet = workbook.addWorksheet("Laporan Penjualan");

      // ... existing worksheet columns ...
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

      const filenameDate = start === end ? start : `${start}_sampai_${end}`;
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=Laporan_Penjualan_${filenameDate}.xlsx`
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
