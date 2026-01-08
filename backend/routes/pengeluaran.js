const express = require("express");
const router = express.Router();
const db = require("../db");
const PDFDocument = require("pdfkit");

// POST /api/pengeluaran/modal - Add Modal
router.post("/modal", (req, res) => {
  const { modal } = req.body;

  if (!modal) {
    return res.status(400).json({ message: "Jumlah modal harus diisi" });
  }

  const query =
    "INSERT INTO pengeluaran (modal, keluar, keterangan, tanggal) VALUES (?, 0, '', NOW())";

  db.query(query, [modal], (err, result) => {
    if (err) {
      console.error("❌ Error adding modal:", err);
      return res.status(500).json({ message: "Gagal menambah modal" });
    }
    res.json({ message: "Modal berhasil ditambahkan", id: result.insertId });
  });
});

// POST /api/pengeluaran - Add Expense (Pengeluaran)
router.post("/", (req, res) => {
  const { keluar, keterangan } = req.body;

  if (!keluar) {
    return res.status(400).json({ message: "Jumlah pengeluaran harus diisi" });
  }

  const query =
    "INSERT INTO pengeluaran (modal, keluar, keterangan, tanggal) VALUES (0, ?, ?, NOW())";

  db.query(query, [keluar, keterangan || ""], (err, result) => {
    if (err) {
      console.error("❌ Error adding expense:", err);
      return res.status(500).json({ message: "Gagal menambah pengeluaran" });
    }
    res.json({
      message: "Pengeluaran berhasil ditambahkan",
      id: result.insertId,
    });
  });
});

// GET /api/pengeluaran - Get History
router.get("/", (req, res) => {
  const { month } = req.query; // format: YYYY-MM

  // Strict check: if month is provided, use it. Otherwise default to current.
  let selectedMonth = month;
  if (!selectedMonth || selectedMonth.trim() === "") {
    selectedMonth = new Date().toISOString().slice(0, 7);
  }

  // Query for Cumulative Summary (Filtered by Month)
  const summaryQuery =
    "SELECT SUM(modal) as totalModal, SUM(keluar) as totalKeluar FROM pengeluaran WHERE DATE_FORMAT(tanggal, '%Y-%m') = ?";

  // Query for Filtered History
  const historyQuery =
    "SELECT * FROM pengeluaran WHERE DATE_FORMAT(tanggal, '%Y-%m') = ? ORDER BY tanggal DESC";
  db.query(summaryQuery, [selectedMonth], (err, summaryResult) => {
    if (err) {
      console.error("❌ Error fetching summary:", err);
      return res.status(500).json({ message: "Gagal mengambil ringkasan" });
    }

    console.log("Summary Result from DB:", summaryResult);

    const totalModalVal =
      summaryResult && summaryResult[0] ? summaryResult[0].totalModal : 0;
    const totalKeluarVal =
      summaryResult && summaryResult[0] ? summaryResult[0].totalKeluar : 0;

    const summary = {
      modal: Number(totalModalVal) || 0,
      keluar: Number(totalKeluarVal) || 0,
      sisa: (Number(totalModalVal) || 0) - (Number(totalKeluarVal) || 0),
    };

    db.query(historyQuery, [selectedMonth], (err, historyResult) => {
      if (err) {
        console.error("❌ Error fetching history:", err);
        return res.status(500).json({ message: "Gagal mengambil riwayat" });
      }
      console.log(
        `Found ${historyResult.length} history items for ${selectedMonth}`
      );
      res.json({
        history: historyResult,
        summary: summary,
      });
    });
  });
});

