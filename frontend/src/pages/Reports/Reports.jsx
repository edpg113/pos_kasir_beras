import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import "./style/Reports.scss";
import Navbar from "../../components/Navbar";
import axios from "axios";

export default function Reports({ onLogout, user, storeName }) {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [summaryStats, setSummaryStats] = useState({
    total_penjualan: 0,
    total_terjual: 0,
    total_keuntungan: 0,
    rata_rata: 0,
  });
  const [monthlySales, setMonthlySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [customerStats, setCustomerStats] = useState([]);

  // =============================
  // HANDLE FETCH DATA
  // =============================
  const fetchSummary = async (date) => {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/reports/summary?date=${date}`
      );
      setSummaryStats(response.data);
    } catch (error) {
      console.error("Gagal mengambil summary laporan:", error);
    }
  };

  const fetchTopProducts = async (date) => {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/reports/top-products?date=${date}`
      );
      setTopProducts(response.data);
    } catch (error) {
      console.error("Gagal mengambil produk terlaris:", error);
    }
  };

  const fetchMonthly = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/reports/monthly"
      );
      setMonthlySales(response.data);
    } catch (error) {
      console.error("Gagal mengambil penjualan bulanan:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/reports/customers"
      );
      setCustomerStats(response.data);
    } catch (error) {
      console.error("Gagal mengambil statistik pelanggan:", error);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleExport = () => {
    // Trigger download directly
    window.location.href = `http://localhost:3000/api/reports/export?date=${selectedDate}`;
  };

  useEffect(() => {
    fetchSummary(selectedDate);
    fetchTopProducts(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    fetchMonthly();
    fetchCustomers();
  }, []);

  return (
    <div className="reports-container">
      <Sidebar onLogout={onLogout} user={user} storeName={storeName} />
      <div className="reports-content-wrapper">
        <Navbar title="Laporan" onLogout={onLogout} user={user} />

        <div className="reports-page-content">
          <div className="reports-page-header">
            <h1>Laporan & Analitik</h1>
            <p>Analisis penjualan dan performa bisnis Anda</p>
          </div>

          <div className="reports-filter-bar">
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
            />
            <button
              className="btn btn-primary"
              style={{ width: "auto" }}
              onClick={handleExport}
            >
              📥 Export
            </button>
          </div>

          <div className="reports-stats-grid">
            <div className="reports-stat-card">
              <h3>Total Penjualan</h3>
              <div className="value">
                {Number(summaryStats.total_penjualan).toLocaleString("id-ID")}
              </div>
              <div className="unit">Rp</div>
            </div>
            <div className="reports-stat-card">
              <h3>Total Terjual</h3>
              <div className="value">{summaryStats.total_terjual}</div>
              <div className="unit">item</div>
            </div>
            <div
              className="reports-stat-card"
              style={{ borderLeftColor: "#27ae60" }}
            >
              <h3>Total Keuntungan</h3>
              <div className="value" style={{ color: "#27ae60" }}>
                {Number(summaryStats.total_keuntungan).toLocaleString("id-ID")}
              </div>
              <div className="unit">Rp</div>
            </div>
            <div className="reports-stat-card">
              <h3>Rata-rata Pendapatan</h3>
              <div className="value">
                {Number(summaryStats.rata_rata || 0).toLocaleString("id-ID")}
              </div>
              <div className="unit">Rp/transaksi</div>
            </div>
            <div className="reports-stat-card">
              <h3>Total Pelanggan</h3>
              <div className="value">
                {customerStats.reduce((acc, curr) => acc + curr.jumlah, 0)}
              </div>
              <div className="unit">orang</div>
            </div>
          </div>

          <div className="reports-card">
            <h2>Penjualan Bulanan (Tahun Ini)</h2>
            <div className="reports-table-container">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Bulan</th>
                    <th>Total Penjualan</th>
                    <th>Jumlah (item)</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlySales.length > 0 ? (
                    monthlySales.map((item, index) => (
                      <tr key={index}>
                        <td>{item.bulan}</td>
                        <td>
                          <strong>
                            {Number(item.total).toLocaleString("id-ID")}
                          </strong>
                        </td>
                        <td>{item.qty}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: "center" }}>
                        Belum ada data penjualan tahun ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="reports-grid-2">
            <div className="reports-card">
              <h2>
                Produk Terlaris (
                {new Date(selectedDate).toLocaleDateString("id-ID")})
              </h2>
              <div className="reports-table-container">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Produk</th>
                      <th>Penjualan</th>
                      <th>Qty</th>
                      <th>Keuntungan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.length > 0 ? (
                      topProducts.map((item, index) => (
                        <tr key={index}>
                          <td>{item.produk}</td>
                          <td>
                            <strong>
                              {Number(item.penjualan).toLocaleString("id-ID")}
                            </strong>
                          </td>
                          <td>{item.qty}</td>
                          <td
                            style={{
                              color:
                                item.keuntungan >= 0 ? "#27ae60" : "#e74c3c",
                            }}
                          >
                            <strong>
                              {Number(item.keuntungan).toLocaleString("id-ID")}
                            </strong>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ textAlign: "center" }}>
                          Tidak ada penjualan untuk tanggal ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="reports-card">
              <h2>Statistik Pelanggan</h2>
              <div className="reports-table-container">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Kategori</th>
                      <th>Jumlah</th>
                      <th>Persentase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerStats.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{item.kategori}</strong>
                        </td>
                        <td>{item.jumlah} orang</td>
                        <td>{item.persentase}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
