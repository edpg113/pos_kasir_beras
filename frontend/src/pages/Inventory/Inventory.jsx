import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import "./style/Inventory.scss";
import Navbar from "../../components/Navbar";
import Modal from "../../components/Modal";
import axios from "axios";

export default function Inventory({ onLogout, user }) {
  const [inventory, setInventory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State for the new "Add Stock" modal
  const [stockUpdateData, setStockUpdateData] = useState({
    inventoryId: "",
    quantity: 0,
    supplier: "",
  });
  const [selectedItemCurrentStock, setSelectedItemCurrentStock] = useState(0);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/inventory");
      setInventory(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStockUpdateData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductSelection = (e) => {
    const selectedId = e.target.value;
    const selectedItem = inventory.find(
      (item) => item.id.toString() === selectedId
    );

    setStockUpdateData((prev) => ({
      ...prev,
      inventoryId: selectedId,
      quantity: 0,
      supplier: "",
    }));

    if (selectedItem) {
      setSelectedItemCurrentStock(selectedItem.stok);
    } else {
      setSelectedItemCurrentStock(0);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      const { inventoryId, quantity, supplier } = stockUpdateData;
      await axios.patch(
        `http://localhost:3000/api/inventory/${inventoryId}/add-stock`,
        { quantity, supplier } // Send both quantity and supplier
      );
      alert("✅ Berhasil menambah stok");
      fetchInventory(); // Refresh data
      closeModal();
    } catch (error) {
      console.error("Failed to add stock", error);
      alert(
        `❌ Gagal menambah stok: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    // Reset form
    setStockUpdateData({
      inventoryId: "",
      quantity: 0,
      supplier: "",
    });
    setSelectedItemCurrentStock(0);
  };

  const getStokStatus = (stok, minStok) => {
    if (stok <= minStok)
      return <span className="badge badge-danger">Perlu Reorder</span>;
    if (stok <= minStok * 1.5)
      return <span className="badge badge-warning">Rendah</span>;
    return <span className="badge badge-success">Normal</span>;
  };

  const totalStok = inventory.reduce((sum, item) => sum + item.stok, 0);
  const needReorder = inventory.filter(
    (item) => item.stok <= item.minStok
  ).length;
  const averageStock =
    inventory.length > 0 ? Math.round(totalStok / inventory.length) : 0;

  return (
    <div className="inventory-container">
      <Sidebar onLogout={onLogout} user={user} />
      <div className="inventory-content-wrapper">
        <Navbar title="Inventory" onLogout={onLogout} user={user} />

        <div className="inventory-page-content">
          <div className="inventory-page-header">
            <h1>Manajemen Inventori</h1>
            <p>Pantau stok beras dan kelola reorder produk</p>
          </div>

          <div className="inventory-stats-grid">
            <div className="inventory-stat-card">
              <h3>Total Stok</h3>
              <div className="value">{totalStok}</div>
              <div className="unit">kg</div>
            </div>
            <div className="inventory-stat-card">
              <h3>Jumlah Produk</h3>
              <div className="value">{inventory.length}</div>
              <div className="unit">item</div>
            </div>
            <div className="inventory-stat-card">
              <h3>Perlu Reorder</h3>
              <div
                className="value"
                style={{ color: needReorder > 0 ? "#e74c3c" : "#27ae60" }}
              >
                {needReorder}
              </div>
              <div className="unit">produk</div>
            </div>
            <div className="inventory-stat-card">
              <h3>Rata-rata Stok</h3>
              <div className="value">{averageStock}</div>
              <div className="unit">kg</div>
            </div>
          </div>

          <div className="inventory-action-bar">
            <button
              className="btn btn-primary"
              style={{ width: "auto" }}
              onClick={openModal}
            >
              + Tambah Stok
            </button>
          </div>

          <div className="inventory-card">
            <h2>Detail Inventori</h2>
            <div className="inventory-table-container">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>Stok Saat Ini (kg)</th>
                    <th>Min Stok (kg)</th>
                    <th>Qty Reorder (kg)</th>
                    <th>Status</th>
                    <th>Update Terakhir</th>
                    <th>Supplier</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.produk}</strong>
                      </td>
                      <td>{item.stok}</td>
                      <td>{item.minStok}</td>
                      <td>{item.reorder}</td>
                      <td>{getStokStatus(item.stok, item.minStok)}</td>
                      <td>
                        {new Date(item.lastUpdate).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>{item.supplier}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Tambah Stok Produk"
      >
        <form onSubmit={handleAddStock} className="inventory-form">
          <div className="form-group">
            <label htmlFor="inventoryId">Nama Produk</label>
            <select
              id="inventoryId"
              name="inventoryId"
              value={stockUpdateData.inventoryId}
              onChange={handleProductSelection}
              required
            >
              <option value="" disabled>
                -- Pilih Produk --
              </option>
              {inventory.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.produk}
                </option>
              ))}
            </select>
          </div>

          {stockUpdateData.inventoryId && (
            <div className="form-group">
              <label>Stok Saat Ini</label>
              <input
                type="text"
                value={`${selectedItemCurrentStock} kg`}
                readOnly
                className="readonly-input"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="quantity">Jumlah Stok Tambahan (kg)</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={stockUpdateData.quantity}
              onChange={handleInputChange}
              required
              min="1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="supplier">Supplier (PT Pengirim)</label>
            <input
              type="text"
              id="supplier"
              name="supplier"
              value={stockUpdateData.supplier}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={closeModal}
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
}
