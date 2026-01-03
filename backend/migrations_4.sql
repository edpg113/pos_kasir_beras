-- Migration 4: add harga_per_kg to produk
ALTER TABLE produk
  ADD COLUMN harga_per_kg DECIMAL(14,2) DEFAULT NULL;

-- Optional: if you also want to backfill harga_per_kg from existing modal/kategori, add statements here.
