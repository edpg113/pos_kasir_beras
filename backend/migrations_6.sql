-- Add harga_per_kg column to stok_pengiriman table
ALTER TABLE stok_pengiriman ADD COLUMN harga_per_kg DECIMAL(15, 2) DEFAULT 0 AFTER keterangan;
