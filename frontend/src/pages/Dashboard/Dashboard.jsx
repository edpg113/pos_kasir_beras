import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import "./style/Dashboard.scss";
import Navbar from "../../components/Navbar";
import axios from "axios";

export default function Dashboard({ onLogout, user }) {
  const [transaksi, setTrasaksi] = useState([]);
  const [stats, setStats] = useState({
    total_penjualan: 0,
    produk_terjual: 0,
    stok_beras: 0,
  });

  useEffect(() => {
    fetchStats();
    fetchTransaksi();
  }, []);

  const fetchTransaksi = async () => {
    axios
      .get("http://localhost:3000/api/gettransaksi")
      .then((res) => setTrasaksi(res.data))
      .catch((err) => console.error(err));
  };

  const fetchStats = async () => {
    axios
      .get("http://localhost:3000/api/dashboard-stats")
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err));
  };

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
            <div className="dashboard-stats-grid">
              <div className="dashboard-stat-card">
                <h3>Total Penjualan</h3>
                <div className="value">
                  Rp {Number(stats.total_penjualan).toLocaleString("id-ID")}
                </div>
              </div>

              <div className="dashboard-stat-card">
                <h3>Produk Terjual</h3>
                <div className="value">{stats.produk_terjual} kg</div>
              </div>

              <div className="dashboard-stat-card">
                <h3>Stok Beras</h3>
                <div className="value">{stats.stok_beras} kg</div>
              </div>
            </div>
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
                  {transaksi.map((sale) => (
                    <tr key={sale.id}>
                      <td>
                        {new Date(sale.tanggal).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>{sale.namaProduk}</td>
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
