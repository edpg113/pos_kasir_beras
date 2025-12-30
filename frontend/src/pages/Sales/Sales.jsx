import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import Modal from "../../components/Modal";
import "./style/Sales.scss";
import axios from "axios";
import { printReceipt } from "../../utils/printReceipt";
import ProductAutocomplete from "../../components/ProductAutocomplete";
import done2 from "../../assets/done2.gif";
import { useToast } from "../../components/Toast/Toast";

export default function Sales({ onLogout, user, storeName }) {
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [produk, setProduk] = useState([]);
  const [transaksi, setTransaksi] = useState([]);
  const [storeSettings, setStoreSettings] = useState(null);
  const [lastTransaction, setLastTransaction] = useState(null);
  const toast = useToast();

  // New State for enhancements
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dailyGross, setDailyGross] = useState(0);
  const [dailyReturn, setDailyReturn] = useState(0);
  const [dailyNet, setDailyNet] = useState(0);

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
        .catch(() =>
          toast.showToast("Gagal mengambil data produk", {
            type: "error",
          })
        );
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
      toast.showToast("❌ Pilih minimal 1 produk", {
        type: "error",
      });
      return;
    }

    try {
      const response = await axios.post("http://localhost:3000/api/transaksi", {
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
        kode_transaksi: response.data.kode_transaksi, // Get from backend
        kasir: user.nama, // From props
      });

      setShowModal(false);
      setShowSuccessModal(true); // Open Success Modal instead of just alert

      setItems([{ produk_id: "", nama: "", harga: 0, qty: 1, subtotal: 0 }]);
      setPembeli("");
      setBayar(0);
      getTransaksi(selectedDate); // Refresh with current date filter
    } catch (err) {
      toast.showToast("❌ Gagal menyimpan transaksi", {
        type: "error",
      });
      console.error(err);
    }
  };

  const handleCancel = async () => {
    setShowModal(false);
    setItems([{ produk_id: "", nama: "", harga: 0, qty: 1, subtotal: 0 }]);
    setPembeli("");
    setBayar(0);
  };

  // =============================
  // FETCH TRANSAKSI
  // =============================
  const getTransaksi = async (date) => {
    try {
      // Ambil transaksi
      const resTransaksi = await axios.get(
        `http://localhost:3000/api/gettransaksi?date=${date}`
      );
      setTransaksi(resTransaksi.data);
      const grossSales = resTransaksi.data.reduce(
        (sum, item) => sum + item.subtotal,
        0
      );
      setDailyGross(grossSales);

      // Ambil retur untuk tanggal tersebut
      const resRetur = await axios.get("http://localhost:3000/api/retur", {
        params: { startDate: date, endDate: date },
      });
      const totalRetur = resRetur.data
        .filter((r) => r.tipe === "penjualan")
        .reduce((sum, item) => sum + Number(item.total_nilai), 0);

      setDailyReturn(totalRetur);
      setDailyNet(grossSales - totalRetur);
    } catch (error) {
      console.log(error);
    }
  };

  const handlePrint = () => {
    if (!lastTransaction || !storeSettings) {
      toast.showToast("Data transaksi atau setting toko belum siap cetak.", {
        type: "error",
      });
      return;
    }

    printReceipt(storeSettings, lastTransaction);
  };

  return (
    <div className="sales-container">
      <Sidebar onLogout={onLogout} user={user} storeName={storeName} />

      <div className="sales-content-wrapper">
        <Navbar title="Penjualan" onLogout={onLogout} user={user} />

        <div>
          <div className="pelanggan-page-content">
            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              <div
                className="dashboard-stat-card"
                style={{
                  minWidth: "200px",
                  padding: "20px",
                  borderRadius: "15px",
                  backgroundColor: "#f8f9fa",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                  marginBottom: "20px",
                }}
              >
                <h3
                  style={{
                    marginBottom: "10px",
                    fontSize: "14px",
                    color: "#7f8c8d",
                  }}
                >
                  Total Penjualan (Bruto)
                </h3>
                <div className="value" style={{ fontSize: "20px" }}>
                  {dailyGross.toLocaleString("id-ID")}
                </div>
                <div className="unit">Rp</div>
              </div>

              <div
                className="dashboard-stat-card"
                style={{
                  minWidth: "200px",
                  padding: "20px",
                  borderRadius: "15px",
                  backgroundColor: "#f8f9fa",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                  marginBottom: "20px",
                }}
              >
                <h3
                  style={{
                    marginBottom: "10px",
                    fontSize: "14px",
                    color: "#e67e22",
                  }}
                >
                  Total Retur
                </h3>
                <div
                  className="value"
                  style={{ fontSize: "20px", color: "#e67e22" }}
                >
                  {dailyReturn.toLocaleString("id-ID")}
                </div>
                <div className="unit">Rp</div>
              </div>

              <div
                className="dashboard-stat-card"
                style={{
                  minWidth: "200px",
                  padding: "20px",
                  borderRadius: "15px",
                  backgroundColor: "#f8f9fa",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                  marginBottom: "20px",
                  borderLeft: "4px solid #27ae60",
                }}
              >
                <h3
                  style={{
                    marginBottom: "10px",
                    fontSize: "14px",
                    color: "#27ae60",
                  }}
                >
                  Penjualan Bersih (Net)
                </h3>
                <div
                  className="value"
                  style={{ fontSize: "24px", color: "#27ae60" }}
                >
                  {dailyNet.toLocaleString("id-ID")}
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
                    <th>Kode Transaksi</th>
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
                      <td>{item.kode_transaksi}</td>
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
          <Modal
            isOpen={showModal}
            onClose={handleCancel}
            title="Tambah Transaksi"
            className="large"
          >
            <div className="modal-body">
              {/* ===== ITEMS ===== */}
              {items.map((item, index) => (
                <div key={index} className="item-row">
                  <ProductAutocomplete
                    products={produk}
                    value={item.produk_id}
                    onChange={(selectedProduct) => {
                      // jika belum pilih produk / clear
                      if (!selectedProduct) {
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

                      const newItems = [...items];
                      newItems[index] = {
                        ...item,
                        produk_id: selectedProduct.id,
                        nama: selectedProduct.namaProduk,
                        harga: selectedProduct.harga,
                        subtotal: selectedProduct.harga * item.qty,
                      };
                      setItems(newItems);
                    }}
                  />

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

              <div className="form-group">
                <label>Pembeli</label>
                <input
                  type="text"
                  className="form-control"
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
            </div>

            {/* ===== FOOTER ===== */}
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCancel}>
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
          </Modal>

          {/* ================= SUCCESS MODAL ================= */}
          <Modal
            isOpen={showSuccessModal && lastTransaction !== null}
            onClose={() => setShowSuccessModal(false)}
            title="Transaksi Berhasil!"
          >
            {lastTransaction && (
              <div className="modal-body">
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <div style={{ fontSize: "40px", marginBottom: "10px" }}>
                    <img src={done2} alt="" />
                  </div>
                  <p>Transaksi telah disimpan.</p>
                  {lastTransaction.kode_transaksi && (
                    <h3 style={{ color: "#3498db", marginTop: "5px" }}>
                      {lastTransaction.kode_transaksi}
                    </h3>
                  )}
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
            )}
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
          </Modal>
        </div>
      </div>
    </div>
  );
}
