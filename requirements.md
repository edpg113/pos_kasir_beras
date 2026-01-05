# REVISI

<!-- * tidak perlu menu hutang dan piutang  -->
<!-- * pengiriman barang warna font kurang kontras -->
<!-- * kolom keterangan dan tujuan cabang di input hanya sekali walau ada beberapa item di tambahkan -->
<!-- * setting font printer -->
<!-- * format cetak laporan di table  -->
<!-- * form tambah stok ada tambahan Harga beli, Harga jual dan total -->
<!-- * menu laporan stok -->
<!-- * hilangkan kolom no transaksi, pembeli, tambah harga per 1kg , dan pada laporan penjualan -->
<!-- * hasil export laporan jadi pdf -->
<!-- * form produk pada kategori menjadi angka untuk membagi harga per 1kg -->
<!-- * tambahkan pada modal produk input harga per 1kg hasil otomatis dari harga beli dibagi dari kategori -->
<!-- * tambahkan input pada modal inventory harga beli dan input total (read only) hasil dari harga beli * qty masuk -->
<!-- * pada form pengiriman tambahkan input harga beli dan total (hasil dari harga beli per 1kg x qty minta) -->

command untuk build backend
pkg . --targets node16-win-x64 --out-path dist --assets "node_modules/pdfkit/js/data/\*_/_"
hasil -> backend/dist -> backend.exe

_command untuk build frontend_
npm run dist
hasil -> dist_electron -> POS Kasir Beras 1.1.0.exe
