const express = require("express");
const router = express.Router();
const db = require("../db");
const PDFDocument = require("pdfkit");

// GET /api/pobarang - Get all PO Barang
router.get("/pobarang", (req, res) => {
  const query = `
    SELECT 
      pb.id,
      pb.produk_id,
      p.namaProduk,
      pb.qty,
      pb.tujuan,
      pb.keterangan,
      pb.tanggal,
      pb.harga_beli,
      pb.stok_awal,
      pb.total,
      pb.biaya_kuli,
      pb.biaya_sopir,
      pb.dp,
      pb.total_harga_produk,
      pb.harga_per_kg
    FROM po_barang pb
    JOIN produk p ON pb.produk_id = p.id
    ORDER BY pb.tanggal DESC
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error("❌ Error fetching PO Barang:", err);
      return res.status(500).json(err);
    }
    res.json(result);
  });
});

// GET /api/pobarang/history - Get PO history with date filter
router.get("/pobarang/history", (req, res) => {
  const { date } = req.query;

  let query = `
    SELECT 
      pb.id,
      pb.produk_id,
      p.namaProduk,
      p.harga_per_kg,
      p.harga,
      p.modal,
      pb.qty,
      pb.tujuan,
      pb.keterangan,
      pb.tanggal,
      pb.harga_beli,
      pb.stok_awal,
      pb.total,
      pb.biaya_kuli,
      pb.biaya_sopir,
      pb.dp,
      pb.total_harga_produk,
      pb.harga_per_kg
    FROM po_barang pb
    JOIN produk p ON pb.produk_id = p.id
  `;

  const params = [];

  if (date) {
    query += ` WHERE DATE(pb.tanggal) = ?`;
    params.push(date);
  }

  query += ` ORDER BY pb.tanggal DESC`;

  db.query(query, params, (err, result) => {
    if (err) {
      console.error("❌ Error fetching PO history:", err);
      return res.status(500).json(err);
    }
    res.json(result);
  });
});

// POST /api/pobarang - Create new PO
router.post("/pobarang", (req, res) => {
  const { items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Minimal harus ada satu item PO" });
  }

  db.beginTransaction((err) => {
    if (err) {
      console.error("❌ Error starting transaction:", err);
      return res.status(500).json({ message: "Gagal memulai transaksi" });
    }

    const promises = items.map((item) => {
      return new Promise((resolve, reject) => {
        // Fetch current product data for snapshot
        const productQuery = "SELECT stok, modal FROM produk WHERE id = ?";
        db.query(productQuery, [item.produk_id], (err, results) => {
          if (err || results.length === 0) {
            // If product not found, use defaults but this shouldn't happen if validation passed
            return reject(err || new Error("Product not found"));
          }

          const currentStock = results[0].stok;
          const buyPrice = results[0].modal || 0;
          const unitPrice = item.total_harga_produk || buyPrice;
          const subtotal = unitPrice * item.qty;
          const total =
            subtotal -
            (item.biaya_kuli || 0) -
            (item.biaya_sopir || 0) -
            (item.dp || 0);

          const insertQuery = `
                    INSERT INTO po_barang (produk_id, qty, tujuan, keterangan, tanggal, harga_beli, stok_awal, total, biaya_kuli, biaya_sopir, dp, total_harga_produk, subtotal, harga_per_kg)
                    VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

          const params = [
            item.produk_id,
            item.qty,
            item.tujuan,
            item.keterangan || null,
            buyPrice,
            currentStock,
            total,
            item.biaya_kuli || 0,
            item.biaya_sopir || 0,
            item.dp || 0,
            unitPrice,
            subtotal,
            item.harga_per_kg || 0,
          ];

          db.query(insertQuery, params, (err, result) => {
            if (err) return reject(err);
            resolve(result);
          });
        });
      });
    });

    Promise.all(promises)
      .then(() => {
        db.commit((err) => {
          if (err) {
            return db.rollback(() => {
              res.status(500).json({ message: "Gagal menyimpan PO Barang" });
            });
          }
          res.json({
            message: "PO Barang berhasil dibuat",
            poCount: items.length,
          });
        });
      })
      .catch((err) => {
        db.rollback(() => {
          console.error("❌ Error inserting PO:", err);
          res.status(500).json({ message: "Gagal membuat PO Barang" });
        });
      });
  });
});

