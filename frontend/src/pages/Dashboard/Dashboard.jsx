import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import "./style/Dashboard.scss";
import Navbar from "../../components/Navbar";
import axios from "axios";
// import Inventory from "../Inventory/Inventory";

export default function Dashboard({ onLogout, user, storeName }) {
  const [transaksi, setTransaksi] = useState([]);
  const [stats, setStats] = useState({
    total_penjualan: 0,
    produk_terjual: 0,
    stok_beras: 0,
  });
  const [inventory, setInventory] = useState([]);
  const [pelanggan, setPelanggan] = useState([]);

  // =============================
  // HANDLE FETCH TRANSAKSI
  // =============================
  const fetchTransaksi = async () => {
    const today = new Date().toISOString().split("T")[0];
    axios
      .get(`http://localhost:3000/api/gettransaksi?date=${today}`)
      .then((res) => setTransaksi(res.data))
      .catch((err) => console.error(err));
  };
  // =============================
  // HANDLE FETCH STATS
  // =============================
  const fetchStats = async () => {
    axios
      .get("http://localhost:3000/api/dashboard-stats")
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err));
  };

  // =============================
  // HANDLE FETCH STOCK
  // =============================
  const fetchInventory = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/inventory");
      setInventory(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  // =============================
  // HANDLE FETCH PELANGGAN
  // =============================
  const fetchPelanggan = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/pelanggan");
      setPelanggan(response.data);
    } catch (error) {
      console.error("Gagal mengambil data pelanggan:", error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchTransaksi();
    fetchInventory();
    fetchPelanggan();
  }, []);

  const needReorder = inventory.filter(
    (item) => item.stok <= item.minStok
  ).length;
  // const averageStock =
  //   inventory.length > 0 ? Math.round(totalStok / inventory.length) : 0;

  return (
    <div className="dashboard-container">
      <Sidebar onLogout={onLogout} user={user} storeName={storeName} />
      <div className="dashboard-content-wrapper">
        <Navbar
          title="Dashboard"
          onLogout={onLogout}
          user={user}
          storeName={storeName}
        />

        <div className="dashboard-page-content">
          <div className="dashboard-page-header">
            <h1>Selamat Datang di Toko Beras Sumber Negeri</h1>
            <p>Kelola toko beras Anda dengan mudah dan efisien</p>
          </div>

          <div className="dashboard-stats-grid">
            <div className="dashboard-stat-card">
              <h3>Total Penjualan (Bruto)</h3>
              <div className="value">
                {Number(stats.total_penjualan).toLocaleString("id-ID")}
              </div>
              <div className="unit">Rp</div>
            </div>

            <div className="dashboard-stat-card">
              <h3 style={{ color: "#e67e22" }}>Total Retur</h3>
              <div className="value" style={{ color: "#e67e22" }}>
                {Number(stats.total_retur || 0).toLocaleString("id-ID")}
              </div>
              <div className="unit">Rp</div>
            </div>

            <div
              className="dashboard-stat-card"
              style={{ borderLeft: "4px solid #27ae60" }}
            >
              <h3 style={{ color: "#27ae60" }}>Penjualan Bersih (Net)</h3>
              <div className="value" style={{ color: "#27ae60" }}>
                {Number(stats.net_sales || 0).toLocaleString("id-ID")}
              </div>
              <div className="unit">Rp</div>
            </div>

            <div className="dashboard-stat-card">
              <h3>Produk Terjual</h3>
              <div className="value">{stats.produk_terjual}</div>
              <div className="unit">kg</div>
            </div>

            <div className="dashboard-stat-card">
              <h3>Total Stok Beras</h3>
              <div className="value">{stats.stok_beras}</div>
              <div className="unit">kg</div>
            </div>
            <div className="dashboard-stat-card">
              <h3>Total Produk</h3>
              <div className="value">{inventory.length}</div>
              <div className="unit">produk</div>
            </div>
            <div className="dashboard-stat-card">
              <h3>Perlu Reorder</h3>
              <div
                className="value"
                style={{ color: needReorder > 0 ? "#e74c3c" : "#27ae60" }}
              >
                {needReorder}
              </div>
              <div className="unit">produk</div>
            </div>
            <div className="dashboard-stat-card">
              <h3>Total Pelanggan</h3>
              <div className="value">{pelanggan.length}</div>
              <div className="unit">pelanggan</div>
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
                      <td>Rp. {sale.total.toLocaleString("id-ID")}</td>
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
