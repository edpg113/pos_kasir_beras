import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import "./style/Inventory.scss";
import Navbar from "../../components/Navbar";

export default function Inventory({ onLogout, user }) {
  const [inventory] = useState([
    {
      id: 1,
      produk: "Beras Putih Premium",
      stok: 150,
      minStok: 50,
      reorder: 100,
      lokasi: "Rak A1",
      lastUpdate: "2025-12-09",
    },
    {
      id: 2,
      produk: "Beras Merah Organik",
      stok: 85,
      minStok: 40,
      reorder: 80,
      lokasi: "Rak B2",
      lastUpdate: "2025-12-08",
    },
    {
      id: 3,
      produk: "Beras Jasmine",
      stok: 120,
      minStok: 50,
      reorder: 100,
      lokasi: "Rak A3",
      lastUpdate: "2025-12-09",
    },
    {
      id: 4,
      produk: "Beras Ketan",
      stok: 60,
      minStok: 30,
      reorder: 70,
      lokasi: "Rak C1",
      lastUpdate: "2025-12-07",
    },
    {
      id: 5,
      produk: "Beras Basmati",
      stok: 45,
      minStok: 30,
      reorder: 60,
      lokasi: "Rak B3",
      lastUpdate: "2025-12-09",
    },
    {
      id: 6,
      produk: "Beras Putih Standar",
      stok: 200,
      minStok: 80,
      reorder: 150,
      lokasi: "Rak A2",
      lastUpdate: "2025-12-09",
    },
  ]);

  const getStokStatus = (stok, minStok) => {
    if (stok <= minStok)
      return <span className="badge badge-danger">Perlu Reorder</span>;
    if (stok <= minStok * 1.5)
      return <span className="badge badge-warning">Rendah</span>;
    return <span className="badge badge-success">Normal</span>;
  };

  const totalStok = inventory.reduce((sum, item) => sum + item.stok, 0);
  const needReorder = inventory.filter(
    (item) => item.stok <= item.minStok
  ).length;

  return (
    <div className="inventory-container">
      <Sidebar onLogout={onLogout} user={user} />
      <div className="inventory-content-wrapper">
        <Navbar title="Inventory" onLogout={onLogout} user={user} />

        <div className="inventory-page-content">
          <div className="inventory-page-header">
            <h1>Manajemen Inventori</h1>
            <p>Pantau stok beras dan kelola reorder produk</p>
          </div>

          <div className="inventory-stats-grid">
            <div className="inventory-stat-card">
              <h3>Total Stok</h3>
              <div className="value">{totalStok}</div>
              <div className="unit">kg</div>
            </div>
            <div className="inventory-stat-card">
              <h3>Jumlah Produk</h3>
              <div className="value">{inventory.length}</div>
              <div className="unit">item</div>
            </div>
            <div className="inventory-stat-card">
              <h3>Perlu Reorder</h3>
              <div
                className="value"
                style={{ color: needReorder > 0 ? "#e74c3c" : "#27ae60" }}
              >
                {needReorder}
              </div>
              <div className="unit">produk</div>
            </div>
            <div className="inventory-stat-card">
              <h3>Rata-rata Stok</h3>
              <div className="value">
                {Math.round(totalStok / inventory.length)}
              </div>
              <div className="unit">kg</div>
            </div>
          </div>

          <div className="inventory-action-bar">
            <button className="btn btn-primary" style={{ width: "auto" }}>
              + Tambah Stok
            </button>
          </div>

          <div className="inventory-card">
            <h2>Detail Inventori</h2>
            <div className="inventory-table-container">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>Stok Saat Ini (kg)</th>
                    <th>Min Stok (kg)</th>
                    <th>Qty Reorder (kg)</th>
                    <th>Lokasi</th>
                    <th>Status</th>
                    <th>Update Terakhir</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.produk}</strong>
                      </td>
                      <td>{item.stok}</td>
                      <td>{item.minStok}</td>
                      <td>{item.reorder}</td>
                      <td>{item.lokasi}</td>
                      <td>{getStokStatus(item.stok, item.minStok)}</td>
                      <td>{item.lastUpdate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
