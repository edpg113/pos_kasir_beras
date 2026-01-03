const express = require("express");
const router = express.Router();
const db = require("../db");
const exceljs = require("exceljs");
const PDFDocument = require("pdfkit");

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
      t.tanggal,
      p.namaProduk,
      p.modal,
      p.harga,
      p.harga_per_kg,
      td.qty,
      td.subtotal,
      (td.harga - p.modal) * td.qty as keuntungan,
      t.total
    FROM transaksi t
    JOIN transaksi_detail td ON t.id = td.transaksi_id
    JOIN produk p ON td.produk_id = p.id
    WHERE DATE(t.tanggal) BETWEEN ? AND ?
    ORDER BY t.tanggal DESC
  `;

  db.query(query, [start, end], (err, result) => {
    if (err) {
      console.error("❌ Error fetching data for export:", err);
      return res.status(500).json(err);
    }

    try {
      // Create PDF document
      const doc = new PDFDocument({ size: "A4", margin: 40 });

      const filenameDate = start === end ? start : `${start}_sampai_${end}`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=Laporan_Penjualan_${filenameDate}.pdf`
      );

      doc.pipe(res);

      doc.fontSize(16).text("Laporan Penjualan", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Periode: ${start} sampai ${end}`, { align: "center" });
      doc.moveDown(1);

      // Improved table rendering with wrapping, lines and repeated header
      const tableTop = doc.y + 10;
      const marginLeft = doc.page.margins.left || 40;
      const pageWidth = doc.page.width - (doc.page.margins.left || 40) - (doc.page.margins.right || 40);

      // Use relative widths so table fits the page regardless of paper size
      const colPercents = {
        tanggal: 0.10,
        produk: 0.18,
        qty: 0.05,
        harga_per_kg: 0.12,
        modal: 0.12,
        harga: 0.12,
        subtotal: 0.12,
        keuntungan: 0.12,
        total: 0.12,
      };

      const colWidths = {};
      Object.keys(colPercents).forEach((k) => {
        colWidths[k] = Math.floor(pageWidth * colPercents[k]);
      });

      // compute starting x positions
      const cols = [
        "tanggal",
        "produk",
        "qty",
        "harga_per_kg",
        "modal",
        "harga",
        "subtotal",
        "keuntungan",
        "total",
      ];

      const colX = {};
      let curX = marginLeft;
      cols.forEach((c) => {
        colX[c] = curX;
        curX += colWidths[c];
      });

      const headerHeight = 18;
      const rowPadding = 6;
      const usableHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;

      function drawHeader(y) {
        doc.font("Helvetica-Bold").fontSize(9);
        doc.fillColor("black");
        cols.forEach((c) => {
          const title = c === "tanggal" ? "Tanggal" : c === "produk" ? "Produk" : c === "harga_per_kg" ? "Harga/1kg" : c.charAt(0).toUpperCase() + c.slice(1);
          const align = c === "produk" || c === "tanggal" ? "left" : "right";
          doc.text(title, colX[c], y, { width: colWidths[c], align });
        });
        // draw line under header
        doc.strokeColor('#cccccc').moveTo(marginLeft, y + headerHeight - 4).lineTo(curX, y + headerHeight - 4).stroke();
        return y + headerHeight;
      }

      let y = tableTop;
      y = drawHeader(y);

      doc.font("Helvetica").fontSize(9);

      result.forEach((row) => {
        // measure height needed for product cell (wrap)
        const productHeight = doc.heightOfString(String(row.namaProduk || ""), { width: colWidths.produk });
        const tanggalHeight = doc.heightOfString(new Date(row.tanggal).toLocaleDateString("id-ID"), { width: colWidths.tanggal });
        const rowHeight = Math.max(productHeight, tanggalHeight, 12) + rowPadding;

        // add new page and header if not enough space
        if (y + rowHeight > doc.page.height - doc.page.margins.bottom - 20) {
          doc.addPage();
          y = doc.page.margins.top;
          y = drawHeader(y);
        }

        // draw cells
        doc.text(new Date(row.tanggal).toLocaleDateString("id-ID"), colX.tanggal, y, { width: colWidths.tanggal, align: "left" });
        doc.text(String(row.namaProduk || ""), colX.produk, y, { width: colWidths.produk, align: "left" });

        const hargaPerKg = row.harga_per_kg ? `Rp. ${Number(row.harga_per_kg).toLocaleString("id-ID")}` : "-";
        doc.text(hargaPerKg, colX.harga_per_kg, y, { width: colWidths.harga_per_kg, align: "right" });

        doc.text(row.modal ? `Rp. ${Number(row.modal).toLocaleString("id-ID")}` : "-", colX.modal, y, { width: colWidths.modal, align: "right" });
        doc.text(row.harga ? `Rp. ${Number(row.harga).toLocaleString("id-ID")}` : "-", colX.harga, y, { width: colWidths.harga, align: "right" });
        doc.text(row.qty != null ? String(row.qty) : "-", colX.qty, y, { width: colWidths.qty, align: "right" });
        doc.text(row.subtotal ? `Rp. ${Number(row.subtotal).toLocaleString("id-ID")}` : "-", colX.subtotal, y, { width: colWidths.subtotal, align: "right" });
        doc.text(row.keuntungan ? `Rp. ${Number(row.keuntungan).toLocaleString("id-ID")}` : "-", colX.keuntungan, y, { width: colWidths.keuntungan, align: "right" });
        doc.text(row.total ? `Rp. ${Number(row.total).toLocaleString("id-ID")}` : "-", colX.total, y, { width: colWidths.total, align: "right" });

        // draw horizontal separator (light)
        const sepY = y + rowHeight - (rowPadding / 2);
        doc.strokeColor('#eeeeee').moveTo(marginLeft, sepY).lineTo(curX, sepY).stroke();

        y += rowHeight;
      });

      doc.end();
    } catch (exportErr) {
      console.error("❌ Error generating pdf:", exportErr);
      res.status(500).send("Error exporting data");
    }
  });
});

module.exports = router;
