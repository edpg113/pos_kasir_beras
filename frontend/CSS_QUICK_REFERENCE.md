# 🚀 QUICK REFERENCE - CSS File Guide

## 📍 Lokasi CSS Files

```
src/
├── App.css                    ← Global styles
├── pages/
│   ├── Login.css              ← Login/Register
│   ├── Dashboard.css          ← Dashboard
│   ├── Products.css           ← Produk
│   ├── Sales.css              ← Penjualan
│   ├── Inventory.css          ← Inventori
│   ├── Reports.css            ← Laporan
│   └── Settings.css           ← Pengaturan
└── components/
    └── Sidebar.css            ← Navigation
```

## 🎯 Mengubah Style

### Contoh 1: Mengubah warna tombol utama
```css
/* Buka: App.css */
.btn-primary {
  background-color: #8b7355;    ← Ubah warna di sini
  color: white;
}
```

### Contoh 2: Mengubah layout Dashboard
```css
/* Buka: Dashboard.css */
.dashboard-stats-grid {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));  ← Ubah jumlah kolom
  gap: 20px;                     ← Ubah jarak antar card
}
```

### Contoh 3: Mengubah warna Sidebar
```css
/* Buka: Sidebar.css */
.sidebar {
  background-color: #2c3e50;    ← Ubah warna background
}

.menu-item a.active {
  border-left-color: #8b7355;   ← Ubah warna highlight
}
```

### Contoh 4: Mengubah style tabel
```css
/* Buka: App.css (global) atau halaman spesifik */
.products-table thead {
  background-color: #ecf0f1;    ← Ubah warna header
}

.products-table tbody tr:hover {
  background-color: #f0f3f7;    ← Ubah warna hover
}
```

## 📝 Class Names Reference

### Global Classes (App.css)
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-logout`
- `.form-group`, `.form-group input`, `.form-group select`
- `.table-container`, `table`, `thead`, `th`, `td`, `tbody tr`
- `.badge`, `.badge-success`, `.badge-warning`, `.badge-danger`, `.badge-info`
- `.navbar-user`

### Dashboard Classes (Dashboard.css)
- `.dashboard-container`, `.dashboard-content-wrapper`
- `.dashboard-navbar`, `.dashboard-page-content`
- `.dashboard-page-header`, `.dashboard-stats-grid`
- `.dashboard-stat-card`, `.dashboard-card`

### Products Classes (Products.css)
- `.products-container`, `.products-navbar`
- `.products-page-header`, `.products-action-bar`
- `.products-card`, `.products-table-container`

### Sales Classes (Sales.css)
- `.sales-container`, `.sales-navbar`
- `.sales-stats-grid`, `.sales-stat-card`
- `.sales-card`, `.sales-table-container`

### Inventory Classes (Inventory.css)
- `.inventory-container`, `.inventory-navbar`
- `.inventory-stats-grid`, `.inventory-stat-card`
- `.inventory-card`, `.inventory-table-container`

### Reports Classes (Reports.css)
- `.reports-container`, `.reports-navbar`
- `.reports-filter-bar`, `.reports-stats-grid`
- `.reports-grid-2`, `.reports-card`, `.reports-table-container`

### Settings Classes (Settings.css)
- `.settings-container`, `.settings-navbar`
- `.settings-card`, `.settings-form-container`
- `.settings-form-group`, `.settings-info-section`

### Sidebar Classes (Sidebar.css)
- `.sidebar`, `.sidebar-header`, `.sidebar-menu`
- `.menu-item`, `.menu-icon`, `.sidebar-logout-btn`

## 🎨 Color Palette

```
Primary: #8b7355       (Brown)
Dark: #2c3e50         (Dark Blue)
Light Gray: #f8f9fa   (Light Gray)
Gray: #ecf0f1         (Medium Gray)
Text: #2c3e50         (Dark)
Muted: #7f8c8d        (Muted)
Success: #d4edda      (Light Green)
Warning: #fff3cd      (Light Yellow)
Danger: #f8d7da       (Light Red)
```

## 🔄 Responsive Breakpoints

```css
/* Tablet */
@media (max-width: 768px) { }

/* Mobile */
@media (max-width: 480px) { }
```

## 💾 Common Changes

### Mengganti warna tema
1. Buka `App.css`
2. Ubah `#8b7355` ke warna baru di semua `.btn-primary`
3. Ubah di `Sidebar.css` untuk highlight color

### Menambah spacing
```css
padding: 30px;    ← Ubah angka untuk spacing
gap: 20px;        ← Ubah angka untuk jarak item
```

### Mengubah border/shadow
```css
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);   ← Ubah opacity atau blur
border-radius: 8px;                           ← Ubah pembulatan sudut
```

---

**Tip**: Gunakan browser DevTools (F12) untuk inspect element dan test perubahan CSS secara real-time!
