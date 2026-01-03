import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import "./style/Reports.scss";
import Navbar from "../../components/Navbar";
import axios from "axios";
import { useToast } from "../../components/Toast/Toast";

export default function Reports({ onLogout, user, storeName }) {
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
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
  const toast = useToast();

  // =============================
  // HANDLE FETCH DATA
  // =============================
  const fetchSummary = async (start, end) => {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/reports/summary?startDate=${start}&endDate=${end}`
      );
      setSummaryStats(response.data);
    } catch (error) {
      console.error("Gagal mengambil summary laporan:", error);
    }
  };

  const fetchTopProducts = async (start, end) => {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/reports/top-products?startDate=${start}&endDate=${end}`
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

  const handleExport = () => {
    // Trigger download directly
    window.location.href = `http://localhost:3000/api/reports/export?startDate=${startDate}&endDate=${endDate}`;
    toast.showToast("Laporan berhasil diexport!", {
      type: "success",
    });
  };

  useEffect(() => {
    fetchSummary(startDate, endDate);
    fetchTopProducts(startDate, endDate);
  }, [startDate, endDate]);

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

          <div
            className="reports-filter-bar"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <label
                style={{ fontSize: "14px", fontWeight: "600", color: "#555" }}
              >
                Dari:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  backgroundColor: "#fff",
                  color: "#333",
                  padding: "8px",
                  borderRadius: "5px",
                  border: "1px solid #ddd",
                }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <label
                style={{ fontSize: "14px", fontWeight: "600", color: "#555" }}
              >
                Sampai:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  backgroundColor: "#fff",
                  color: "#333",
                  padding: "8px",
                  borderRadius: "5px",
                  border: "1px solid #ddd",
                }}
              />
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "auto", marginLeft: "auto" }}
              onClick={handleExport}
            >
              📥 Cetak PDF (Range)
            </button>
          </div>

          <div className="reports-stats-grid">
            <div className="reports-stat-card">
              <h3>Total Penjualan (Bruto)</h3>
              <div className="value">
                {Number(summaryStats.gross_sales || 0).toLocaleString("id-ID")}
              </div>
              <div className="unit">Rp</div>
            </div>
            <div className="reports-stat-card">
              <h3 style={{ color: "#e67e22" }}>Total Retur</h3>
              <div className="value" style={{ color: "#e67e22" }}>
                {Number(summaryStats.total_retur || 0).toLocaleString("id-ID")}
              </div>
              <div className="unit">Rp</div>
            </div>
            <div
              className="reports-stat-card"
              style={{ borderLeftColor: "#27ae60" }}
            >
              <h3 style={{ color: "#27ae60" }}>Penjualan Bersih (Net)</h3>
              <div className="value" style={{ color: "#27ae60" }}>
                {Number(summaryStats.net_sales || 0).toLocaleString("id-ID")}
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
                    <th>Total Bruto</th>
                    <th>Total Retur</th>
                    <th>Penjualan Bersih</th>
                    <th>Jumlah (item)</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlySales.length > 0 ? (
                    monthlySales.map((item, index) => (
                      <tr key={index}>
                        <td>{item.bulan}</td>
                        <td>
                          {Number(item.total_bruto).toLocaleString("id-ID")}
                        </td>
                        <td style={{ color: "#e67e22" }}>
                          {Number(item.total_retur).toLocaleString("id-ID")}
                        </td>
                        <td>
                          <strong style={{ color: "#27ae60" }}>
                            {Number(item.net_sales).toLocaleString("id-ID")}
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
                {startDate === endDate
                  ? new Date(startDate).toLocaleDateString("id-ID")
                  : `${new Date(startDate).toLocaleDateString(
                      "id-ID"
                    )} - ${new Date(endDate).toLocaleDateString("id-ID")}`}
                )
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
