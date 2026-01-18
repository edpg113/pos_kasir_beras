-- --------------------------------------------------------
-- Database: toko_beras
-- Compatible with MySQL 5.7 / MariaDB
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
SET NAMES utf8mb4;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE IF NOT EXISTS `toko_beras`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE `toko_beras`;

-- ===========================
-- TABLE: kategori
-- ===========================
CREATE TABLE IF NOT EXISTS `kategori` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kategori` varchar(225) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ===========================
-- TABLE: pelanggan
-- ===========================
CREATE TABLE IF NOT EXISTS `pelanggan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(225) NOT NULL DEFAULT '0',
  `telepon` varchar(50) NOT NULL DEFAULT '0',
  `alamat` text NOT NULL,
  `kategori` varchar(225) DEFAULT 'pelanggan baru',
  `keterangan` varchar(225) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ===========================
-- TABLE: produk
-- ===========================
CREATE TABLE IF NOT EXISTS `produk` (
  `id` int NOT NULL AUTO_INCREMENT,
  `namaProduk` varchar(225) NOT NULL DEFAULT '0',
  `kategori` varchar(225) NOT NULL DEFAULT '0',
  `harga` int NOT NULL DEFAULT '0',
  `stok` int NOT NULL DEFAULT '0',
  `modal` int NOT NULL DEFAULT '0',
  `min_stok` int DEFAULT '50',
  `reorder_qty` int DEFAULT '0',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  `harga_per_kg` DECIMAL(15, 2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ===========================
-- TABLE: retur
-- ===========================
CREATE TABLE IF NOT EXISTS `retur` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tanggal` datetime NOT NULL,
  `tipe` enum('penjualan','pembelian') NOT NULL,
  `transaksi_id` int DEFAULT NULL,
  `supplier` varchar(255) DEFAULT NULL,
  `total_nilai` decimal(15,2) NOT NULL,
  `keterangan` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ===========================
-- TABLE: retur_detail
-- ===========================
CREATE TABLE IF NOT EXISTS `retur_detail` (
  `id` int NOT NULL AUTO_INCREMENT,
  `retur_id` int NOT NULL,
  `produk_id` int NOT NULL,
  `qty` int NOT NULL,
  `harga` decimal(15,2) NOT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `retur_id` (`retur_id`),
  CONSTRAINT `retur_detail_ibfk_1`
    FOREIGN KEY (`retur_id`) REFERENCES `retur` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ===========================
-- TABLE: stok_masuk
-- ===========================
CREATE TABLE IF NOT EXISTS `stok_masuk` (
  `id` int NOT NULL AUTO_INCREMENT,
  `produk_id` int NOT NULL,
  `supplier` varchar(100) DEFAULT NULL,
  `qty` int NOT NULL,
  `tanggal` datetime DEFAULT CURRENT_TIMESTAMP,
  `harga_beli` DECIMAL(15,2) DEFAULT NULL,
  `harga_jual` DECIMAL(15,2) DEFAULT NULL,
  `total` DECIMAL(15,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `produk_id` (`produk_id`),
  CONSTRAINT `stok_masuk_ibfk_1`
    FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ===========================
-- TABLE: stok_pengiriman
-- ===========================
CREATE TABLE IF NOT EXISTS `stok_pengiriman` (
  `id` int NOT NULL AUTO_INCREMENT,
  `produk_id` int NOT NULL,
  `qty` int NOT NULL,
  `tujuan` varchar(255) NOT NULL,
  `keterangan` text,
  `tanggal` datetime DEFAULT CURRENT_TIMESTAMP,
  `harga_per_kg` DECIMAL(15, 2) DEFAULT NULL,
  `harga_beli` DECIMAL(15, 2) DEFAULT NULL,
  `stok_awal` int DEFAULT 0,
  `total` DECIMAL(15, 2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `produk_id` (`produk_id`),
  CONSTRAINT `stok_pengiriman_ibfk_1`
    FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ===========================
-- TABLE: transaksi
-- ===========================
CREATE TABLE IF NOT EXISTS `transaksi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kode_transaksi` varchar(50) DEFAULT NULL,
  `tanggal` datetime NOT NULL,
  `produk` varchar(225) DEFAULT NULL,
  `qty` int DEFAULT NULL,
  `pembeli` tinytext,
  `total` int NOT NULL,
  `bayar` int NOT NULL,
  `kembalian` int NOT NULL,
  `metode` enum('Cash','Transfer','Kasbon') NOT NULL DEFAULT 'Cash',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ===========================
-- TABLE: transaksi_detail
-- ===========================
CREATE TABLE IF NOT EXISTS `transaksi_detail` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transaksi_id` int NOT NULL,
  `produk_id` int NOT NULL,
  `qty` int NOT NULL,
  `harga` int NOT NULL,
  `subtotal` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `transaksi_id` (`transaksi_id`),
  CONSTRAINT `transaksi_detail_ibfk_1`
    FOREIGN KEY (`transaksi_id`) REFERENCES `transaksi` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ===========================
-- TABLE: user
-- ===========================
CREATE TABLE IF NOT EXISTS `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(225) NOT NULL DEFAULT '',
  `email` varchar(225) NOT NULL DEFAULT '',
  `password` varchar(225) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ===========================
-- TABLE: setting
-- ===========================

CREATE TABLE IF NOT EXISTS `setting` (
  `id` int NOT NULL AUTO_INCREMENT,
  `namaToko` varchar(225) NOT NULL DEFAULT '',
  `pemilik` varchar(225) NOT NULL DEFAULT '',
  `email` varchar(225) NOT NULL DEFAULT '',
  `telepon` varchar(50) NOT NULL DEFAULT '0',
  `alamat` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ===========================
-- TABLE: po_barang
-- ===========================

CREATE TABLE IF NOT EXISTS po_barang (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `produk_id` INT NOT NULL,
  `qty` INT NOT NULL,
  `tujuan` VARCHAR(255) NOT NULL,
  `keterangan` TEXT,
  `tanggal` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `harga_per_kg` DECIMAL(15, 2) DEFAULT NULL,
  `harga_beli` DECIMAL(15, 2) DEFAULT NULL,
  `stok_awal` INT DEFAULT 0,
  `total` DECIMAL(15, 2) DEFAULT 0,
  FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE RESTRICT,
  INDEX idx_tanggal (tanggal),
  INDEX idx_produk_id (produk_id),
  INDEX idx_tujuan (tujuan)
);

CREATE TABLE IF NOT EXISTS `pengeluaran` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tanggal` datetime DEFAULT CURRENT_TIMESTAMP,
  `modal` int NOT NULL DEFAULT 0,
  `keluar` int NOT NULL DEFAULT 0,
  `jumlah` decimal(15,2) NOT NULL,
  `keterangan` VARCHAR(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;