// GET /api/pengeluaran/export-pdf - Export PDF
router.get("/export-pdf", (req, res) => {
  const { month } = req.query;
  const selectedMonth = month || new Date().toISOString().slice(0, 7);

  const query =
    "SELECT * FROM pengeluaran WHERE DATE_FORMAT(tanggal, '%Y-%m') = ? ORDER BY tanggal DESC";

  db.query(query, [selectedMonth], (err, result) => {
    if (err) {
      console.error("❌ Error fetching history for PDF:", err);
      return res
        .status(500)
        .json({ message: "Gagal mengambil riwayat untuk PDF" });
    }

    const doc = new PDFDocument({ margin: 30, size: "A4" });
    const filename = `Laporan_Pengeluaran_${selectedMonth}_${Date.now()}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    doc.pipe(res);

    // Title
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .text("LAPORAN PENGELUARAN & KAS MASUK", { align: "center" });
    doc.fontSize(12).text(`Periode: ${selectedMonth}`, { align: "center" });
    doc.moveDown(2);

    // Table Header
    const tableTop = 150;
    const colX = {
      tanggal: 30,
      keterangan: 150,
      masuk: 350,
      keluar: 450,
    };
    const colWidths = {
      tanggal: 110,
      keterangan: 190,
      masuk: 90,
      keluar: 90,
    };

    doc.font("Helvetica-Bold").fontSize(10);
    doc.text("Tanggal", colX.tanggal, tableTop);
    doc.text("Keterangan", colX.keterangan, tableTop);
    doc.text("Masuk", colX.masuk, tableTop, {
      align: "right",
      width: colWidths.masuk,
    });
    doc.text("Keluar", colX.keluar, tableTop, {
      align: "right",
      width: colWidths.keluar,
    });

    doc
      .moveTo(30, tableTop + 15)
      .lineTo(560, tableTop + 15)
      .stroke();

    // Data Rows
    let y = tableTop + 25;
    let totalModal = 0;
    let totalKeluar = 0;

    doc.font("Helvetica").fontSize(9);

    result.forEach((item) => {
      if (y > 750) {
        doc.addPage();
        y = 50;
      }

      const dateStr =
        new Date(item.tanggal).toLocaleDateString("id-ID") +
        " " +
        new Date(item.tanggal).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        });

      const keteranganStr =
        item.keterangan || (item.modal > 0 ? "Tambah Modal" : "-");

      totalModal += Number(item.modal) || 0;
      totalKeluar += Number(item.keluar) || 0;

      doc.text(dateStr, colX.tanggal, y);
      doc.text(keteranganStr, colX.keterangan, y, {
        width: colWidths.keterangan,
      });

      const masukValue =
        item.modal > 0
          ? `Rp. ${Number(item.modal).toLocaleString("id-ID")}`
          : "-";
      const keluarValue =
        item.keluar > 0
          ? `Rp. ${Number(item.keluar).toLocaleString("id-ID")}`
          : "-";

      doc.text(masukValue, colX.masuk, y, {
        align: "right",
        width: colWidths.masuk,
      });
      doc.text(keluarValue, colX.keluar, y, {
        align: "right",
        width: colWidths.keluar,
      });

      // Determine height of keterangan text to increment y correctly
      const textHeight = doc.heightOfString(keteranganStr, {
        width: colWidths.keterangan,
      });
      y += Math.max(textHeight, 15) + 5;

      doc
        .moveTo(30, y - 2)
        .lineTo(560, y - 2)
        .strokeColor("#eeeeee")
        .stroke()
        .strokeColor("black");
    });

    // Summary
    doc.moveDown(2);
    y = doc.y;
    if (y > 700) {
      doc.addPage();
      y = 50;
    }

    doc.font("Helvetica-Bold").fontSize(11);
    doc.text("RINGKASAN", 30, y);
    doc.font("Helvetica").fontSize(10);
    y += 20;

    doc.text("Total Modal Masuk:", 30, y);
    doc.text(`Rp. ${totalModal.toLocaleString("id-ID")}`, 180, y, {
      align: "left",
    });
    y += 15;

    doc.text("Total Pengeluaran:", 30, y);
    doc.text(`Rp. ${totalKeluar.toLocaleString("id-ID")}`, 180, y, {
      align: "left",
    });
    y += 15;

    doc.font("Helvetica-Bold");
    doc.text("Sisa Modal:", 30, y);
    doc.text(
      `Rp. ${(totalModal - totalKeluar).toLocaleString("id-ID")}`,
      180,
      y,
      { align: "left" }
    );

    doc.end();
  });
});

module.exports = router;
