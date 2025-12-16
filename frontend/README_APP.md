# Aplikasi Toko Beras - POS System

Aplikasi manajemen toko beras berbasis React dengan fitur lengkap untuk mengelola inventori, penjualan, dan laporan.

## 🌟 Fitur Utama

### 1. **Halaman Login & Register**
- Form login dan register yang responsif
- Validasi input sederhana
- Toggle antara mode login dan register
- Integrasi dengan sistem autentikasi aplikasi

### 2. **Dashboard**
- Ringkasan statistik penjualan
- Menampilkan total penjualan, produk terjual, stok beras, dan jumlah pelanggan
- Tabel riwayat penjualan terbaru
- Data dummy untuk visualisasi

### 3. **Manajemen Produk (Products)**
- Daftar lengkap produk beras dengan berbagai kategori
- Tampilkan harga, stok, dan status stok
- Badge untuk menunjukkan kondisi stok (Tinggi, Normal, Rendah)
- Contoh data: 6 jenis beras dengan spesifikasi lengkap

### 4. **Penjualan (Sales)**
- Pencatatan transaksi penjualan
- Statistik penjualan (total, qty terjual, rata-rata transaksi)
- Tabel riwayat penjualan dengan detail lengkap
- Informasi pembeli dan tanggal transaksi

### 5. **Inventori (Inventory)**
- Manajemen stok barang
- Menampilkan stok saat ini, minimal stok, dan qty reorder
- Status stok dengan badge berwarna
- Lokasi penyimpanan produk
- Fitur notifikasi untuk produk yang perlu reorder

### 6. **Laporan & Analitik (Reports)**
- Penjualan bulanan
- Produk terlaris
- Statistik pelanggan
- Filter berdasarkan periode
- Fitur export laporan

### 7. **Pengaturan (Settings)**
- Informasi toko (nama, pemilik, email, telepon, alamat)
- Mode edit untuk mengubah data
- Preferensi aplikasi (bahasa, tema, notifikasi)
- Keamanan (ubah password, log aktivitas)

### 8. **Sidebar Navigation**
- Menu navigasi utama untuk semua halaman
- Indikator halaman aktif
- Ikon menu yang intuitif
- Tombol logout

## 🎨 Desain & Styling

### Warna Utama
- **Background**: Putih (#ffffff)
- **Card/Container**: Abu-abu muda (#f8f9fa)
- **Sidebar**: Biru tua (#2c3e50)
- **Accent**: Coklat (#8b7355)
- **Danger**: Merah (#e74c3c)

### Fitur Styling
- ✅ Transisi smooth (0.3s ease) di setiap elemen
- ✅ Hover effects pada tombol dan tabel
- ✅ Animasi fade-in saat berpindah halaman
- ✅ Responsive design untuk mobile
- ✅ Badge berwarna untuk status
- ✅ Box shadow subtle untuk kedalaman

## 📊 Data Dummy

Aplikasi sudah dilengkapi dengan data dummy untuk:
- Dashboard statistics
- Daftar produk beras (6 item)
- Riwayat penjualan (5+ transaksi)
- Inventori stok
- Laporan penjualan bulanan
- Statistik pelanggan

## 🚀 Cara Menggunakan

### Login
1. Buka aplikasi di `http://localhost:5174`
2. Masukkan email dan password (gunakan nilai apapun untuk demo)
3. Atau klik "Daftar di sini" untuk membuat akun baru

### Navigasi
- Gunakan menu sidebar untuk berpindah antar halaman
- Setiap halaman memiliki transisi smooth
- Klik tombol Logout untuk kembali ke halaman login

## 📁 Struktur File

```
frontend/src/
├── App.jsx              (Main routing)
├── App.css              (Global styling)
├── main.jsx
├── index.css
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Products.jsx
│   ├── Sales.jsx
│   ├── Inventory.jsx
│   ├── Reports.jsx
│   └── Settings.jsx
└── components/
    └── Sidebar.jsx
```

## 🔧 Teknologi yang Digunakan

- **React 19.2**
- **React Router DOM** (untuk routing)
- **CSS3** (untuk styling dan animasi)
- **Vite** (build tool)

## 💡 Catatan

- Semua form dan tombol memiliki interaksi yang responsif
- Data dummy dapat dengan mudah diganti dengan API call
- Desain fully responsive untuk berbagai ukuran layar
- Authentication masih dummy - perlu backend untuk produksi
- Error handling dapat ditingkatkan lebih lanjut

---

**Dibuat untuk:** Sistem Manajemen Toko Beras
**Tanggal:** December 2025
