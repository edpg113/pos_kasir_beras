import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import Modal from "../../components/Modal";
import "./style/pengeluaran.scss";
import axios from "axios";
import { useToast } from "../../components/Toast/Toast";

const Pengeluaran = ({ onLogout, user, storeName }) => {
  const [history, setHistory] = useState([]);
  const [totals, setTotals] = useState({ modal: 0, keluar: 0, sisa: 0 });

  // Modals state
  const [showModalForm, setShowModalForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });

  const toast = useToast();

  // Form States
  const [modalAmount, setModalAmount] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseNote, setExpenseNote] = useState("");

  const fetchHistory = async () => {
    try {
      // Clear data first to indicate loading/change
      setHistory([]);
      setTotals({ modal: 0, keluar: 0, sisa: 0 });

      const response = await axios.get(
        `http://localhost:3000/api/pengeluaran?month=${selectedMonth}`
      );
      console.log("Fetch History Response:", response.data);

      let historyData = [];
      let summaryData = { modal: 0, keluar: 0, sisa: 0 };

      if (Array.isArray(response.data)) {
        // Backend returned array (Legacy/Fallback)
        historyData = response.data;
        // Calculate totals locally
        const totalModal = historyData.reduce(
          (sum, item) => sum + (Number(item.modal) || 0),
          0
        );
        const totalKeluar = historyData.reduce(
          (sum, item) => sum + (Number(item.keluar) || 0),
          0
        );
        summaryData = {
          modal: totalModal,
          keluar: totalKeluar,
          sisa: totalModal - totalKeluar,
        };
      } else {
        // Backend returned object { history, summary }
        historyData = response.data.history || [];
        summaryData = response.data.summary || { modal: 0, keluar: 0, sisa: 0 };
      }

      setHistory(historyData);
      setTotals(summaryData);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.showToast("Gagal mengambil data riwayat", "error", {
        type: "error",
      });
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedMonth]);

  const handleAddModal = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/api/pengeluaran/modal", {
        modal: modalAmount,
      });
      toast.showToast("Modal berhasil ditambahkan", "success");
      setModalAmount("");
      setShowModalForm(false);
      fetchHistory();
    } catch (error) {
      toast.showToast("Gagal menambah modal", "error");
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/api/pengeluaran", {
        keluar: expenseAmount,
        keterangan: expenseNote,
      });
      toast.showToast("Pengeluaran berhasil ditambahkan", "success");
      setExpenseAmount("");
      setExpenseNote("");
      setShowExpenseForm(false);
      fetchHistory();
    } catch (error) {
      toast.showToast("Gagal menambah pengeluaran", "error");
    }
  };

  const handleExportPDF = () => {
    window.location.href = `http://localhost:3000/api/pengeluaran/export-pdf?month=${selectedMonth}`;
  };

  return (
    <div className="pengeluaran-container">
      <Sidebar onLogout={onLogout} user={user} storeName={storeName} />

      <div className="main-content">
        <Navbar title="Pengelolaan Keuangan" onLogout={onLogout} user={user} />

        <div className="header-section">
          <h1>Pengelolaan Keuangan</h1>
          <div className="filter-section">
            <label>Filter Bulan:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
        </div>

        <div className="summary-cards">
          <div className="card modal-card">
            <h3>Total Kas Masuk</h3>
            <div className="amount">
              Rp {Number(totals?.modal || 0).toLocaleString("id-ID")}
            </div>
          </div>
          <div className="card expense-card">
            <h3>Total Pengeluaran</h3>
            <div className="amount">
              Rp {Number(totals?.keluar || 0).toLocaleString("id-ID")}
            </div>
          </div>
          <div className="card balance-card">
            <h3>Sisa Modal</h3>
            <div className="amount">
              Rp {Number(totals?.sisa || 0).toLocaleString("id-ID")}
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button
            className="btn-add-modal"
            onClick={() => setShowModalForm(true)}
          >
            <span>➕</span> Tambah Kas Masuk
          </button>
          <button
            className="btn-add-expense"
            onClick={() => setShowExpenseForm(true)}
          >
            <span>💸</span> Tambah Pengeluaran
          </button>
          <button
            className="btn-export-pdf"
            onClick={handleExportPDF}
            style={{ backgroundColor: "#4318ff", color: "white" }}
          >
            <span>📄</span> Cetak PDF
          </button>
        </div>

        <div className="history-section">
          <h2>Riwayat Transaksi</h2>
          <table>
            <thead>
              <tr>
                <th>Tanggal/Jam</th>
                <th>Keterangan</th>
                <th>Masuk</th>
                <th>Keluar</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>
                    {new Date(item.tanggal).toLocaleDateString("id-ID")}{" "}
                    {new Date(item.tanggal).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>
                    {item.keterangan || (item.modal > 0 ? "Tambah Modal" : "-")}
                  </td>
                  <td>
                    {item.modal > 0 ? (
                      <span className="text-green">
                        + Rp {Number(item.modal).toLocaleString("id-ID")}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {item.keluar > 0 ? (
                      <span className="text-red">
                        - Rp {Number(item.keluar).toLocaleString("id-ID")}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    style={{
                      textAlign: "center",
                      padding: "30px",
                      color: "#a3aed0",
                    }}
                  >
                    Belum ada riwayat transaksi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showModalForm}
        onClose={() => setShowModalForm(false)}
        title="Tambah Modal"
      >
        <form onSubmit={handleAddModal}>
          <div className="form-group">
            <label>Jumlah Modal (Rp)</label>
            <input
              type="number"
              value={modalAmount}
              onChange={(e) => setModalAmount(e.target.value)}
              placeholder="0"
              required
            />
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowModalForm(false)}
            >
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showExpenseForm}
        onClose={() => setShowExpenseForm(false)}
        title="Tambah Pengeluaran"
      >
        <form onSubmit={handleAddExpense}>
          <div className="form-group">
            <label>Jumlah Pengeluaran (Rp)</label>
            <input
              type="number"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              placeholder="0"
              required
            />
          </div>
          <div className="form-group">
            <label>Keterangan</label>
            <textarea
              value={expenseNote}
              onChange={(e) => setExpenseNote(e.target.value)}
              placeholder="Untuk keperluan apa?"
              rows="3"
            />
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowExpenseForm(false)}
            >
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Pengeluaran;
