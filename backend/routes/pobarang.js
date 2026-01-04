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
      pb.tanggal
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
      pb.qty,
      pb.tujuan,
      pb.keterangan,
      pb.tanggal
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
    
    let completed = 0;
    let hasError = false;
    
    items.forEach((item, index) => {
      const insertQuery = `
        INSERT INTO po_barang (produk_id, qty, tujuan, keterangan, tanggal)
        VALUES (?, ?, ?, ?, NOW())
      `;
      
      const params = [
        item.produk_id,
        item.qty,
        item.tujuan,
        item.keterangan || null
      ];
      
      db.query(insertQuery, params, (err, result) => {
        if (err) {
          console.error("❌ Error inserting PO:", err);
          if (!hasError) {
            hasError = true;
            return db.rollback(() => {
              res.status(500).json({ message: "Gagal membuat PO Barang" });
            });
          }
          return;
        }
        
        completed++;
        
        if (completed === items.length) {
          db.commit((commitErr) => {
            if (commitErr) {
              console.error("❌ Error committing transaction:", commitErr);
              return db.rollback(() => {
                res.status(500).json({ message: "Gagal menyimpan PO Barang" });
              });
            }
            res.json({ message: "PO Barang berhasil dibuat", poCount: completed });
          });
        }
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
      pb.tanggal
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
      doc.fontSize(10).text(date ? `Tanggal: ${date}` : `Semua PO Barang`, { align: "center" });
      doc.moveDown(1);
      
      // Table setup
      const marginLeft = 40;
      const pageWidth = doc.page.width - 80;
      
      const colPercents = {
        tanggal: 0.15,
        produk: 0.25,
        qty: 0.10,
        tujuan: 0.25,
        keterangan: 0.25
      };
      
      const colWidths = {};
      Object.keys(colPercents).forEach(k => {
        colWidths[k] = Math.floor(pageWidth * colPercents[k]);
      });
      
      const cols = ["tanggal", "produk", "qty", "tujuan", "keterangan"];
      const colX = {};
      let curX = marginLeft;
      cols.forEach(c => {
        colX[c] = curX;
        curX += colWidths[c];
      });
      
      // Header row
      doc.font("Times-Bold").fontSize(9);
      cols.forEach(c => {
        const title = c === "tanggal" ? "Tanggal" : 
                     c === "produk" ? "Produk" :
                     c === "qty" ? "Qty" :
                     c === "tujuan" ? "Tujuan" : "Keterangan";
        doc.text(title, colX[c], doc.y, { width: colWidths[c], align: c === "produk" || c === "tujuan" ? "left" : "center" });
      });
      
      doc.moveDown(0.5);
      doc.strokeColor("#cccccc").moveTo(marginLeft, doc.y).lineTo(curX, doc.y).stroke();
      doc.moveDown(0.3);
      
      // Data rows
      doc.font("Times-Roman").fontSize(9);
      
      result.forEach((row) => {
        doc.text(
          new Date(row.tanggal).toLocaleDateString("id-ID"),
          colX.tanggal,
          doc.y,
          { width: colWidths.tanggal, align: "center" }
        );
        doc.text(row.namaProduk, colX.produk, doc.y - 13, { width: colWidths.produk, align: "left" });
        doc.text(row.qty, colX.qty, doc.y, { width: colWidths.qty, align: "center" });
        doc.text(row.tujuan, colX.tujuan, doc.y - 13, { width: colWidths.tujuan, align: "left" });
        doc.text(row.keterangan || "-", colX.keterangan, doc.y - 13, { width: colWidths.keterangan, align: "left" });
        
        doc.moveDown(1);
        doc.strokeColor("#eeeeee").moveTo(marginLeft, doc.y).lineTo(curX, doc.y).stroke();
        doc.moveDown(0.3);
      });
      
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
