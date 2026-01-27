import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import ProductAutocomplete from "../../components/ProductAutocomplete";
import axios from "axios";
import { printPOReport } from "../../utils/printPO";
import "./style/pobarang.scss";
import { useToast } from "../../components/Toast/Toast";
import DoneGif from "../../assets/done2.gif";

export default function POBarang({ onLogout, user, storeName }) {
  const [products, setProducts] = useState([]);
  const [poHistory, setPOHistory] = useState([]);
  const [storeSettings, setStoreSettings] = useState(null);

  // Form State
  const [items, setItems] = useState([
    {
      produk_id: "",
      nama: "",
      qty: 1,
      tujuan: "",
      keterangan: "",
      harga_per_kg: 0,
      harga_beli: 0,
      stok: 0,
      total: 0,
      biaya_kuli: 0,
      biaya_sopir: 0,
      dp: 0,
      total_harga_produk: 0,
      subtotal: 0,
      kategori: "",
    },
  ]);
  const [tujuan, setTujuan] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastPOData, setLastPOData] = useState(null);
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
        ? `http://localhost:3000/api/pobarang/history?date=${filterDate}`
        : "http://localhost:3000/api/pobarang";
      const response = await axios.get(url);
      setPOHistory(response.data);
    } catch (error) {
      console.error("Failed to fetch history", error);
    }
  };

  // Fetch history with specific date
  const fetchHistoryWithDate = async (date) => {
    try {
      const url = `http://localhost:3000/api/pobarang/history?date=${date}`;
      const response = await axios.get(url);
      setPOHistory(response.data);
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
        tujuan: "",
        keterangan: "",
        harga_per_kg: 0,
        harga_beli: 0,
        stok: 0,
        total: 0,
        biaya_kuli: 0,
        biaya_sopir: 0,
        dp: 0,
        total_harga_produk: 0,
        subtotal: 0,
        kategori: "",
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
      newItems[index].kategori = product.kategori || "";
      newItems[index].harga_per_kg = product.harga_per_kg || 0;
      newItems[index].harga_beli = product.modal || 0;
      newItems[index].stok = product.stok || 0;
      newItems[index].total_harga_produk = product.modal || 0;
      newItems[index].subtotal = (product.modal || 0) * newItems[index].qty;
      newItems[index].total = newItems[index].subtotal;
    } else {
      newItems[index].produk_id = "";
      newItems[index].nama = "";
      newItems[index].kategori = "";
      newItems[index].harga_per_kg = 0;
      newItems[index].harga_beli = 0;
      newItems[index].stok = 0;
      newItems[index].total_harga_produk = 0;
      newItems[index].subtotal = 0;
      newItems[index].total = 0;
    }
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validItems = items.filter((item) => item.produk_id && item.qty > 0);

    if (validItems.length === 0) {
      toast.showToast("Harap lengkapi data PO minimal satu produk.", {
        type: "error",
      });
      return;
    }

    if (!tujuan) {
      toast.showToast("Harap isi tujuan/supplier untuk PO.", {
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post("http://localhost:3000/api/pobarang", {
        items: validItems.map((i) => ({
          produk_id: i.produk_id,
          qty: i.qty,
          tujuan: tujuan,
          keterangan: keterangan,
          biaya_kuli: i.biaya_kuli,
          biaya_sopir: i.biaya_sopir,
          dp: i.dp,
          total_harga_produk: i.total_harga_produk,
          harga_per_kg: i.harga_per_kg,
          subtotal: i.subtotal,
        })),
      });

      setLastPOData({
        items: validItems,
        tujuan: tujuan,
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
          tujuan: "",
          keterangan: "",
          biaya_kuli: 0,
          biaya_sopir: 0,
          dp: 0,
          total_harga_produk: 0,
          subtotal: 0,
          kategori: "",
        },
      ]);

      // Refresh data
      setKeterangan("");
      setTujuan("");
      fetchProducts();
      fetchHistory();
    } catch (error) {
      console.error("PO failed", error);
      toast.showToast(
        `❌ Gagal membuat PO: ${
          error.response?.data?.message || error.message
        }`,
        {
          type: "error",
        },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    if (!storeSettings || poHistory.length === 0) {
      toast.showToast("Tidak ada data untuk dicetak.", {
        type: "error",
      });
      return;
    }
    printPOReport(storeSettings, poHistory, filterDate);
  };

  const handlePrintSingle = (data) => {
    if (!storeSettings) return;
    // Map data for printPOReport format
    const printData = data.items.map((item) => ({
      tanggal: data.tanggal,
      namaProduk: item.nama,
      qty: item.qty,
      harga_per_kg: item.harga_per_kg,
      modal: item.harga_beli,
      total_harga_produk: item.total_harga_produk,
      subtotal: item.subtotal,
      biaya_kuli: item.biaya_kuli,
      biaya_sopir: item.biaya_sopir,
      dp: item.dp,
      total: item.total,
      tujuan: data.tujuan,
      keterangan: data.keterangan,
    }));
    printPOReport(storeSettings, printData, null);
    setShowSuccessModal(false);
  };

  return (
    <div className="pobarang-container">
      <Sidebar onLogout={onLogout} user={user} storeName={storeName} />

      <div className="main-content">
        <Navbar title="Purchase Order Barang" onLogout={onLogout} user={user} />

        <div className="shipment-layout">
          <div className="pobarang-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h2>Form PO Barang</h2>
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
              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label>Supplier / Tujuan</label>
                <input
                  type="text"
                  value={tujuan}
                  onChange={(e) => setTujuan(e.target.value)}
                  placeholder="Nama supplier/cabang"
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

              <div
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  maxHeight: "600px",
                  overflowY: "auto",
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
                        gridTemplateColumns: "1fr 1fr 1fr",
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
                        <label style={{ fontSize: "12px" }}>
                          Harga/1kg (Rp)
                        </label>
                        <input
                          type="text"
                          value={
                            item.harga_per_kg
                              ? Number(item.harga_per_kg).toLocaleString(
                                  "id-ID",
                                )
                              : "-"
                          }
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
                        <label style={{ fontSize: "12px" }}>
                          Total Harga Produk (Rp)
                        </label>
                        <input
                          type="number"
                          value={item.total_harga_produk}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const newItems = [...items];

                            // Kalkulasi harga_per_kg otomatis
                            const weightStr = item.kategori || "";
                            const match = weightStr.match(/(\d+(?:\.\d+)?)/);
                            const weight = match ? parseFloat(match[0]) : 1;
                            const calculatedHPK = val / weight;

                            newItems[index].total_harga_produk = val;
                            newItems[index].harga_per_kg = calculatedHPK;
                            newItems[index].subtotal = val * item.qty;
                            newItems[index].total =
                              val * item.qty -
                              (item.biaya_kuli || 0) -
                              (item.biaya_sopir || 0) -
                              (item.dp || 0);
                            setItems(newItems);
                          }}
                          style={{
                            padding: "8px",
                            borderRadius: "5px",
                            border: "1px solid #ddd",
                            fontSize: "13px",
                          }}
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ fontSize: "12px" }}>Stok</label>
                        <input
                          type="text"
                          value={item.stok}
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
                        <label>Jumlah</label>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value, 10) || 0;
                            handleItemChange(index, "qty", qty);
                            const sub = qty * item.total_harga_produk;
                            handleItemChange(index, "subtotal", sub);
                            handleItemChange(
                              index,
                              "total",
                              sub -
                                (item.biaya_kuli || 0) -
                                (item.biaya_sopir || 0) -
                                (item.dp || 0),
                            );
                          }}
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
                      <div className="form-group">
                        <label style={{ fontSize: "12px" }}>
                          Subtotal (Gross) (Rp)
                        </label>
                        <input
                          type="text"
                          value={
                            item.subtotal
                              ? Number(item.subtotal).toLocaleString("id-ID")
                              : "0"
                          }
                          disabled
                          style={{
                            backgroundColor: "#eee",
                            padding: "8px",
                            borderRadius: "5px",
                            border: "1px solid #ddd",
                            fontSize: "13px",
                            fontWeight: "500",
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: "12px" }}>Total (Rp)</label>
                        <input
                          type="text"
                          value={
                            item.total
                              ? Number(item.total).toLocaleString("id-ID")
                              : "-"
                          }
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
                        <label style={{ fontSize: "12px" }}>
                          Biaya Kuli (Rp)
                        </label>
                        <input
                          type="number"
                          value={item.biaya_kuli}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const newItems = [...items];
                            newItems[index].biaya_kuli = val;
                            newItems[index].total =
                              item.total_harga_produk * item.qty -
                              val -
                              (item.biaya_sopir || 0) -
                              (item.dp || 0);
                            setItems(newItems);
                          }}
                          style={{
                            padding: "8px",
                            borderRadius: "5px",
                            border: "1px solid #ddd",
                            fontSize: "13px",
                          }}
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ fontSize: "12px" }}>
                          Biaya Sopir (Rp)
                        </label>
                        <input
                          type="number"
                          value={item.biaya_sopir}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const newItems = [...items];
                            newItems[index].biaya_sopir = val;
                            newItems[index].total =
                              item.total_harga_produk * item.qty -
                              (item.biaya_kuli || 0) -
                              val -
                              (item.dp || 0);
                            setItems(newItems);
                          }}
                          style={{
                            padding: "8px",
                            borderRadius: "5px",
                            border: "1px solid #ddd",
                            fontSize: "13px",
                          }}
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ fontSize: "12px" }}>DP (Rp)</label>
                        <input
                          type="number"
                          value={item.dp}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const newItems = [...items];
                            newItems[index].dp = val;
                            newItems[index].total =
                              item.total_harga_produk * item.qty -
                              (item.biaya_kuli || 0) -
                              (item.biaya_sopir || 0) -
                              val;
                            setItems(newItems);
                          }}
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
                  : `📤 Buat PO ${items.length} Produk`}
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
              <h2>Riwayat PO</h2>
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

            {poHistory.length === 0 ? (
              <div className="empty-state">Data tidak ditemukan.</div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Waktu</th>
                      <th>Produk</th>
                      <th>Jumlah</th>
                      <th>Harga/1kg</th>
                      <th>Harga/Krg</th>
                      <th>Harga Modal</th>
                      <th>Subtotal</th>
                      <th>Stok Awal</th>
                      <th>Total</th>
                      <th>Supplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poHistory.map((item) => (
                      <tr key={item.id}>
                        <td>
                          {new Date(item.tanggal).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td style={{ fontWeight: 600 }}>{item.namaProduk}</td>
                        <td>{item.qty}</td>
                        <td>
                          {item.harga_per_kg
                            ? Number(item.harga_per_kg).toLocaleString("id-ID")
                            : "-"}
                        </td>
                        <td>
                          {item.total_harga_produk
                            ? Number(item.total_harga_produk).toLocaleString(
                                "id-ID",
                              )
                            : "-"}
                        </td>
                        <td>
                          {item.harga_beli
                            ? Number(item.harga_beli).toLocaleString("id-ID")
                            : "-"}
                        </td>
                        <td>
                          {item.subtotal
                            ? Number(item.subtotal).toLocaleString("id-ID")
                            : item.total_harga_produk && item.qty
                              ? Number(
                                  item.total_harga_produk * item.qty,
                                ).toLocaleString("id-ID")
                              : "-"}
                        </td>
                        <td>{item.stok_awal}</td>
                        <td>
                          {item.total
                            ? Number(item.total).toLocaleString("id-ID")
                            : "-"}
                        </td>
                        <td>
                          <span
                            style={{
                              backgroundColor: "#e8f5e9",
                              color: "#2e7d32",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            {item.tujuan}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Success Modal */}
        {showSuccessModal && lastPOData && (
          <div className="modal-overlay is-active">
            <div className="modal-card">
              <div className="modal-header">
                <h2>PO Berhasil Dibuat!</h2>
              </div>
              <div className="modal-body">
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <img
                    src={DoneGif}
                    alt="success"
                    style={{ width: "80px", marginBottom: "10px" }}
                  />
                  <p>
                    PO telah dikirim ke:
                    <br />
                    <strong>{lastPOData.tujuan}</strong>
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
                    {lastPOData.items.map((item, idx) => (
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
                    <p>Keterangan: {lastPOData.keterangan || "-"}</p>
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
                  onClick={() => handlePrintSingle(lastPOData)}
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
