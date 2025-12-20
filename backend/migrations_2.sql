-- Migration to add 'namaProduk' column to 'transaksi_item' table
-- This stores the product name at the time of the transaction.

ALTER TABLE transaksi_item
ADD COLUMN namaProduk VARCHAR(255) NOT NULL AFTER produk_id;
