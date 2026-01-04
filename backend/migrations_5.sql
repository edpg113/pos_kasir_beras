-- Migration 5: Create PO Barang table
CREATE TABLE IF NOT EXISTS po_barang (
  id INT PRIMARY KEY AUTO_INCREMENT,
  produk_id INT NOT NULL,
  qty INT NOT NULL,
  tujuan VARCHAR(255) NOT NULL,
  keterangan TEXT,
  tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE RESTRICT,
  INDEX idx_tanggal (tanggal),
  INDEX idx_produk_id (produk_id),
  INDEX idx_tujuan (tujuan)
);
