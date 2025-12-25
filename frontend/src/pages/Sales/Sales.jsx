import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "./style/Sales.scss";
import axios from "axios";
import { printReceipt } from "../../utils/printReceipt";

export default function Sales({ onLogout, user, storeName }) {
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [produk, setProduk] = useState([]);
  const [transaksi, setTransaksi] = useState([]);
  const [storeSettings, setStoreSettings] = useState(null);
  const [lastTransaction, setLastTransaction] = useState(null);

  // New State for enhancements
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dailyTotal, setDailyTotal] = useState(0);

  const [items, setItems] = useState([
    { produk_id: "", nama: "", harga: 0, qty: 1, subtotal: 0 },
  ]);

  const [pembeli, setPembeli] = useState("");
  const [bayar, setBayar] = useState(0);

  useEffect(() => {
    getProduct();
    getSettings();
  }, []);

  // Fetch transactions whenever date changes
  useEffect(() => {
    getTransaksi(selectedDate);
  }, [selectedDate]);

  const getSettings = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/getsetting");
      if (response.data && response.data.length > 0) {
        setStoreSettings(response.data[0]);
      }
    } catch (error) {
      console.error("Gagal mengambil setting toko:", error);
    }
  };

  // =============================
  // FETCH PRODUK READY
  // =============================
  const getProduct = async () => {
    try {
      axios
        .get("http://localhost:3000/api/getproducts")
        .then((res) => setProduk(res.data))
        .catch(() => alert("Gagal mengambil data produk"));
    } catch (error) {
      console.log(error);
    }
  };

  // =============================
  // HITUNG TOTAL & KEMBALIAN
  // =============================
  const total = items.reduce((sum, i) => sum + i.subtotal, 0);
  const selisih = bayar - total;

  // =============================
  // HANDLE SIMPAN TRANSAKSI
  // =============================
  const handleSubmit = async () => {
    const validItems = items.filter((i) => i.produk_id && i.qty > 0);

    if (validItems.length === 0) {
      alert("❌ Pilih minimal 1 produk");
      return;
    }

    try {
      await axios.post("http://localhost:3000/api/transaksi", {
        pembeli,
        total,
        bayar,
        kembalian: selisih,
        items: validItems,
      });

      setLastTransaction({
        pembeli,
        total,
        bayar,
        kembalian: selisih,
        items: validItems,
        tanggal: new Date(),
      });

      setShowModal(false);
      setShowSuccessModal(true); // Open Success Modal instead of just alert

      setItems([{ produk_id: "", nama: "", harga: 0, qty: 1, subtotal: 0 }]);
      setPembeli("");
      setBayar(0);
      getTransaksi(selectedDate); // Refresh with current date filter
    } catch (err) {
      alert("❌ Gagal menyimpan transaksi");
      console.error(err);
    }
  };

  // =============================
  // FETCH TRANSAKSI
  // =============================
  const getTransaksi = async (date) => {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/gettransaksi?date=${date}`
      );
      setTransaksi(response.data);

      // Calculate daily total from unique transactions displayed
      // Since response contains joined details, we sum up subtotals to avoid double counting if we just took 'total' from duplicate transaction rows?
      // Actually, standard practice with joined rows: sum all subtotals = total revenue.
      const totalRevenue = response.data.reduce(
        (sum, item) => sum + item.subtotal,
        0
      );
      setDailyTotal(totalRevenue);
    } catch (error) {
      console.log(error);
    }
  };

  const handlePrint = () => {
    if (!lastTransaction || !storeSettings) {
      alert("Data transaksi atau setting toko belum siap cetak.");
      return;
    }

    printReceipt(storeSettings, lastTransaction);
  };

  return (
    <div className="sales-container">
      <Sidebar onLogout={onLogout} user={user} storeName={storeName} />

      <div className="sales-content-wrapper">
        <Navbar title="Penjualan" onLogout={onLogout} user={user} />

        <div style={{ animation: "fadeIn 0.5s ease" }}>
          <div
            className="sales-action-bar"
            style={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              <div
                className="dashboard-stat-card"
                style={{
                  minWidth: "250px",
                  // borderLeft: "4px solid #3498db", // Example primary color, adjust match dashboard
                  padding: "20px",
                  borderRadius: "15px", // Match border-radius variable
                  backgroundColor: "#f8f9fa", // Match light-bg
                  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                  marginBottom: "20px",
                }}
              >
                <h3 style={{ marginBottom: "10px" }}>Total Pendapatan</h3>
                <div className="value">
                  {dailyTotal.toLocaleString("id-ID")}
                </div>
                <div className="unit">Rp</div>
              </div>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  outline: "none",
                }}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              + Tambah Penjualan
            </button>
          </div>

          <div className="sales-table-container">
            <div className="sales-table">
              <table>
                <thead>
                  <tr>
                    <th>Tanggal & jam</th>
                    <th>Produk</th>
                    <th>Qty</th>
                    <th>Pembeli</th>
                    <th>total</th>
                    <th>bayar</th>
                    <th>kembalian</th>
                  </tr>
                </thead>
                <tbody>
                  {transaksi.map((item) => (
                    <tr key={item.transaksi_detail_id}>
                      <td>
                        {new Date(item.tanggal).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>{item.namaProduk}</td>
                      <td>{item.qty}</td>
                      <td>{item.pembeli}</td>
                      <td>Rp.{item.total.toLocaleString("id-ID")}</td>
                      <td>Rp.{item.bayar.toLocaleString("id-ID")}</td>
                      <td>Rp.{item.kembalian.toLocaleString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ================= MODAL ================= */}
          {showModal && (
            <div className="modal-overlay">
              <div className="modal-card large">
                <div className="modal-header">
                  <h2>Tambah Transaksi</h2>
                </div>

                {/* ===== ITEMS ===== */}
                {items.map((item, index) => (
                  <div key={index} className="modal-body item-row">
                    <select
                      value={item.produk_id}
                      onChange={(e) => {
                        const value = Number(e.target.value);

                        // jika belum pilih produk
                        if (!value) {
                          const newItems = [...items];
                          newItems[index] = {
                            ...item,
                            produk_id: "",
                            nama: "",
                            harga: 0,
                            subtotal: 0,
                          };
                          setItems(newItems);
                          return;
                        }

                        const p = produk.find((x) => x.id === value);

                        if (!p) return; // safety guard

                        const newItems = [...items];
                        newItems[index] = {
                          ...item,
                          produk_id: p.id,
                          nama: p.namaProduk,
                          harga: p.harga,
                          subtotal: p.harga * item.qty,
                        };
                        setItems(newItems);
                      }}
                    >
                      <option value="">-- Pilih Produk --</option>
                      {produk.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.namaProduk}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].qty = Number(e.target.value);
                        newItems[index].subtotal =
                          newItems[index].qty * newItems[index].harga;
                        setItems(newItems);
                      }}
                    />

                    <div className="price">
                      Rp {item.subtotal.toLocaleString("id-ID")}
                    </div>

                    {items.length > 1 && (
                      <button
                        className="remove"
                        onClick={() =>
                          setItems(items.filter((_, i) => i !== index))
                        }
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                <button
                  className="add-item"
                  onClick={() =>
                    setItems([
                      ...items,
                      {
                        produk_id: "",
                        nama: "",
                        harga: 0,
                        qty: 1,
                        subtotal: 0,
                      },
                    ])
                  }
                >
                  + Tambah Produk
                </button>

                {/* ===== PEMBELI ===== */}
                <div className="row">
                  <span>Pembeli : </span>
                  <input
                    type="text"
                    value={pembeli}
                    onChange={(e) => setPembeli(e.target.value)}
                    placeholder="Nama pembeli"
                  />
                </div>

                {/* ===== RINGKASAN ===== */}
                <div className="summary">
                  <div className="row">
                    <span>Total</span>
                    <strong>Rp {total.toLocaleString("id-ID")}</strong>
                  </div>

                  <div className="row">
                    <span>Bayar</span>
                    <input
                      type="number"
                      value={bayar}
                      onChange={(e) => setBayar(Number(e.target.value))}
                    />
                  </div>

                  <div className={`row ${selisih < 0 ? "minus" : "plus"}`}>
                    <span>{selisih < 0 ? "Kurang" : "Kembalian"}</span>
                    <strong>
                      Rp {Math.abs(selisih).toLocaleString("id-ID")}
                    </strong>
                  </div>

                  {selisih < 0 && (
                    <div className="warning">⚠ Uang pembayaran kurang</div>
                  )}
                </div>

                {/* ===== FOOTER ===== */}
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Batal
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={selisih < 0 || total === 0}
                    onClick={handleSubmit}
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= SUCCESS MODAL ================= */}
          {showSuccessModal && lastTransaction && (
            <div className="modal-overlay">
              <div className="modal-card">
                <div className="modal-header">
                  <h2>Transaksi Berhasil!</h2>
                </div>
                <div className="modal-body">
                  <div style={{ textAlign: "center", marginBottom: "20px" }}>
                    <div style={{ fontSize: "40px", marginBottom: "10px" }}>
                      <img src="/done2.gif" alt="" />
                    </div>
                    <p>Transaksi telah disimpan.</p>
                  </div>

                  <div
                    className="summary"
                    style={{
                      border: "1px solid #eee",
                      padding: "15px",
                      borderRadius: "8px",
                    }}
                  >
                    <h4>Ringkasan:</h4>
                    <ul
                      style={{
                        listStyle: "none",
                        padding: 0,
                        marginTop: "10px",
                      }}
                    >
                      {lastTransaction.items.map((item, idx) => (
                        <li
                          key={idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "5px",
                          }}
                        >
                          <span>
                            {item.nama} x {item.qty}
                          </span>
                          <strong>
                            Rp {item.subtotal.toLocaleString("id-ID")}
                          </strong>
                        </li>
                      ))}
                    </ul>
                    <div
                      style={{
                        borderTop: "1px dashed #ccc",
                        marginTop: "10px",
                        paddingTop: "10px",
                      }}
                    >
                      <div className="row">
                        <span>Total</span>
                        <strong>
                          Rp {lastTransaction.total.toLocaleString("id-ID")}
                        </strong>
                      </div>
                      <div className="row">
                        <span>Bayar</span>
                        <strong>
                          Rp {lastTransaction.bayar.toLocaleString("id-ID")}
                        </strong>
                      </div>
                      <div className="row">
                        <span>Kembalian</span>
                        <strong>
                          Rp {lastTransaction.kembalian.toLocaleString("id-ID")}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowSuccessModal(false)}
                  >
                    Selesai
                  </button>
                  <button className="btn btn-primary" onClick={handlePrint}>
                    🖨 Cetak Struk
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
