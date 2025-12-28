import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "./style/Retur.scss";

export default function Retur({ onLogout, user, storeName }) {
  const [returTab, setReturTab] = useState("history"); // sales, purchase, history

  // Sales Return State
  const [returTransactionId, setReturTransactionId] = useState("");
  const [returTransactionItems, setReturTransactionItems] = useState([]);
  const [selectedReturItems, setSelectedReturItems] = useState({}); // { produk_id: { ...item, returnQty: 0 } }
  const [keterangan, setKeterangan] = useState("");

  // Purchase Return State
  const [supplier, setSupplier] = useState("");
  const [returPurchaseItems, setReturPurchaseItems] = useState([
    { produk_id: "", qty: 1 },
  ]);
  const [inventory, setInventory] = useState([]); // Needed for product selection

  // History State
  const [returHistory, setReturHistory] = useState([]);
  const [historySearch, setHistorySearch] = useState("");

  useEffect(() => {
    fetchInventory();
    fetchReturHistory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/inventory");
      setInventory(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchReturHistory = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/retur");
      setReturHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // --- SALES RETURN LOGIC ---
  const handleSearchTransaction = async () => {
    if (!returTransactionId) return alert("Masukkan ID Transaksi / Kode TRX");
    try {
      const res = await axios.get(
        `http://localhost:3000/api/retur/transaksi/${returTransactionId}/items`
      );
      setReturTransactionItems(res.data);
      // Reset selected
      const initialSelected = {};
      res.data.forEach((item) => {
        initialSelected[item.produk_id] = {
          ...item,
          returnQty: 0,
          checked: false,
        };
      });
      setSelectedReturItems(initialSelected);
    } catch (error) {
      alert("Transaksi tidak ditemukan");
      setReturTransactionItems([]);
    }
  };

  const handleReturItemCheck = (produkId, checked) => {
    setSelectedReturItems((prev) => ({
      ...prev,
      [produkId]: { ...prev[produkId], checked },
    }));
  };

  const handleReturQtyChange = (produkId, qty) => {
    setSelectedReturItems((prev) => ({
      ...prev,
      [produkId]: { ...prev[produkId], returnQty: parseInt(qty) || 0 },
    }));
  };

  const submitReturSales = async () => {
    const itemsToReturn = Object.values(selectedReturItems)
      .filter((i) => i.checked && i.returnQty > 0)
      .map((i) => ({
        produk_id: i.produk_id,
        qty: i.returnQty,
        harga: i.harga,
      }));

    if (itemsToReturn.length === 0)
      return alert("Pilih item dan jumlah yang valid");

    try {
      await axios.post(
        `http://localhost:3000/api/retur/penjualan/${returTransactionId}`,
        {
          items: itemsToReturn,
          keterangan,
        }
      );
      alert("✅ Retur Penjualan Berhasil");
      // Reset Form
      setReturTransactionId("");
      setReturTransactionItems([]);
      setSelectedReturItems({});
      setKeterangan("");
      fetchReturHistory();
    } catch (error) {
      console.error(error);
      alert("Gagal memproses retur");
    }
  };

  // --- PURCHASE RETURN LOGIC ---
  const handlePurchaseItemChange = (index, field, value) => {
    const newItems = [...returPurchaseItems];
    newItems[index][field] = value;
    setReturPurchaseItems(newItems);
  };

  const addPurchaseItemRow = () => {
    setReturPurchaseItems([...returPurchaseItems, { produk_id: "", qty: 1 }]);
  };

  const removePurchaseItemRow = (index) => {
    setReturPurchaseItems(returPurchaseItems.filter((_, i) => i !== index));
  };

  const submitReturPurchase = async () => {
    if (!supplier) return alert("Isi nama supplier");
    const validItems = returPurchaseItems.filter(
      (i) => i.produk_id && i.qty > 0
    );
    if (validItems.length === 0) return alert("Isi item retur");

    // Map items to include price from inventory modal
    const itemsWithPrice = validItems.map((i) => {
      const prod = inventory.find((p) => p.id == i.produk_id);
      return { ...i, harga: prod ? prod.modal : 0 };
    });

    try {
      await axios.post("http://localhost:3000/api/retur/pembelian", {
        supplier,
        items: itemsWithPrice,
        keterangan,
      });
      alert("✅ Retur Pembelian Berhasil");
      // Reset Form
      setSupplier("");
      setReturPurchaseItems([{ produk_id: "", qty: 1 }]);
      setKeterangan("");
      fetchReturHistory();
      fetchInventory();
    } catch (error) {
      console.error(error);
      alert("Gagal memproses retur pembelian");
    }
  };

  return (
    <div className="retur-container">
      <Sidebar onLogout={onLogout} user={user} storeName={storeName} />
      <div className="retur-content-wrapper">
        <Navbar title="Retur Barang" onLogout={onLogout} user={user} />

        <div className="retur-page-content">
          <div className="retur-page-header">
            <h1>Retur Barang</h1>
            <p>Kelola pengembalian barang penjualan dan pembelian</p>
          </div>

          <div className="retur-card">
            <div className="retur-tabs">
              <button
                className={`tab-btn ${returTab === "sales" ? "active" : ""}`}
                onClick={() => setReturTab("sales")}
              >
                Retur Penjualan
              </button>
              <button
                className={`tab-btn ${returTab === "purchase" ? "active" : ""}`}
                onClick={() => setReturTab("purchase")}
              >
                Retur Pembelian
              </button>
            </div>

            <div className="retur-content">
              {/* TAB SALES */}
              {returTab === "sales" && (
                <div>
                  <div className="search-box">
                    <input
                      type="text"
                      placeholder="Masukkan ID Transaksi (Contoh: TRX-... atau 15)"
                      value={returTransactionId}
                      onChange={(e) => setReturTransactionId(e.target.value)}
                    />
                    <button onClick={handleSearchTransaction}>Cari</button>
                  </div>

                  {returTransactionItems.length > 0 && (
                    <div className="item-selection">
                      <p
                        style={{
                          marginBottom: "10px",
                          fontSize: "14px",
                          color: "#7f8c8d",
                        }}
                      >
                        Pilih produk yang ingin diretur:
                      </p>
                      {returTransactionItems.map((item) => (
                        <div key={item.produk_id} className="retur-item-row">
                          <label>
                            <input
                              type="checkbox"
                              checked={
                                selectedReturItems[item.produk_id]?.checked ||
                                false
                              }
                              onChange={(e) =>
                                handleReturItemCheck(
                                  item.produk_id,
                                  e.target.checked
                                )
                              }
                            />
                            <span>
                              {item.namaProduk} (Beli: {item.qty_beli} | Rp.
                              {item.harga})
                            </span>
                          </label>
                          {selectedReturItems[item.produk_id]?.checked && (
                            <input
                              type="number"
                              min="1"
                              max={item.qty_beli}
                              value={
                                selectedReturItems[item.produk_id]?.returnQty ||
                                0
                              }
                              onChange={(e) =>
                                handleReturQtyChange(
                                  item.produk_id,
                                  e.target.value
                                )
                              }
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="form-group">
                    <textarea
                      className="form-control"
                      placeholder="Alasan Retur (Opsional)"
                      value={keterangan}
                      onChange={(e) => setKeterangan(e.target.value)}
                      rows={3}
                    ></textarea>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <button
                      className="btn btn-primary"
                      onClick={submitReturSales}
                    >
                      Proses Retur Penjualan
                    </button>
                  </div>
                </div>
              )}

              {/* TAB PURCHASE */}
              {returTab === "purchase" && (
                <div>
                  <div className="form-group">
                    <label>Supplier</label>
                    <input
                      type="text"
                      className="form-control"
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      placeholder="Nama Supplier"
                    />
                  </div>
                  <div className="item-selection" style={{ marginTop: "15px" }}>
                    {returPurchaseItems.map((item, index) => (
                      <div key={index} className="retur-item-row">
                        <select
                          value={item.produk_id}
                          onChange={(e) =>
                            handlePurchaseItemChange(
                              index,
                              "produk_id",
                              e.target.value
                            )
                          }
                          style={{
                            flex: 2,
                            padding: "10px",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                            marginRight: "10px",
                            background: "white",
                            color: "#333",
                          }}
                        >
                          <option value="">-- Pilih Produk --</option>
                          {inventory.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.produk} (Stok: {p.stok})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.qty}
                          onChange={(e) =>
                            handlePurchaseItemChange(
                              index,
                              "qty",
                              e.target.value
                            )
                          }
                          style={{ width: "80px" }}
                        />
                        {index > 0 && (
                          <button
                            className="remove"
                            onClick={() => removePurchaseItemRow(index)}
                            style={{ marginLeft: "10px", color: "red" }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      className="btn"
                      onClick={addPurchaseItemRow}
                      style={{
                        marginTop: "10px",
                        backgroundColor: "#ecf0f1",
                        color: "#2c3e50",
                      }}
                    >
                      + Tambah Item
                    </button>
                  </div>

                  <div className="form-group">
                    <label>Keterangan</label>
                    <textarea
                      className="form-control"
                      placeholder="Alasan Retur / Keterangan"
                      value={keterangan}
                      onChange={(e) => setKeterangan(e.target.value)}
                      rows={3}
                      style={{ width: "100%" }}
                    ></textarea>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <button
                      className="btn btn-primary"
                      onClick={submitReturPurchase}
                    >
                      Proses Retur Pembelian
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <h2>Riwayat Retur</h2>
          <div
            style={{
              padding: "15px",
              borderBottom: "1px solid #ecf0f1",
            }}
          >
            <input
              type="text"
              placeholder="Cari Retur (Transaksi ID, Supplier, Produk)..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              style={{
                width: "250px",
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #ddd",
                backgroundColor: "#fff",
                color: "#333",
              }}
            />
          </div>
          <table className="retur-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Tipe</th>
                <th>Info Transaksi / Supplier</th>
                <th>Produk Diretur</th>
                <th>Total Nilai</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {returHistory.filter((r) => {
                const lowerSearch = historySearch.toLowerCase();
                const dateStr = new Date(r.tanggal)
                  .toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                  .toLowerCase();
                const prodStr = r.produk_retur
                  ? r.produk_retur.toLowerCase()
                  : "";
                const supplierStr = r.supplier ? r.supplier.toLowerCase() : "";
                const trxIdStr = r.transaksi_id
                  ? r.transaksi_id.toString()
                  : "";
                const keteranganStr = r.keterangan
                  ? r.keterangan.toLowerCase()
                  : "";

                return (
                  dateStr.includes(lowerSearch) ||
                  prodStr.includes(lowerSearch) ||
                  supplierStr.includes(lowerSearch) ||
                  trxIdStr.includes(lowerSearch) ||
                  keteranganStr.includes(lowerSearch)
                );
              }).length > 0 ? (
                returHistory
                  .filter((r) => {
                    const lowerSearch = historySearch.toLowerCase();
                    const dateStr = new Date(r.tanggal)
                      .toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                      .toLowerCase();
                    const prodStr = r.produk_retur
                      ? r.produk_retur.toLowerCase()
                      : "";
                    const supplierStr = r.supplier
                      ? r.supplier.toLowerCase()
                      : "";
                    const trxIdStr = r.transaksi_id
                      ? r.transaksi_id.toString()
                      : "";
                    const keteranganStr = r.keterangan
                      ? r.keterangan.toLowerCase()
                      : "";

                    return (
                      dateStr.includes(lowerSearch) ||
                      prodStr.includes(lowerSearch) ||
                      supplierStr.includes(lowerSearch) ||
                      trxIdStr.includes(lowerSearch) ||
                      keteranganStr.includes(lowerSearch)
                    );
                  })
                  .map((r) => (
                    <tr key={r.id}>
                      <td>
                        {new Date(r.tanggal).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            r.tipe === "penjualan"
                              ? "badge-success"
                              : "badge-warning"
                          }`}
                        >
                          {r.tipe === "penjualan" ? "Penjualan" : "Pembelian"}
                        </span>
                      </td>
                      <td>
                        {r.tipe === "penjualan" ? (
                          <span
                            style={{
                              fontWeight: "bold",
                              color: "#3498db",
                            }}
                          >
                            {r.kode_transaksi
                              ? `Ref: ${r.kode_transaksi}`
                              : r.transaksi_id
                              ? `Ref: Trx #${r.transaksi_id}`
                              : "-"}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontWeight: "bold",
                              color: "#e67e22",
                            }}
                          >
                            {r.supplier}
                          </span>
                        )}
                      </td>
                      <td style={{ maxWidth: "300px", lineHeight: "1.4" }}>
                        {r.produk_retur
                          ? r.produk_retur.split(", ").map((p, idx) => (
                              <div key={idx} style={{ marginBottom: "2px" }}>
                                • {p}
                              </div>
                            ))
                          : "-"}
                      </td>
                      <td style={{ fontWeight: "bold" }}>
                        Rp{" "}
                        {new Intl.NumberFormat("id-ID").format(r.total_nilai)}
                      </td>
                      <td>{r.keterangan || "-"}</td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      color: "#7f8c8d",
                    }}
                  >
                    {returHistory.length === 0
                      ? "Belum ada data retur."
                      : "Tidak ditemukan data pencarian."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
