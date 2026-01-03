const express = require("express");
const router = express.Router();
const db = require("../db");
const PDFDocument = require("pdfkit");

// Ensure is_active column exists
const ensureColumn = () => {
  const query = "SHOW COLUMNS FROM produk LIKE 'is_active'";
  db.query(query, (err, results) => {
    if (!err && results.length === 0) {
      const alterQuery =
        "ALTER TABLE produk ADD COLUMN is_active TINYINT(1) DEFAULT 1";
      db.query(alterQuery, (err2) => {
        if (err2) console.error("❌ Gagal menambah kolom is_active:", err2);
        else console.log("✅ Kolom is_active berhasil ditambahkan");
      });
    }
  });
};
ensureColumn();

// API POST Product
router.post("/products", (req, res) => {
  const { namaProduk, kategori, harga, modal, stok, hargaPerKg } = req.body;
  const query =
    "INSERT INTO produk (namaProduk, kategori, harga, modal, stok, harga_per_kg, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)";
  db.query(query, [namaProduk, kategori, harga, modal, stok, hargaPerKg], (err, result) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).json({ error: "Database error", details: err });
    }
    console.log("✅ Product added with ID:", result.insertId);
    return res
      .status(200)
      .json({ message: "Produk berhasil ditambahkan", result });
  });
});

// API GET Products
router.get("/getproducts", (req, res) => {
  const query = "SELECT * FROM produk WHERE is_active = 1";
  db.query(query, (err, result) => {
    if (err)
      return res.status(500).json({ error: "Database error", details: err });
    res.json(result);
  });
});

// API EDIT Products
router.put("/editproduct/:id", (req, res) => {
  const { id } = req.params;
  const { namaProduk, kategori, harga, modal, stok, hargaPerKg } = req.body;
  const query =
    "UPDATE produk SET namaProduk = ?, kategori = ?, harga = ?, modal = ?, stok = ?, harga_per_kg = ? WHERE id = ?";
  db.query(query, [namaProduk, kategori, harga, modal, stok, hargaPerKg, id], (err) => {
    if (err) return res.status(500).json("Gagal mengubah produk");
    res.json("Produk berhasil di ubah");
  });
});

// API DELETE Products (Soft Delete)
router.delete("/deleteproduct/:id", (req, res) => {
  const { id } = req.params;
  const query = "UPDATE produk SET is_active = 0 WHERE id = ?";
  db.query(query, [id], (err) => {
    if (err) {
      console.error("❌ Gagal menonaktifkan produk:", err);
      return res.status(500).json("Gagal menghapus produk");
    }
    res.json("Berhasil menghapus produk");
  });
});

module.exports = router;

// Export products as PDF
router.get("/products/export", (req, res) => {
  const query = "SELECT namaProduk, kategori, harga, modal, stok, harga_per_kg, is_active FROM produk WHERE is_active = 1 ORDER BY namaProduk ASC";
  db.query(query, (err, result) => {
    if (err) {
      console.error("❌ Error fetching products for export:", err);
      return res.status(500).json({ error: "Database error", details: err });
    }

    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const filename = `Daftar_Produk_${new Date().toISOString().slice(0,10)}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

      doc.pipe(res);

      doc.fontSize(16).text("Daftar Produk", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, { align: "center" });
      doc.moveDown(1);

      const marginLeft = doc.page.margins.left || 40;
      const pageWidth = doc.page.width - (doc.page.margins.left || 40) - (doc.page.margins.right || 40);
      const colPercents = {
        namaProduk: 0.30,
        kategori: 0.08,
        harga_per_kg: 0.15,
        modal: 0.15,
        harga: 0.15,
        stok: 0.08,
        // status: 0.08,
      };
      const colWidths = {};
      Object.keys(colPercents).forEach((k) => {
        colWidths[k] = Math.floor(pageWidth * colPercents[k]);
      });

      const cols = ["namaProduk", "kategori", "harga_per_kg", "modal", "harga", "stok"];
      const colX = {};
      let curX = marginLeft;
      cols.forEach((c) => {
        colX[c] = curX;
        curX += colWidths[c];
      });

      const headerHeight = 18;
      const rowPadding = 6;

      function drawHeader(y) {
        doc.font("Helvetica-Bold").fontSize(9).fillColor("black");
        cols.forEach((c) => {
          const title = c === "namaProduk" ? "Nama Produk" : c === "kategori" ? "Satuan" : c === "harga_per_kg" ? "Harga/1kg" : c === "modal" ? "Modal/karung" : c === "harga" ? "Harga/karung" :c.charAt(0).toUpperCase() + c.slice(1);
          const align = c === "namaProduk" || c === "kategori" ? "left" : "right";
          doc.text(title, colX[c], y, { width: colWidths[c], align });
        });
        doc.strokeColor('#cccccc').moveTo(marginLeft, y + headerHeight - 4).lineTo(curX, y + headerHeight - 4).stroke();
        return y + headerHeight;
      }

      let y = doc.y + 10;
      y = drawHeader(y);
      doc.font("Helvetica").fontSize(9);

      result.forEach((row) => {
        const namaH = doc.heightOfString(String(row.namaProduk || ""), { width: colWidths.namaProduk });
        const kategoriH = doc.heightOfString(String(row.kategori || ""), { width: colWidths.kategori });
        const rowHeight = Math.max(namaH, kategoriH, 12) + rowPadding;

        if (y + rowHeight > doc.page.height - doc.page.margins.bottom - 20) {
          doc.addPage();
          y = doc.page.margins.top;
          y = drawHeader(y);
        }

        doc.text(String(row.namaProduk || ""), colX.namaProduk, y, { width: colWidths.namaProduk, align: "left" });
        doc.text(String(row.kategori || ""), colX.kategori, y, { width: colWidths.kategori, align: "left" });

        const hargaPerKg = row.harga_per_kg ? `Rp. ${Number(row.harga_per_kg).toLocaleString("id-ID")}` : "-";
        doc.text(hargaPerKg, colX.harga_per_kg, y, { width: colWidths.harga_per_kg, align: "right" });

        doc.text(row.modal ? `Rp. ${Number(row.modal).toLocaleString("id-ID")}` : "-", colX.modal, y, { width: colWidths.modal, align: "right" });
        doc.text(row.harga ? `Rp. ${Number(row.harga).toLocaleString("id-ID")}` : "-", colX.harga, y, { width: colWidths.harga, align: "right" });
        doc.text(row.stok != null ? String(row.stok) : "-", colX.stok, y, { width: colWidths.stok, align: "right" });
        // doc.text(row.is_active ? "Aktif" : "Non-aktif", colX.status, y, { width: colWidths.status, align: "right" });

        const sepY = y + rowHeight - (rowPadding / 2);
        doc.strokeColor('#eeeeee').moveTo(marginLeft, sepY).lineTo(curX, sepY).stroke();

        y += rowHeight;
      });

      doc.end();
    } catch (pdfErr) {
      console.error("❌ Error generating products PDF:", pdfErr);
      return res.status(500).send("Error generating PDF");
    }
  });
});
