import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "./style/Retur.scss";
import { useToast } from "../../components/Toast/Toast";

export default function Retur({ onLogout, user, storeName }) {
  const [returTab, setReturTab] = useState("history"); // sales, purchase, history

  // Sales Return State
  const [returTransactionId, setReturTransactionId] = useState("");
  const [returTransactionItems, setReturTransactionItems] = useState([]);
  const [selectedReturItems, setSelectedReturItems] = useState({}); // { produk_id: { ...item, returnQty: 0 } }
  const [keterangan, setKeterangan] = useState("");
  const toast = useToast();

  // Purchase Return State
  const [supplier, setSupplier] = useState("");
  const [returPurchaseItems, setReturPurchaseItems] = useState([
    { produk_id: "", qty: 1 },
  ]);
  const [inventory, setInventory] = useState([]); // Needed for product selection

  // History State
  const [returHistory, setReturHistory] = useState([]);
  const [historySearch, setHistorySearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);
    setEndDate(today);
    fetchInventory();
    // fetchReturHistory will be triggered by startDate/endDate effect
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
      const res = await axios.get("http://localhost:3000/api/retur", {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });
      setReturHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReturHistory();
  }, [startDate, endDate]);

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openPrintWindow = (html, title = "Cetak Retur") => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Inter, Arial, sans-serif; color: #333; padding: 20px }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px 10px; border: 1px solid #ddd; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>
          ${html}
          <script>window.onload = function(){ setTimeout(()=>window.print(),300); }</script>
        </body>
      </html>
    `);
    w.document.close();
  };

  const buildHistoryHtml = (rows) => {
    const from = startDate || "-";
    const to = endDate || "-";
    let html = `<h2>Riwayat Retur (${from} - ${to})</h2>`;
    html += `<table><thead><tr><th>Tanggal</th><th>Tipe</th><th>Info</th><th>Produk</th><th>Total</th><th>Keterangan</th></tr></thead><tbody>`;
    rows.forEach((r) => {
      html += `<tr>
        <td>${formatDateTime(r.tanggal)}</td>
        <td>${r.tipe}</td>
        <td>${r.tipe === 'penjualan' ? (r.kode_transaksi || r.transaksi_id || '-') : (r.supplier || '-')}</td>
        <td>${r.produk_retur || '-'}</td>
        <td>Rp ${new Intl.NumberFormat('id-ID').format(r.total_nilai)}</td>
        <td>${r.keterangan || '-'}</td>
      </tr>`;
    });
    html += `</tbody></table>`;
    return html;
  };

  const handlePrintHistory = () => {
    // apply same client-side search filter as render
    const lowerSearch = historySearch.toLowerCase();
    const filtered = returHistory.filter((r) => {
      const dateStr = new Date(r.tanggal)
        .toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
        .toLowerCase();
      const prodStr = r.produk_retur ? r.produk_retur.toLowerCase() : "";
      const supplierStr = r.supplier ? r.supplier.toLowerCase() : "";
      const trxIdStr = r.transaksi_id ? r.transaksi_id.toString() : "";
      const keteranganStr = r.keterangan ? r.keterangan.toLowerCase() : "";
      return (
        dateStr.includes(lowerSearch) ||
        prodStr.includes(lowerSearch) ||
        supplierStr.includes(lowerSearch) ||
        trxIdStr.includes(lowerSearch) ||
        keteranganStr.includes(lowerSearch)
      );
    });
    const html = buildHistoryHtml(filtered);
    openPrintWindow(html, "Cetak Riwayat Retur");
  };

  // --- SALES RETURN LOGIC ---
  const handleSearchTransaction = async () => {
    if (!returTransactionId)
      return toast.showToast("Masukkan ID Transaksi / Kode TRX", {
        type: "error",
      });
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
      toast.showToast("Transaksi tidak ditemukan", {
        type: "error",
      });
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

  // Open confirm modal for sales retur
  const submitReturSales = () => {
    console.log("submitReturSales called");
    const itemsToReturn = Object.values(selectedReturItems)
      .filter((i) => i.checked && i.returnQty > 0)
      .map((i) => {
        const prodName = i.namaProduk || returTransactionItems.find(item => item.produk_id === i.produk_id)?.namaProduk || `Produk ${i.produk_id}`;
        return {
          produk_id: i.produk_id,
          namaProduk: prodName,
          qty: i.returnQty,
          harga: i.harga,
        };
      });

    if (itemsToReturn.length === 0)
      return toast.showToast("Pilih item dan jumlah yang valid", {
        type: "error",
      });

    const total = itemsToReturn.reduce((s, it) => s + it.qty * it.harga, 0);
    console.log("Confirm data:", {
      tipe: "penjualan",
      ref: returTransactionId,
      items: itemsToReturn,
      total,
      keterangan,
    });
    setConfirmData({
      tipe: "penjualan",
      ref: returTransactionId,
      items: itemsToReturn,
      total,
      keterangan,
    });
    setShowConfirmModal(true);
    console.log("showConfirmModal set to true");
  };

  const saveAndPrintSales = async () => {
    if (!confirmData) return;
    try {
      await axios.post(
        `http://localhost:3000/api/retur/penjualan/${confirmData.ref}`,
        {
          items: confirmData.items.map((it) => ({ produk_id: it.produk_id, qty: it.qty, harga: it.harga })),
          keterangan: confirmData.keterangan,
        }
      );
      toast.showToast("✅ Retur Penjualan Berhasil", { type: "success" });
      setSummaryData(confirmData);
      // print summary
      const html = buildSummaryHtml(confirmData);
      openPrintWindow(html, "Cetak Retur Penjualan");
      setShowConfirmModal(false);
      // Reset form
      setReturTransactionId("");
      setReturTransactionItems([]);
      setSelectedReturItems({});
      setKeterangan("");
      // Refresh data after brief delay
      setTimeout(() => fetchReturHistory(), 500);
    } catch (error) {
      console.error(error);
      toast.showToast("Gagal memproses retur", { type: "error" });
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

  const submitReturPurchase = () => {
    console.log("submitReturPurchase called");
    if (!supplier)
      return toast.showToast("Isi nama supplier", {
        type: "error",
      });
    const validItems = returPurchaseItems.filter((i) => i.produk_id && i.qty > 0);
    if (validItems.length === 0)
      return toast.showToast("Isi item retur", {
        type: "error",
      });

    const itemsWithPrice = validItems.map((i) => {
      const prod = inventory.find((p) => p.id == i.produk_id);
      return { 
        produk_id: i.produk_id,
        namaProduk: prod?.produk || `Produk ${i.produk_id}`,
        qty: parseInt(i.qty) || 1,
        harga: prod ? prod.modal : 0 
      };
    });

    const total = itemsWithPrice.reduce((s, it) => s + it.qty * it.harga, 0);
    console.log("Confirm data:", {
      tipe: "pembelian",
      supplier,
      items: itemsWithPrice,
      total,
      keterangan,
    });
    setConfirmData({
      tipe: "pembelian",
      supplier,
      items: itemsWithPrice,
      total,
      keterangan,
    });
    setShowConfirmModal(true);
    console.log("showConfirmModal set to true");
  };

  const saveAndPrintPurchase = async () => {
    if (!confirmData) return;
    try {
      await axios.post("http://localhost:3000/api/retur/pembelian", {
        supplier: confirmData.supplier,
        items: confirmData.items.map((it) => ({ produk_id: it.produk_id, qty: it.qty, harga: it.harga })),
        keterangan: confirmData.keterangan,
      });
      toast.showToast("✅ Retur Pembelian Berhasil", { type: "success" });
      setSummaryData(confirmData);
      const html = buildSummaryHtml(confirmData);
      openPrintWindow(html, "Cetak Retur Pembelian");
      setShowConfirmModal(false);
      // reset form
      setSupplier("");
      setReturPurchaseItems([{ produk_id: "", qty: 1 }]);
      setKeterangan("");
      setTimeout(() => { fetchReturHistory(); fetchInventory(); }, 500);
    } catch (error) {
      console.error(error);
      toast.showToast("Gagal memproses retur pembelian", { type: "error" });
    }
  };

  const buildSummaryHtml = (summary) => {
    if (!summary) return "";
    const header = summary.tipe === "penjualan" ? `Retur Penjualan (${summary.ref})` : `Retur Pembelian (Supplier: ${summary.supplier || '-'} )`;
    let html = `<h2>${header}</h2>`;
    html += `<p>Keterangan: ${summary.keterangan || '-'}</p>`;
    html += `<table><thead><tr><th>Produk</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr></thead><tbody>`;
    summary.items.forEach((it) => {
      const subtotal = it.qty * it.harga;
      const produkName = it.namaProduk || it.produk_id;
      html += `<tr><td>${produkName}</td><td>${it.qty}</td><td>Rp ${new Intl.NumberFormat('id-ID').format(it.harga)}</td><td>Rp ${new Intl.NumberFormat('id-ID').format(subtotal)}</td></tr>`;
    });
    html += `</tbody></table>`;
    html += `<h3>Total: Rp ${new Intl.NumberFormat('id-ID').format(summary.total)}</h3>`;
    return html;
  };

  const handlePrintSummary = () => {
    const html = buildSummaryHtml(summaryData);
    openPrintWindow(html, "Cetak Ringkasan Retur");
  };

  const handleCloseSummary = () => {
    setShowSummaryModal(false);
    setSummaryData(null);
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
                      style={{ backgroundColor: "#fff", color: "#333" }}
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
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <h2 style={{margin:0}}>Riwayat Retur</h2>
            <button className="btn" onClick={handlePrintHistory} style={{padding:'8px 12px',background:'#3498db',color:'#fff',border:'none',borderRadius:4}}>Cetak</button>
          </div>
          <div
            style={{
              padding: "15px",
              borderBottom: "1px solid #ecf0f1",
            }}
          >
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
              <div
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                <span style={{ fontSize: "14px", color: "#666" }}>Dari:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    padding: "8px",
                    borderRadius: "5px",
                    border: "1px solid #ddd",
                    backgroundColor: "#fff",
                    color: "#333",
                  }}
                />
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                <span style={{ fontSize: "14px", color: "#666" }}>Sampai:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    padding: "8px",
                    borderRadius: "5px",
                    border: "1px solid #ddd",
                    backgroundColor: "#fff",
                    color: "#333",
                  }}
                />
              </div>
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  style={{
                    padding: "8px 15px",
                    borderRadius: "5px",
                    border: "none",
                    backgroundColor: "#e74c3c",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Reset Filter
                </button>
              )}
            </div>
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
          {/* Confirm Modal */}
          {showConfirmModal && confirmData && (
            <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:99999}}>
              <div style={{background:'#ffffff',padding:'24px',borderRadius:'8px',width:'90%',maxWidth:600,boxShadow:'0 4px 12px rgba(0,0,0,0.3)',zIndex:100000}}>
                <h3 style={{margin:'0 0 16px 0',color:'#2c3e50'}}>Konfirmasi Retur</h3>
                <p style={{margin:'8px 0',fontSize:'14px'}}><span style={{fontWeight:'600'}}>Tipe:</span> {confirmData.tipe === 'penjualan' ? 'Penjualan' : 'Pembelian'}</p>
                {confirmData.ref && <p style={{margin:'8px 0',fontSize:'14px'}}><span style={{fontWeight:'600'}}>Ref:</span> {confirmData.ref}</p>}
                {confirmData.supplier && <p style={{margin:'8px 0',fontSize:'14px'}}><span style={{fontWeight:'600'}}>Supplier:</span> {confirmData.supplier}</p>}
                <div style={{marginTop:12,maxHeight:220,overflow:'auto',border:'1px solid #ecf0f1',borderRadius:'4px'}}>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead>
                      <tr style={{background:'#f8f9fa'}}>
                        <th style={{textAlign:'left',padding:'10px',borderBottom:'1px solid #dee2e6',fontWeight:'600',fontSize:'13px'}}>Produk</th>
                        <th style={{textAlign:'center',padding:'10px',borderBottom:'1px solid #dee2e6',fontWeight:'600',fontSize:'13px'}}>Qty</th>
                        <th style={{textAlign:'right',padding:'10px',borderBottom:'1px solid #dee2e6',fontWeight:'600',fontSize:'13px'}}>Harga</th>
                        <th style={{textAlign:'right',padding:'10px',borderBottom:'1px solid #dee2e6',fontWeight:'600',fontSize:'13px'}}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {confirmData.items.map((it, idx) => (
                        <tr key={idx} style={{borderBottom:'1px solid #ecf0f1'}}>
                          <td style={{padding:'10px',fontSize:'13px'}}>{it.namaProduk || it.produk_id}</td>
                          <td style={{textAlign:'center',padding:'10px',fontSize:'13px'}}>{it.qty}</td>
                          <td style={{textAlign:'right',padding:'10px',fontSize:'13px'}}>Rp {new Intl.NumberFormat('id-ID').format(it.harga)}</td>
                          <td style={{textAlign:'right',padding:'10px',fontSize:'13px'}}>Rp {new Intl.NumberFormat('id-ID').format(it.qty * it.harga)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {confirmData.keterangan && <p style={{marginTop:12,fontSize:'13px',color:'#666'}}><span style={{fontWeight:'600'}}>Keterangan:</span> {confirmData.keterangan}</p>}
                <div style={{marginTop:12,textAlign:'right',paddingTop:'12px',borderTop:'1px solid #ecf0f1'}}>
                  <h4 style={{margin:'0 0 12px 0',fontSize:'16px',color:'#2c3e50'}}>Total: Rp {new Intl.NumberFormat('id-ID').format(confirmData.total)}</h4>
                </div>
                <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:16}}>
                  <button onClick={() => { console.log("Simpan dan Cetak clicked"); if (confirmData.tipe === 'penjualan') { saveAndPrintSales(); } else { saveAndPrintPurchase(); } }} style={{background:'#27ae60',color:'#fff',padding:'10px 16px',border:'none',borderRadius:'4px',cursor:'pointer',fontWeight:'600',fontSize:'14px'}}>Simpan dan Cetak</button>
                  <button onClick={() => { console.log("Batal clicked"); setShowConfirmModal(false); setConfirmData(null); }} style={{background:'#bdc3c7',color:'#2c3e50',padding:'10px 16px',border:'none',borderRadius:'4px',cursor:'pointer',fontWeight:'600',fontSize:'14px'}}>Batal</button>
                </div>
              </div>
            </div>
          )}

          {/* Summary Modal */}
          {showSummaryModal && summaryData && (
            <div className="modal-overlay" style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}>
              <div className="modal" style={{background:'#fff',padding:20,borderRadius:6,width:'90%',maxWidth:600}}>
                <h3>Ringkasan Retur</h3>
                <p style={{margin:0}}>Tipe: <strong>{summaryData.tipe === 'penjualan' ? 'Penjualan' : 'Pembelian'}</strong></p>
                {summaryData.ref && <p style={{margin:0}}>Ref: <strong>{summaryData.ref}</strong></p>}
                {summaryData.supplier && <p style={{margin:0}}>Supplier: <strong>{summaryData.supplier}</strong></p>}
                <div style={{marginTop:10,maxHeight:220,overflow:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead>
                      <tr><th style={{textAlign:'left'}}>Produk ID</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr>
                    </thead>
                    <tbody>
                      {summaryData.items.map((it, idx) => (
                        <tr key={idx}>
                          <td style={{padding:'6px 8px'}}>{it.produk_id}</td>
                          <td style={{textAlign:'center'}}>{it.qty}</td>
                          <td style={{textAlign:'right'}}>Rp {new Intl.NumberFormat('id-ID').format(it.harga)}</td>
                          <td style={{textAlign:'right'}}>Rp {new Intl.NumberFormat('id-ID').format(it.qty * it.harga)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{marginTop:10,textAlign:'right'}}>
                  <h4 style={{margin:'6px 0'}}>Total: Rp {new Intl.NumberFormat('id-ID').format(summaryData.total)}</h4>
                </div>
                <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:12}}>
                  <button className="btn" onClick={() => { handlePrintSummary(); handleCloseSummary(); }} style={{background:'#2ecc71',color:'#fff',padding:'8px 12px',border:'none',borderRadius:4}}>Selesai dan Cetak</button>
                  <button className="btn" onClick={handleCloseSummary} style={{background:'#bdc3c7',padding:'8px 12px',border:'none',borderRadius:4}}>Tutup</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
