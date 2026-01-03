import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import ProductAutocomplete from "../../components/ProductAutocomplete";
import axios from "axios";
import { printShipmentReport } from "../../utils/printShipment";
import "./style/pengiriman.scss";
import { useToast } from "../../components/Toast/Toast";

export default function Pengiriman({ onLogout, user, storeName }) {
  const [products, setProducts] = useState([]);
  const [transferHistory, setTransferHistory] = useState([]);
  const [storeSettings, setStoreSettings] = useState(null);

  // Form State
  const [items, setItems] = useState([
    {
      produk_id: "",
      nama: "",
      qty: 1,
      currentStock: 0,
      tujuan: "",
      keterangan: "",
    },
  ]);
  const [tujuan, setTujuan] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastShipmentData, setLastShipmentData] = useState(null);
  const toast = useToast();

  // Filter State
  const [filterDate, setFilterDate] = useState("");

  // Fetch initial data
  useEffect(() => {
    fetchProducts();
    getSettings();
    // set filter date to today by default
    const today = new Date().toISOString().split("T")[0];
    setFilterDate(today);
    fetchHistoryWithDate(today);
  }, []);

  // Fetch history when filterDate changes
  useEffect(() => {
    if (filterDate) {
      fetchHistory();
    }
  }, [filterDate]);

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

  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/inventory");
      setProducts(response.data);
    } catch (error) {
      console.error("Failed to fetch products", error);
    }
  };

  const fetchHistory = async () => {
    try {
      const url = filterDate
        ? `http://localhost:3000/api/inventory/transfer-history?date=${filterDate}`
        : "http://localhost:3000/api/inventory/transfer-history";
      const response = await axios.get(url);
      setTransferHistory(response.data);
    } catch (error) {
      console.error("Failed to fetch history", error);
    }
  };

  // Fetch history with specific date
  const fetchHistoryWithDate = async (date) => {
    try {
      const url = `http://localhost:3000/api/inventory/transfer-history?date=${date}`;
      const response = await axios.get(url);
      setTransferHistory(response.data);
    } catch (error) {
      console.error("Failed to fetch history", error);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        produk_id: "",
        nama: "",
        qty: 1,
        currentStock: 0,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleProductSelect = (index, product) => {
    const newItems = [...items];
    if (product) {
      newItems[index].produk_id = product.id;
      newItems[index].nama = product.namaProduk;
      newItems[index].currentStock = product.stok;
    } else {
      newItems[index].produk_id = "";
      newItems[index].nama = "";
      newItems[index].currentStock = 0;
    }
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validItems = items.filter((item) => item.produk_id && item.qty > 0);

    if (validItems.length === 0) {
      toast.showToast("Harap lengkapi data pengiriman minimal satu produk.", {
        type: "error",
      });
      return;
    }

    if (!tujuan) {
      toast.showToast("Harap isi tujuan cabang untuk pengiriman.", {
        type: "error",
      });
      return;
    }

    // Check all stocks
    for (const item of validItems) {
      if (item.qty > item.currentStock) {
        toast.showToast(`Stok ${item.nama} tidak mencukupi!`, {
          type: "error",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await axios.post("http://localhost:3000/api/inventory/transfer", {
        items: validItems.map((i) => ({
          produk_id: i.produk_id,
          qty: i.qty,
          tujuan: tujuan,
          keterangan: keterangan,
        })),
      });

      setLastShipmentData({
        items: validItems,
        tujuan: tujuan, // Taking first one for general summary
        keterangan: keterangan,
        tanggal: new Date(),
      });
      setShowSuccessModal(true);

      // Reset form
      setItems([
        {
          produk_id: "",
          nama: "",
          qty: 1,
          currentStock: 0,
        },
      ]);

      // Refresh data
      setKeterangan("");
      setTujuan("");
      fetchProducts();
      fetchHistory();
    } catch (error) {
      console.error("Transfer failed", error);
      toast.showToast(
        `❌ Gagal mengirim barang: ${
          error.response?.data?.message || error.message
        }`,
        {
          type: "error",
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    if (!storeSettings || transferHistory.length === 0) {
      toast.showToast("Tidak ada data untuk dicetak.", {
        type: "error",
      });
      return;
    }
    printShipmentReport(storeSettings, transferHistory, filterDate);
  };

  const handlePrintSingle = (data) => {
    if (!storeSettings) return;
    // Map data for printShipmentReport format
    const printData = data.items.map((item) => ({
      tanggal: data.tanggal,
      namaProduk: item.nama,
      qty: item.qty,
      tujuan: data.tujuan,
      keterangan: data.keterangan,
    }));
    printShipmentReport(storeSettings, printData, null);
    setShowSuccessModal(false);
  };

  return (
    <div className="pengiriman-container">
      <Sidebar onLogout={onLogout} user={user} storeName={storeName} />

      <div className="main-content">
        <Navbar title="Pengiriman Barang" onLogout={onLogout} user={user} />

        <div className="shipment-layout">
          <div className="pengiriman-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h2>Form Pengiriman & Permintaan Barang</h2>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddItem}
                style={{ padding: "8px 15px", fontSize: "14px" }}
              >
                + Tambah Produk
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Tujuan Cabang - Fixed */}
              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label>Tujuan Cabang / Supplier</label>
                <input
                  type="text"
                  value={tujuan}
                  onChange={(e) => setTujuan(e.target.value)}
                  placeholder="Contoh: Cabang A"
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Keterangan (opsional)</label>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Catatan untuk semua produk..."
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    boxSizing: "border-box",
                  }}
                />
                <small style={{ color: "#7f8c8d", fontSize: "12px" }}>
                  Catatan ini berlaku untuk semua produk dalam form ini
                </small>
              </div>
              {/* Items Container - Scrollable */}
              <div
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  maxHeight: "500px", // Limit tinggi
                  overflowY: "auto", // Scroll vertikal internal
                  padding: "15px",
                  marginBottom: "20px",
                  backgroundColor: "#fafafa",
                }}
              >
                {items.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      border: "1px solid #eee",
                      padding: "15px",
                      borderRadius: "8px",
                      marginBottom: index !== items.length - 1 ? "15px" : "0",
                      position: "relative",
                      backgroundColor: "#fff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <span style={{ fontSize: "13px", color: "#7f8c8d" }}>
                        Produk #{index + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          style={{
                            border: "none",
                            background: "none",
                            color: "#e74c3c",
                            fontSize: "20px",
                            cursor: "pointer",
                            padding: "0",
                            width: "24px",
                            height: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr",
                        gap: "10px",
                        marginBottom: "12px",
                      }}
                    >
                      <div className="form-group">
                        <label style={{ fontSize: "12px" }}>Pilih Produk</label>
                        <ProductAutocomplete
                          products={products}
                          value={item.produk_id}
                          onChange={(p) => handleProductSelect(index, p)}
                          placeholder="Ketik produk..."
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ fontSize: "12px" }}>Stok</label>
                        <input
                          type="text"
                          value={item.currentStock}
                          disabled
                          style={{
                            backgroundColor: "#eee",
                            padding: "8px",
                            borderRadius: "5px",
                            border: "1px solid #ddd",
                            fontSize: "13px",
                          }}
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ fontSize: "12px" }}>Kirim</label>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "qty",
                              parseInt(e.target.value, 10) || 0
                            )
                          }
                          min="1"
                          required
                          style={{
                            padding: "8px",
                            borderRadius: "5px",
                            border: "1px solid #ddd",
                            fontSize: "13px",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  isSubmitting || items.some((i) => !i.produk_id) || !tujuan
                }
                style={{
                  width: "100%",
                  height: "50px",
                  fontSize: "16px",
                  fontWeight: "600",
                }}
              >
                {isSubmitting
                  ? "Processing..."
                  : `📤 Kirim ${items.length} Produk`}
              </button>
            </form>
          </div>

          <div className="history-card">
            <div
              style={{
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                width: "600px",
              }}
            >
              <h2>Riwayat Pengiriman</h2>
              <div
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  style={{
                    padding: "8px",
                    borderRadius: "5px",
                    border: "1px solid #ddd",
                  }}
                />
                <button
                  className="btn btn-secondary"
                  onClick={handlePrint}
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  🖨 Cetak Laporan
                </button>
              </div>
            </div>

            {transferHistory.length === 0 ? (
              <div className="empty-state">Data tidak ditemukan.</div>
            ) : (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Waktu</th>
                      <th>Produk</th>
                      <th>Jumlah</th>
                      <th>Tujuan</th>
                      <th>Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transferHistory.map((item) => (
                      <tr key={item.id}>
                        <td>
                          {new Date(item.tanggal).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          {new Date(item.tanggal).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td style={{ fontWeight: 600 }}>{item.namaProduk}</td>
                        <td>{item.qty}</td>
                        <td>
                          <span
                            style={{
                              backgroundColor: "#e3f2fd",
                              color: "#1976d2",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            {item.tujuan}
                          </span>
                        </td>
                        <td>{item.keterangan || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Success Modal */}
        {showSuccessModal && lastShipmentData && (
          <div className="modal-overlay is-active">
            <div className="modal-card">
              <div className="modal-header">
                <h2>Pengiriman Berhasil!</h2>
              </div>
              <div className="modal-body">
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <img
                    src="/done2.gif"
                    alt="success"
                    style={{ width: "80px", marginBottom: "10px" }}
                  />
                  <p>
                    Barang telah disiapkan untuk dikirim ke:
                    <br />
                    <strong>{lastShipmentData.tujuan}</strong>
                  </p>
                </div>

                <div
                  className="summary"
                  style={{
                    backgroundColor: "#f9fafb",
                    padding: "15px",
                    borderRadius: "12px",
                    border: "1px solid #edf2f7",
                  }}
                >
                  <h4
                    style={{
                      marginBottom: "10px",
                      fontSize: "14px",
                      color: "#4a5568",
                    }}
                  >
                    Ringkasan:
                  </h4>
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {lastShipmentData.items.map((item, idx) => (
                      <li
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "5px",
                          paddingBottom: "5px",
                          borderBottom: "1px dashed #e2e8f0",
                        }}
                      >
                        <span>{item.nama}</span>
                        <strong>x {item.qty}</strong>
                      </li>
                    ))}
                  </ul>
                  <div
                    style={{
                      marginTop: "10px",
                      fontSize: "13px",
                      color: "#718096",
                    }}
                  >
                    <p>Keterangan: {lastShipmentData.keterangan || "-"}</p>
                  </div>
                </div>
              </div>
              <div
                className="modal-footer"
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowSuccessModal(false)}
                >
                  Selesai
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => handlePrintSingle(lastShipmentData)}
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  🖨 Selesai dan Cetak
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