// GET /api/pobarang/export - Export PO to PDF
router.get("/pobarang/export", (req, res) => {
  const { date } = req.query;

  let query = `
    SELECT 
      pb.id,
      pb.produk_id,
      p.namaProduk,
      pb.qty,
      pb.tujuan,
      pb.keterangan,
      pb.tanggal,
      pb.harga_beli,
      pb.modal,
      pb.total,
      pb.biaya_kuli,
      pb.biaya_sopir,
      pb.dp,
      pb.total_harga_produk,
      pb.subtotal,
      pb.harga_per_kg
    FROM po_barang pb
    JOIN produk p ON pb.produk_id = p.id
  `;

  const params = [];

  if (date) {
    query += ` WHERE DATE(pb.tanggal) = ?`;
    params.push(date);
  }

  query += ` ORDER BY pb.tanggal DESC`;

  db.query(query, params, (err, result) => {
    if (err) {
      console.error("❌ Error fetching data for export:", err);
      return res.status(500).json(err);
    }

    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });

      const filename = date ? `PO_Barang_${date}.pdf` : `PO_Barang.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

      doc.pipe(res);

      // Header
      doc.fontSize(16).text("Laporan PO Barang", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(10).text(date ? `Tanggal: ${date}` : `Semua PO Barang`, {
        align: "center",
      });
      doc.moveDown(1);

      // Table setup
      const marginLeft = 40;
      const pageWidth = doc.page.width - 80;

      const colPercents = {
        tanggal: 0.15,
        produk: 0.2,
        qty: 0.08,
        harga_per_kg: 0.12,
        harga: 0.12, // Harga/Karung
        total: 0.15,
        tujuan: 0.12,
        // keterangan: 0.15,
      };

      const colWidths = {};
      Object.keys(colPercents).forEach((k) => {
        colWidths[k] = Math.floor(pageWidth * colPercents[k]);
      });

      const cols = [
        "tanggal",
        "produk",
        "qty",
        "harga_per_kg",
        "harga",
        "total",
        "tujuan",
        // "keterangan",
      ];
      const colX = {};
      let curX = marginLeft;
      cols.forEach((c) => {
        colX[c] = curX;
        curX += colWidths[c];
      });

      // Header row
      doc.font("Times-Bold").fontSize(9);
      cols.forEach((c) => {
        const title =
          c === "tanggal"
            ? "Tanggal"
            : c === "produk"
              ? "Produk"
              : c === "qty"
                ? "Qty"
                : c === "harga_per_kg"
                  ? "Harga/1kg"
                  : c === "harga"
                    ? "Harga/Karung"
                    : c === "total"
                      ? "Total Modal"
                      : c === "tujuan"
                        ? "Supplier"
                        : "Keterangan";
        doc.text(title, colX[c], doc.y, {
          width: colWidths[c],
          align: c === "produk" || c === "tujuan" ? "left" : "right",
        });
      });

      doc.moveDown(0.5);
      doc
        .strokeColor("#cccccc")
        .moveTo(marginLeft, doc.y)
        .lineTo(curX, doc.y)
        .stroke();
      doc.moveDown(0.3);

      // Data rows
      doc.font("Times-Roman").fontSize(9);

      let grandTotal = 0;
      let grandTotalQty = 0;

      result.forEach((row) => {
        doc.text(
          new Date(row.tanggal).toLocaleDateString("id-ID"),
          colX.tanggal,
          doc.y,
          { width: colWidths.tanggal, align: "center" },
        );
        doc.text(row.namaProduk, colX.produk, doc.y - 13, {
          width: colWidths.produk,
          align: "left",
        });
        doc.text(row.qty, colX.qty, doc.y - 13, {
          width: colWidths.qty,
          align: "right",
        });
        doc.text(
          row.harga_per_kg
            ? `Rp ${Number(row.harga_per_kg).toLocaleString("id-ID")}`
            : "-",
          colX.harga_per_kg,
          doc.y - 13,
          { width: colWidths.harga_per_kg, align: "right" },
        );

        doc.text(
          row.total_harga_produk
            ? `Rp ${Number(row.total_harga_produk).toLocaleString("id-ID")}`
            : "-",
          colX.harga,
          doc.y - 13,
          { width: colWidths.harga, align: "right" },
        );

        const total = row.total || 0;
        grandTotal += Number(total);
        grandTotalQty += Number(row.qty || 0);

        doc.text(
          row.total ? `Rp ${Number(row.total).toLocaleString("id-ID")}` : "-",
          colX.total,
          doc.y - 13,
          { width: colWidths.total, align: "right" },
        );
        doc.text(row.tujuan, colX.tujuan, doc.y - 13, {
          width: colWidths.tujuan,
          align: "left",
        });
        // doc.text(row.keterangan || "-", colX.keterangan, doc.y - 13, {
        //   width: colWidths.keterangan,
        //   align: "left",
        // });

        doc.moveDown(1);
        doc
          .strokeColor("#eeeeee")
          .moveTo(marginLeft, doc.y)
          .lineTo(curX, doc.y)
          .stroke();
        doc.moveDown(0.3);
      });

      // Draw Grand Total
      doc.moveDown(1);
      if (doc.y + 20 > doc.page.height - doc.page.margins.bottom - 20) {
        doc.addPage();
      }

      doc
        .strokeColor("#000000")
        .lineWidth(1)
        .moveTo(marginLeft, doc.y)
        .lineTo(curX, doc.y)
        .stroke();

      doc.moveDown(0.5);

      doc.font("Times-Bold").fontSize(10);
      doc.text("Total :", marginLeft, doc.y, {
        width: colX.qty - marginLeft - 10,
        align: "right",
      });

      doc.text(String(grandTotalQty), colX.qty, doc.y, {
        width: colWidths.qty,
        align: "right",
      });

      doc.text(
        `Rp ${Number(grandTotal).toLocaleString("id-ID")}`,
        colX.total,
        doc.y,
        { width: colWidths.total, align: "right" },
      );

      doc.end();
    } catch (exportErr) {
      console.error("❌ Error generating pdf:", exportErr);
      res.status(500).send("Error exporting data");
    }
  });
});

// DELETE /api/pobarang/:id - Delete PO
router.delete("/pobarang/:id", (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM po_barang WHERE id = ?`;

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("❌ Error deleting PO:", err);
      return res.status(500).json(err);
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "PO tidak ditemukan" });
    }

    res.json({ message: "PO Barang berhasil dihapus" });
  });
});

module.exports = router;
