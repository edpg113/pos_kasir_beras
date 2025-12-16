import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import "./style/Sales.scss";
import Navbar from "../../components/Navbar";
import axios from "axios";

const PRODUCT_LIST = [
  { id: 1, name: "Beras Pandan Wangi", price: 12000 },
  { id: 2, name: "Beras Rojo Lele", price: 10500 },
  { id: 3, name: "Beras Setra Ramos", price: 9500 },
];

export default function Sales({ onLogout, user }) {
  const [showModal, setShowModal] = useState(false);
  const [pembeli, setPembeli] = useState("");
  const [dataTransaksi, setDataTransaksi] = useState([]);
  const kasirId = user?.id;

  const [items, setItems] = useState([
    { productId: "", qty: 1, price: 0, subtotal: 0 },
  ]);
  const [bayar, setBayar] = useState(0);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    if (field === "productId") {
      const product = PRODUCT_LIST.find((p) => p.id === Number(value));
      updated[index].price = product ? product.price : 0;
    }

    updated[index].subtotal = updated[index].qty * updated[index].price;
    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { productId: "", qty: 1, price: 0, subtotal: 0 }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const total = items.reduce((sum, i) => sum + i.subtotal, 0);
  const kurang = bayar - total;

  const handleSubmitTransaksi = async () => {
    if (kurang < 0) return;

    const payload = {
      kasir_id: kasirId,
      pembeli,
      total,
      bayar,
      kembalian: kurang,
      items: items.map((item) => ({
        product_id: item.productId,
        qty: item.qty,
        harga: item.price,
        subtotal: item.subtotal,
      })),
    };

    try {
      await axios.post("http://localhost:3000/api/transaksi", payload);
      alert("✅ Transaksi berhasil disimpan");
      // reset state
      setShowModal(false);
      setItems([{ productId: "", qty: 1, price: 0, subtotal: 0 }]);
      setBayar(0);
      setPembeli("");
    } catch (error) {
      console.error("Gagal simpan transaksi:", error);
      alert("❌ Transaksi gagal disimpan");
    }
  };

  const fetchTransaksi = async () => {
    try {
      const response = await axios("http://localhost:3000/api/gettransaksi");
      setDataTransaksi(response.data);
    } catch (error) {
      console.log("Gagal mengambil data transaksi!");
    }
  };

  useEffect(() => {
    fetchTransaksi();
  }, []);

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

        <div className="sales-card">
          <h2>Riwayat Penjualan</h2>
          <div className="sales-table-container">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Tanggal & Jam</th>
                  <th>Pembeli</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {dataTransaksi.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.tanggal}</td>
                    <td>{sale.pembeli}</td>
                    <td>
                      {" "}
                      <strong>{sale.total.toLocaleString("id-ID")}</strong>{" "}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card large">
            <div className="modal-header">
              <h2>Tambah Transaksi</h2>
            </div>

            <div className="modal-body">
              {items.map((item, index) => (
                <div className="item-row" key={index}>
                  <select
                    value={item.productId}
                    onChange={(e) =>
                      handleItemChange(index, "productId", e.target.value)
                    }
                  >
                    <option value="">Pilih Produk</option>
                    {PRODUCT_LIST.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) =>
                      handleItemChange(index, "qty", Number(e.target.value))
                    }
                  />

                  <div className="price">
                    Rp {item.subtotal.toLocaleString("id-ID")}
                  </div>

                  {items.length > 1 && (
                    <button
                      className="remove"
                      onClick={() => removeItem(index)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              <button className="add-item" onClick={addItem}>
                + Tambah Produk
              </button>

              <div className="row">
                <span>Pembeli</span>
                <input
                  type="text"
                  value={pembeli}
                  onChange={(e) => setPembeli(e.target.value)}
                  placeholder="Nama pembeli"
                />
              </div>

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
                <div className={`row ${kurang < 0 ? "minus" : "plus"}`}>
                  <span>{kurang < 0 ? "Kurang" : "Kembalian"}</span>
                  <strong>
                    {kurang < 0 ? "-" : ""}Rp{" "}
                    {Math.abs(kurang).toLocaleString("id-ID")}
                  </strong>
                </div>
                {kurang < 0 && (
                  <div className="warning">⚠ Uang pembayaran kurang</div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Batal
              </button>
              <button
                className="btn btn-primary"
                disabled={kurang < 0}
                onClick={handleSubmitTransaksi}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
