-- Migration to create 'stok_pengiriman' table
-- Stores history of stock transfers to branches

CREATE TABLE IF NOT EXISTS stok_pengiriman (
  id INT AUTO_INCREMENT PRIMARY KEY,
  produk_id INT NOT NULL,
  qty INT NOT NULL,
  tujuan VARCHAR(255) NOT NULL,
  keterangan TEXT,
  tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE CASCADE
);
