import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import Modal from "../../components/Modal";
import "./style/Piutang.scss";
import { useToast } from "../../components/Toast/Toast";

export default function Piutang({ onLogout, user, storeName }) {
  const [piutangData, setPiutangData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const toast = useToast();

  // Date Filter States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPiutang, setSelectedPiutang] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    jumlah: 0,
    metode: "cash",
    keterangan: "",
  });

  useEffect(() => {
    fetchPiutang();
  }, [startDate, endDate]);

  const fetchPiutang = async () => {
    try {
      let url = "http://localhost:3000/api/piutang";
      const params = [];

      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);

      if (params.length > 0) {
        url += `?${params.join("&")}`;
      }

      const response = await axios.get(url);
      setPiutangData(response.data);
    } catch (error) {
      console.error("Error fetching piutang:", error);
      toast.showToast("Gagal mengambil data piutang", { type: "error" });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleOpenPaymentModal = (item) => {
    setSelectedPiutang(item);
    setPaymentForm({
      jumlah: item.sisa,
      metode: "cash",
      keterangan: `Pembayaran piutang ${item.produk}`,
    });
    setShowPaymentModal(true);
  };

  const handleSavePayment = async () => {
    if (paymentForm.jumlah <= 0) {
      toast.showToast("Jumlah pembayaran harus lebih dari 0", {
        type: "error",
      });
      return;
    }

    if (paymentForm.jumlah > selectedPiutang.sisa) {
      toast.showToast("Jumlah pembayaran melebihi sisa piutang", {
        type: "error",
      });
      return;
    }

    try {
      await axios.post(
        `http://localhost:3000/api/piutang/${selectedPiutang.id}/bayar`,
        paymentForm,
      );
      toast.showToast("✅ Pembayaran berhasil dicatat", { type: "success" });
      setShowPaymentModal(false);
      fetchPiutang();
    } catch (error) {
      console.error("Error saving payment:", error);
      toast.showToast(
        error.response?.data?.message || "Gagal mencatat pembayaran",
        {
          type: "error",
        },
      );
    }
  };

  const handleDeletePiutang = async (item) => {
    if (item.status !== "paid") {
      toast.showToast("Hanya piutang dengan status 'Paid' yang dapat dihapus", {
        type: "error",
      });
      return;
    }

    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus piutang ${item.nama} - ${item.produk}?`,
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:3000/api/piutang/${item.id}`);
      toast.showToast("✅ Piutang berhasil dihapus", { type: "success" });
      fetchPiutang();
    } catch (error) {
      console.error("Error deleting piutang:", error);
      toast.showToast(
        error.response?.data?.message || "Gagal menghapus piutang",
        { type: "error" },
      );
    }
  };

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case "open":
        return <span className="badge status-open">Open</span>;
      case "partial":
        return <span className="badge status-partial">Partial</span>;
      case "paid":
        return <span className="badge status-paid">Paid</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const filteredData = piutangData.filter(
    (item) =>
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.produk.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="piutang-container">
      <Sidebar onLogout={onLogout} user={user} storeName={storeName} />
      <div className="piutang-content-wrapper">
        <Navbar title="Piutang Pelanggan" onLogout={onLogout} user={user} />

        <div className="piutang-page-content">
          <div className="piutang-page-header">
            <h1>Daftar Piutang Pelanggan</h1>
            <p>Pantau dan kelola piutang pelanggan dengan mudah</p>
          </div>

          <div className="piutang-controls">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Cari nama pelanggan atau produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-group">
              {(startDate || endDate) && (
                <button
                  className="btn-icon btn-secondary"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  style={{ marginLeft: "8px" }}
                >
                  <span>🔄</span> Reset
                </button>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: "13px", marginBottom: "5px" }}>
                Dari Tanggal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  padding: "8px",
                  borderRadius: "5px",
                  // border: "1px solid #ddd",
                  color: "#fff",
                  backgroundColor: "#333333e1",
                }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: "13px", marginBottom: "5px" }}>
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  padding: "8px",
                  borderRadius: "5px",
                  // border: "1px solid #ddd",
                  color: "#fff",
                  backgroundColor: "#333333e1",
                }}
              />
            </div>
          </div>

          {/* {showDateFilter && ( */}
          {/* )} */}

          <div className="piutang-table-card">
            <table className="piutang-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Nama Pelanggan</th>
                  <th>Produk</th>
                  <th>Total Piutang</th>
                  <th>Sisa</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {new Date(item.tanggal).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td style={{ fontWeight: "600" }}>{item.nama}</td>
                      <td>{item.produk}</td>
                      <td>{formatCurrency(item.total)}</td>
                      <td
                        style={{
                          color: item.sisa > 0 ? "#e53e3e" : "#38a169",
                          fontWeight: "600",
                        }}
                      >
                        {formatCurrency(item.sisa)}
                      </td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon btn-payment"
                            title="Tambah Pembayaran"
                            onClick={() => handleOpenPaymentModal(item)}
                            disabled={item.status === "paid"}
                          >
                            <span>➕</span> Bayar
                          </button>
                          <button
                            className="btn-icon btn-success"
                            title="Hapus Piutang"
                            onClick={() => handleDeletePiutang(item)}
                            disabled={item.status !== "paid"}
                            style={{
                              opacity: item.status !== "paid" ? 0.5 : 1,
                              cursor:
                                item.status !== "paid"
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            <span>❌</span> Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      style={{
                        textAlign: "center",
                        padding: "40px",
                        color: "#a0aec0",
                      }}
                    >
                      Tidak ada data piutang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= PAYMENT MODAL ================= */}
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title="Tambah Pembayaran Piutang"
        >
          {selectedPiutang && (
            <div className="modal-body">
              <div className="info-section" style={{ marginBottom: "20px" }}>
                <p>
                  <strong>Pelanggan:</strong> {selectedPiutang.nama}
                </p>
                <p>
                  <strong>Produk:</strong> {selectedPiutang.produk}
                </p>
                <p>
                  <strong>Total Piutang:</strong>{" "}
                  {formatCurrency(selectedPiutang.total)}
                </p>
                <p>
                  <strong>Sisa Hutang:</strong>{" "}
                  <span style={{ color: "#e53e3e", fontWeight: "bold" }}>
                    {formatCurrency(selectedPiutang.sisa)}
                  </span>
                </p>
              </div>

              <div className="form-group">
                <label>Jumlah Bayar</label>
                <input
                  type="number"
                  className="form-control"
                  value={paymentForm.jumlah}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      jumlah: Number(e.target.value),
                    })
                  }
                  max={selectedPiutang.sisa}
                />
              </div>

              <div className="form-group">
                <label>Metode Pembayaran</label>
                <select
                  className="form-control"
                  value={paymentForm.metode}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, metode: e.target.value })
                  }
                >
                  <option value="cash">Cash</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>

              <div className="form-group">
                <label>Keterangan</label>
                <textarea
                  className="form-control"
                  value={paymentForm.keterangan}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      keterangan: e.target.value,
                    })
                  }
                  placeholder="Contoh: Cicilan ke-1"
                />
              </div>
            </div>
          )}
          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              onClick={() => setShowPaymentModal(false)}
            >
              Batal
            </button>
            <button className="btn btn-primary" onClick={handleSavePayment}>
              Simpan Pembayaran
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
