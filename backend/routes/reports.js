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
      (SELECT IFNULL(SUM(sisa), 0) FROM piutang) as total_piutang,
      (SELECT IFNULL(SUM(td.qty), 0) FROM transaksi_detail td JOIN transaksi t2 ON td.transaksi_id = t2.id WHERE DATE(t2.tanggal) BETWEEN ? AND ?) as total_terjual,
      (SELECT IFNULL(SUM((td.harga - p.modal) * td.qty), 0) 
       FROM transaksi_detail td 
       JOIN transaksi t3 ON td.transaksi_id = t3.id 
       JOIN produk p ON td.produk_id = p.id 
       WHERE DATE(t3.tanggal) BETWEEN ? AND ?) as total_keuntungan
    FROM transaksi 
    WHERE DATE(tanggal) BETWEEN ? AND ?
  `;

  db.query(query, [start, end, start, end, start, end], (err, result) => {
    if (err) {
      console.error("❌ Error fetching summary report:", err);
      return res.status(500).json(err);
    }
    const data = result[0];
    const average =
      data.jumlah_transaksi > 0
        ? Math.round(data.gross_sales / data.jumlah_transaksi)
        : 0;

    res.json({
      ...data,
      total_penjualan: data.gross_sales,
      rata_rata: average,
    });
  });
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

// GET /api/reports/data
// Returns report data as JSON for frontend printing
router.get("/reports/data", async (req, res) => {
  const { date, startDate, endDate } = req.query;
  const start = startDate || date || new Date().toISOString().split("T")[0];
  const end = endDate || date || new Date().toISOString().split("T")[0];

  const querySales = `
    SELECT 
      t.id as transaksi_id,
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

  const queryNewPiutang = `
    SELECT 
      pl.nama AS nama_pelanggan, 
      GROUP_CONCAT(pr.namaProduk SEPARATOR ', ') AS produk,
      p.total, 
      p.status,
      p.tanggal
    FROM piutang p
    JOIN pelanggan pl ON p.pelanggan_id = pl.id
    JOIN transaksi t ON p.transaksi_id = t.id
    JOIN transaksi_detail td ON t.id = td.transaksi_id
    JOIN produk pr ON td.produk_id = pr.id
    WHERE DATE(p.tanggal) BETWEEN ? AND ?
    GROUP BY p.id
    ORDER BY p.tanggal DESC
  `;

  const queryPayments = `
    SELECT 
      pl.nama AS nama_pelanggan, 
      pp.jumlah, 
      pp.metode,
      pp.tanggal
    FROM pembayaran_piutang pp
    JOIN piutang p ON pp.piutang_id = p.id
    JOIN pelanggan pl ON p.pelanggan_id = pl.id
    WHERE DATE(pp.tanggal) BETWEEN ? AND ?
    ORDER BY pp.tanggal DESC
  `;

  const queryOverallPiutang =
    "SELECT IFNULL(SUM(sisa), 0) as total_sisa FROM piutang";

  const executeQuery = (query, params) => {
    return new Promise((resolve, reject) => {
      db.query(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  try {
    const [salesDetails, newPiutang, payments, overallPiutang] =
      await Promise.all([
        executeQuery(querySales, [start, end]),
        executeQuery(queryNewPiutang, [start, end]),
        executeQuery(queryPayments, [start, end]),
        executeQuery(queryOverallPiutang, []),
      ]);

    res.json({
      salesDetails,
      newPiutang,
      payments,
      overallPiutang: overallPiutang[0].total_sisa,
    });
  } catch (err) {
    console.error("❌ Error fetching report data:", err);
    res
      .status(500)
      .json({ message: "Gagal mengambil data laporan", error: err.message });
  }
});

// GET /api/reports/export
// Export transaction data for date range to PDF with Piutang info
router.get("/reports/export", async (req, res) => {
  const { date, startDate, endDate } = req.query;
  const start = startDate || date || new Date().toISOString().split("T")[0];
  const end = endDate || date || new Date().toISOString().split("T")[0];

  const querySales = `
    SELECT 
      t.id as transaksi_id,
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

  const queryNewPiutang = `
    SELECT 
      pl.nama AS nama_pelanggan, 
      GROUP_CONCAT(pr.namaProduk SEPARATOR ', ') AS produk,
      p.total, 
      p.status,
      p.tanggal
    FROM piutang p
    JOIN pelanggan pl ON p.pelanggan_id = pl.id
    JOIN transaksi t ON p.transaksi_id = t.id
    JOIN transaksi_detail td ON t.id = td.transaksi_id
    JOIN produk pr ON td.produk_id = pr.id
    WHERE DATE(p.tanggal) BETWEEN ? AND ?
    GROUP BY p.id
    ORDER BY p.tanggal DESC
  `;

  const queryPayments = `
    SELECT 
      pl.nama AS nama_pelanggan, 
      pp.jumlah, 
      pp.metode,
      pp.tanggal
    FROM pembayaran_piutang pp
    JOIN piutang p ON pp.piutang_id = p.id
    JOIN pelanggan pl ON p.pelanggan_id = pl.id
    WHERE DATE(pp.tanggal) BETWEEN ? AND ?
    ORDER BY pp.tanggal DESC
  `;

  const queryOverallPiutang =
    "SELECT IFNULL(SUM(sisa), 0) as total_sisa FROM piutang";

  const executeQuery = (query, params) => {
    return new Promise((resolve, reject) => {
      db.query(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  try {
    const [salesDetails, newPiutang, payments, overallPiutang] =
      await Promise.all([
        executeQuery(querySales, [start, end]),
        executeQuery(queryNewPiutang, [start, end]),
        executeQuery(queryPayments, [start, end]),
        executeQuery(queryOverallPiutang, []),
      ]);

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const filenameDate = start === end ? start : `${start}_sampai_${end}`;

    // Buffer the PDF
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="Laporan_POS_${filenameDate}.pdf"`
      );
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    });

    // HEADER
    doc
      .fontSize(18)
      .font("Times-Bold")
      .text("Laporan Harian Kasir", { align: "center" });
    doc.moveDown(0.2);
    doc
      .fontSize(10)
      .font("Times-Roman")
      .text(`Periode: ${start} sampai ${end}`, { align: "center" });
    doc.moveDown(1);

    const marginLeft = 40;
    const pageWidth = doc.page.width - 80;

    // Helper to draw row and handle wrap
    const drawRow = (cols, widths, xPos, rowData, isHeader = false) => {
      const startY = doc.y;
      let maxY = startY;

      doc.font(isHeader ? "Times-Bold" : "Times-Roman").fontSize(9);

      cols.forEach((c) => {
        const align =
          c === "produk" || c === "tanggal" || c === "nama_pelanggan"
            ? "left"
            : "right";
        const text = isHeader
          ? c.charAt(0).toUpperCase() + c.slice(1).replace("_", " ")
          : String(rowData[c] || "");

        doc.text(text, xPos[c], startY, {
          width: widths[c],
          align,
        });

        if (doc.y > maxY) maxY = doc.y;
      });

      doc.y = maxY; // Move doc.y to the bottom of the tallest cell
      doc.moveDown(0.2);
    };

    const drawHeader = (headerCols, headerWidths, headerX) => {
      drawRow(headerCols, headerWidths, headerX, {}, true);
      doc
        .strokeColor("#000")
        .lineWidth(0.5)
        .moveTo(marginLeft, doc.y)
        .lineTo(marginLeft + pageWidth, doc.y)
        .stroke();
      doc.moveDown(0.5);
    };

    // --- SECTION 1: PENJUALAN ---
    doc
      .fontSize(12)
      .font("Times-Bold")
      .text("1. Detail Penjualan Produk", marginLeft);
    doc.moveDown(0.5);

    const salesCols = [
      "tanggal",
      "produk",
      "qty",
      "harga",
      "subtotal",
      "keuntungan",
    ];
    const salesWidths = {
      tanggal: pageWidth * 0.15,
      produk: pageWidth * 0.35,
      qty: pageWidth * 0.08,
      harga: pageWidth * 0.14,
      subtotal: pageWidth * 0.14,
      keuntungan: pageWidth * 0.14,
    };

    let curX = marginLeft;
    const salesX = {};
    salesCols.forEach((c) => {
      salesX[c] = curX;
      curX += salesWidths[c];
    });

    drawHeader(salesCols, salesWidths, salesX);

    let totalPenjualan = 0;
    let totalUntung = 0;

    salesDetails.forEach((row) => {
      if (doc.y > 720) {
        doc.addPage();
        drawHeader(salesCols, salesWidths, salesX);
      }

      const rowData = {
        tanggal: new Date(row.tanggal).toLocaleDateString("id-ID"),
        produk: row.namaProduk,
        qty: row.qty,
        harga: Number(row.harga).toLocaleString("id-ID"),
        subtotal: Number(row.subtotal).toLocaleString("id-ID"),
        keuntungan: Number(row.keuntungan).toLocaleString("id-ID"),
      };

      drawRow(salesCols, salesWidths, salesX, rowData);
      totalPenjualan += row.subtotal;
      totalUntung += row.keuntungan;
      doc.moveDown(0.5);
    });

    // --- SECTION 2: PIUTANG BARU ---
    doc.moveDown(1);
    if (doc.y > 650) doc.addPage();
    doc
      .fontSize(12)
      .font("Times-Bold")
      .text("2. Piutang Baru Hari Ini", marginLeft);
    doc.moveDown(0.5);

    const piuCols = ["nama_pelanggan", "produk", "total", "status"];
    const piuWidths = {
      nama_pelanggan: pageWidth * 0.25,
      produk: pageWidth * 0.45,
      total: pageWidth * 0.15,
      status: pageWidth * 0.15,
    };
    curX = marginLeft;
    const piuX = {};
    piuCols.forEach((c) => {
      piuX[c] = curX;
      curX += piuWidths[c];
    });

    drawHeader(piuCols, piuWidths, piuX);

    let totalPiutangBaru = 0;
    newPiutang.forEach((row) => {
      if (doc.y > 720) {
        doc.addPage();
        drawHeader(piuCols, piuWidths, piuX);
      }
      const rowData = {
        nama_pelanggan: row.nama_pelanggan,
        produk: row.produk,
        total: Number(row.total).toLocaleString("id-ID"),
        status: row.status.toUpperCase(),
      };
      drawRow(piuCols, piuWidths, piuX, rowData);
      totalPiutangBaru += Number(row.total);
      doc.moveDown(0.5);
    });

    // --- SECTION 3: PEMBAYARAN PIUTANG ---
    doc.moveDown(1);
    if (doc.y > 650) doc.addPage();
    doc
      .fontSize(12)
      .font("Times-Bold")
      .text("3. Pembayaran Piutang Hari Ini", marginLeft);
    doc.moveDown(0.5);

    const payCols = ["nama_pelanggan", "jumlah", "metode"];
    const payWidths = {
      nama_pelanggan: pageWidth * 0.4,
      jumlah: pageWidth * 0.3,
      metode: pageWidth * 0.3,
    };
    curX = marginLeft;
    const payX = {};
    payCols.forEach((c) => {
      payX[c] = curX;
      curX += payWidths[c];
    });

    drawHeader(payCols, payWidths, payX);

    let totalBayarPiutang = 0;
    payments.forEach((row) => {
      if (doc.y > 720) {
        doc.addPage();
        drawHeader(payCols, payWidths, payX);
      }
      const rowData = {
        nama_pelanggan: row.nama_pelanggan,
        jumlah: Number(row.jumlah).toLocaleString("id-ID"),
        metode: row.metode.toUpperCase(),
      };
      drawRow(payCols, payWidths, payX, rowData);
      totalBayarPiutang += Number(row.jumlah);
      doc.moveDown(0.5);
    });

    // --- SUMMARY ---
    doc.moveDown(2);
    if (doc.y > 650) doc.addPage();
    doc.fontSize(14).font("Times-Bold").text("RINGKASAN", marginLeft);
    doc
      .strokeColor("#000")
      .lineWidth(2)
      .moveTo(marginLeft, doc.y)
      .lineTo(marginLeft + 100, doc.y)
      .stroke();
    doc.moveDown(0.5);
    doc.fontSize(11).font("Times-Roman");

    const drawSummaryLine = (label, value, isBold = false) => {
      if (isBold) doc.font("Times-Bold");
      doc.text(label, marginLeft, doc.y, { continued: true });
      doc.text(`: Rp. ${Number(value).toLocaleString("id-ID")}`, {
        align: "right",
      });
      doc.font("Times-Roman");
    };

    drawSummaryLine("Total Penjualan Kotor", totalPenjualan);
    drawSummaryLine("Total Keuntungan Kasar", totalUntung);
    doc.moveDown(0.5);
    drawSummaryLine("Piutang Baru Hari Ini", totalPiutangBaru);
    drawSummaryLine("Pembayaran Piutang Hari Ini", totalBayarPiutang);
    doc.moveDown(0.5);
    drawSummaryLine(
      "Total Saldo Piutang (Semua)",
      overallPiutang[0].total_sisa,
      true
    );

    doc.end();
  } catch (err) {
    console.error("❌ Error generating PDF Report:", err);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ message: "Gagal membuat laporan PDF", error: err.message });
    }
  }
});

module.exports = router;
