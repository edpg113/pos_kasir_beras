import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import "./style/Sales.scss";
import axios from "axios";

export default function Sales({ onLogout, user }) {
  const [showModal, setShowModal] = useState(false);
  const [produk, setProduk] = useState([]);
  const [transaksi, setTransaksi] = useState([]);

  const [items, setItems] = useState([
    { produk_id: "", nama: "", harga: 0, qty: 1, subtotal: 0 },
  ]);

  const [pembeli, setPembeli] = useState("");
  const [bayar, setBayar] = useState(0);

  useEffect(() => {
    getProduct();
    getTransaksi();
  }, []);

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
    };

    try {
      await axios.post("http://localhost:3000/api/transaksi", {
        pembeli,
        total,
        bayar,
        kembalian: selisih,
        items: validItems,
      });

      alert("✅ Transaksi berhasil disimpan");

      setShowModal(false);
      setItems([{ produk_id: "", nama: "", harga: 0, qty: 1, subtotal: 0 }]);
      setPembeli("");
      setBayar(0);
      getTransaksi();
    } catch (err) {
      alert("❌ Gagal menyimpan transaksi");
      console.error(err);
    }
  };

  // =============================
  // FETCH TRANSAKSI
  // =============================
  const getTransaksi = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/gettransaksi"
      );
      setTransaksi(response.data);
    } catch (error) {
      console.log(err);
    }
  };

  return (
    <div className="sales-container">
      <Sidebar onLogout={onLogout} user={user} />

      <div className="sales-content-wrapper">
        <Navbar title="Penjualan" onLogout={onLogout} user={user} />

        <div className="sales-action-bar">
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
      </div>
    </div>
  );
}
