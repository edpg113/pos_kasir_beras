import React from "react";
import Sidebar from "../../components/Sidebar";
import "./style/Dashboard.scss";
import Navbar from "../../components/Navbar";

export default function Dashboard({ onLogout, user }) {
  const dashboardStats = [
    { title: "Total Penjualan", value: "2.450.000", unit: "Rp" },
    { title: "Produk Terjual", value: "145", unit: "kg" },
    { title: "Stok Beras", value: "1.200", unit: "kg" },
    { title: "Pelanggan", value: "87", unit: "orang" },
  ];

  const recentSales = [
    {
      id: 1,
      tanggal: "2025-12-09",
      produk: "Beras Putih Premium",
      qty: 10,
      total: 85000,
    },
    {
      id: 2,
      tanggal: "2025-12-09",
      produk: "Beras Merah Organik",
      qty: 5,
      total: 55000,
    },
    {
      id: 3,
      tanggal: "2025-12-08",
      produk: "Beras Jasmine",
      qty: 15,
      total: 135000,
    },
    {
      id: 4,
      tanggal: "2025-12-08",
      produk: "Beras Ketan",
      qty: 8,
      total: 64000,
    },
    {
      id: 5,
      tanggal: "2025-12-07",
      produk: "Beras Putih Premium",
      qty: 20,
      total: 170000,
    },
  ];

  return (
    <div className="dashboard-container">
      <Sidebar onLogout={onLogout} user={user} />
      <div className="dashboard-content-wrapper">
        
        <Navbar title="Dashboard" onLogout={onLogout} user={user} />

        <div className="dashboard-page-content">
          <div className="dashboard-page-header">
            <h1>Selamat Datang di Dashboard</h1>
            <p>Kelola toko beras Anda dengan mudah dan efisien</p>
          </div>

          <div className="dashboard-stats-grid">
            {dashboardStats.map((stat, index) => (
              <div key={index} className="dashboard-stat-card">
                <h3>{stat.title}</h3>
                <div className="value">{stat.value}</div>
                <div className="unit">{stat.unit}</div>
              </div>
            ))}
          </div>

          <div className="dashboard-card">
            <h2>Penjualan Terbaru</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Produk</th>
                    <th>Jumlah (kg)</th>
                    <th>Total (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale) => (
                    <tr key={sale.id}>
                      <td>{sale.tanggal}</td>
                      <td>{sale.produk}</td>
                      <td>{sale.qty}</td>
                      <td>{sale.total.toLocaleString("id-ID")}</td>
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
