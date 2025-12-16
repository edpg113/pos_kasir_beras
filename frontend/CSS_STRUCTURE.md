# Struktur CSS Terbaru - Aplikasi Toko Beras

## 📁 Organisasi File CSS

CSS telah dipisahkan ke beberapa file untuk memudahkan maintenance dan perubahan style:

### Global Styles
```
frontend/src/
├── App.css              (Style global yang digunakan semua halaman)
```

### Page-Specific Styles
```
frontend/src/pages/
├── Login.css            (Login & Register page)
├── Dashboard.css        (Dashboard page)
├── Products.css         (Products page)
├── Sales.css            (Sales page)
├── Inventory.css        (Inventory page)
├── Reports.css          (Reports page)
└── Settings.css         (Settings page)
```

### Component Styles
```
frontend/src/components/
└── Sidebar.css          (Sidebar navigation component)
```

## 🎯 Konten Setiap File CSS

### `App.css` - Global Styles
Berisi style yang digunakan di seluruh aplikasi:
- Button styles (`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-logout`)
- Form styles (`.form-group`)
- Table styles (`.table-container`, `table`, `thead`, `th`, `td`, `tbody tr`)
- Badge styles (`.badge`, `.badge-success`, `.badge-warning`, `.badge-danger`, `.badge-info`)
- Global animations (`@keyframes fadeIn`)
- Navbar user styles (`.navbar-user`)

### `Login.css`
Khusus untuk halaman Login/Register:
- `.login-container` - Container utama
- `.login-card` - Card login
- `.login-subtitle` - Subtitle text
- `.login-toggle-form` - Toggle antara login dan register
- Responsive design untuk mobile

### `Dashboard.css`
Styles untuk halaman Dashboard:
- `.dashboard-container` - Layout utama
- `.dashboard-content-wrapper` - Content wrapper
- `.dashboard-navbar` - Navigation bar
- `.dashboard-page-content` - Page content area
- `.dashboard-page-header` - Page header
- `.dashboard-stats-grid` - Grid untuk stat cards
- `.dashboard-stat-card` - Individual stat card
- `.dashboard-card` - Card container

### `Products.css`
Styles untuk halaman Products:
- `.products-container` - Layout utama
- `.products-navbar` - Navigation bar
- `.products-page-content` - Page content
- `.products-page-header` - Page header
- `.products-action-bar` - Action button bar
- `.products-card` - Card container
- `.products-table-container` - Table container
- `.products-table` - Table styles

### `Sales.css`
Styles untuk halaman Sales/Penjualan:
- `.sales-container` - Layout utama
- `.sales-navbar` - Navigation bar
- `.sales-page-content` - Page content
- `.sales-stats-grid` - Grid untuk stat cards
- `.sales-stat-card` - Stat card
- `.sales-card` - Card container
- `.sales-table-container` - Table container

### `Inventory.css`
Styles untuk halaman Inventory:
- `.inventory-container` - Layout utama
- `.inventory-navbar` - Navigation bar
- `.inventory-page-content` - Page content
- `.inventory-stats-grid` - Stats grid
- `.inventory-stat-card` - Stat card
- `.inventory-card` - Card container
- `.inventory-table-container` - Table container

### `Reports.css`
Styles untuk halaman Reports/Laporan:
- `.reports-container` - Layout utama
- `.reports-navbar` - Navigation bar
- `.reports-page-content` - Page content
- `.reports-filter-bar` - Filter controls
- `.reports-stats-grid` - Stats grid
- `.reports-grid-2` - 2-column grid untuk cards
- `.reports-card` - Card container
- `.reports-table-container` - Table container

### `Settings.css`
Styles untuk halaman Settings/Pengaturan:
- `.settings-container` - Layout utama
- `.settings-navbar` - Navigation bar
- `.settings-page-content` - Page content
- `.settings-card` - Card container
- `.settings-form-container` - Form container
- `.settings-form-group` - Form group
- `.settings-info-section` - Info section display
- `.settings-info-row` - Individual info row

### `Sidebar.css`
Styles untuk Sidebar component:
- `.sidebar` - Sidebar container utama
- `.sidebar-header` - Header dengan logo/nama
- `.sidebar-menu` - Menu list
- `.menu-item` - Menu item
- `.menu-item a` - Menu link
- `.menu-icon` - Icon dalam menu
- `.sidebar-logout-btn` - Logout button
- Scrollbar styling

## 🎨 Manfaat Pemisahan CSS

1. **Mudah Maintenance** - Setiap file fokus pada satu halaman
2. **Easy Customization** - Ubah style halaman tertentu tanpa mempengaruhi yang lain
3. **Better Organization** - Struktur yang jelas dan terorganisir
4. **Reusability** - Global styles di App.css bisa digunakan semua halaman
5. **Performance** - Hanya load CSS yang dibutuhkan (dengan bundler seperti Vite)
6. **Collaboration** - Tim bisa bekerja pada styling berbeda halaman secara parallel

## 📝 Cara Mengubah Style

### Mengubah style halaman tertentu:
```jsx
// Buka file CSS halaman tersebut, misalnya Dashboard.css
// Ubah style sesuai kebutuhan
```

### Mengubah style global:
```jsx
// Buka App.css
// Ubah style untuk semua halaman (tombol, form, tabel, dll)
```

### Mengubah style Sidebar:
```jsx
// Buka Sidebar.css
// Ubah style navigasi sidebar
```

## 🔄 Import Structure

Setiap file JSX mengimport CSS-nya sendiri:
```jsx
// Login.jsx
import './Login.css'

// Dashboard.jsx
import './Dashboard.css'

// Sidebar.jsx
import './Sidebar.css'
```

Plus semua file menggunakan global styles dari `App.css` melalui import di App.jsx.

---

**Catatan:** Semua class names yang digunakan sudah diperbarui sesuai dengan naming convention yang spesifik untuk setiap halaman (contoh: `.dashboard-`, `.products-`, `.sales-`, dll).
