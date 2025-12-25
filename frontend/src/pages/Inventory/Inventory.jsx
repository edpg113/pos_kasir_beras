import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import "./style/Inventory.scss";
import Navbar from "../../components/Navbar";
import axios from "axios";

export default function Inventory({ onLogout, user, storeName }) {
  const [inventory, setInventory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
  const [supplier, setSupplier] = useState("");
  const [editStok, setEditStok] = useState("");

  // State for multi-item stock update
  const initialItem = {
    inventoryId: "",
    produk: "",
    stok: 0,
    quantity: 1,
  };
  const [itemsToAdd, setItemsToAdd] = useState([initialItem]);

  const fetchInventory = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/inventory");
      setInventory(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // ====== MODAL HANDLERS START ======
  const handleItemChange = (index, field, value) => {
    const newItems = [...itemsToAdd];
    const item = newItems[index];
    item[field] = value;

    // If product is changed, update its details
    if (field === "inventoryId") {
      const selectedProduct = inventory.find((p) => p.id.toString() === value);
      if (selectedProduct) {
        item.produk = selectedProduct.produk;
        item.stok = selectedProduct.stok;
      }
    }

    setItemsToAdd(newItems);
  };

  const addItem = () => {
    setItemsToAdd([...itemsToAdd, { ...initialItem }]);
  };

  const removeItem = (index) => {
    if (itemsToAdd.length > 1) {
      const newItems = itemsToAdd.filter((_, i) => i !== index);
      setItemsToAdd(newItems);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setIsEditMode(true);
      setEditData(item);
      setSupplier(item.supplier || "");
      setEditStok(item.stok); // Pre-fill with current stock
    } else {
      setIsEditMode(false);
      setEditData(null);
      setItemsToAdd([{ ...initialItem }]);
      setSupplier("");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditData(null);
    setItemsToAdd([{ ...initialItem }]); // Reset to a single empty item
    setSupplier(""); // Reset supplier
    setEditStok("");
  };

  const handleAddStock = async (e) => {
    e.preventDefault();

    if (!supplier) {
      alert("❌ Harap isi nama supplier.");
      return;
    }

    // Logic for Edit Mode
    if (isEditMode) {
      try {
        await axios.put(`http://localhost:3000/api/inventory/${editData.id}`, {
          stok: editStok,
          supplier: supplier,
        });
        alert("✅ Inventori berhasil diupdate");
        fetchInventory();
        closeModal();
      } catch (error) {
        console.error("Failed to update inventory", error);
        alert(
          `❌ Gagal update inventori: ${
            error.response?.data?.message || error.message
          }`
        );
      }
      return;
    }

    // Logic for Add Mode (Multiple Items)
    const validItems = itemsToAdd.filter(
      (item) => item.inventoryId && parseInt(item.quantity, 10) > 0
    );

    if (validItems.length === 0) {
      alert("❌ Harap isi data produk dan jumlah dengan benar.");
      return;
    }

    const itemsWithSupplier = validItems.map((item) => ({
      ...item,
      supplier,
    }));

    try {
      await axios.post(`http://localhost:3000/api/inventory/add-stocks`, {
        items: itemsWithSupplier,
      });
      alert("✅ Berhasil menambah semua stok");
      fetchInventory(); // Refresh data
      closeModal();
    } catch (error) {
      console.error("Failed to add stocks", error);
      alert(
        `❌ Gagal menambah stok: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };
  // ====== MODAL HANDLERS END ======

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
      <Sidebar onLogout={onLogout} user={user} storeName={storeName} />
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
              onClick={() => openModal(null)}
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
                    <th>Supplier</th>
                    <th>Update Terakhir</th>
                    <th>Aksi</th>
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
                      <td>{item.supplier}</td>
                      <td>
                        {new Date(item.lastUpdate).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>
                        <button
                          className="btn-edit"
                          onClick={() => openModal(item)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card large">
            <div className="modal-header">
              <h2>{isEditMode ? "Edit Stok Produk" : "Tambah Stok Produk"}</h2>
            </div>
            <div className="modal-body">
              {isEditMode ? (
                /* Edit Mode UI */
                <div className="edit-mode-form">
                  <div className="form-group">
                    <label>Nama Produk (Read-Only)</label>
                    <input
                      type="text"
                      value={editData?.produk || ""}
                      disabled
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Stok Awal (Read-Only)</label>
                    <input
                      type="text"
                      value={editData?.stok || 0}
                      disabled
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Stok Baru (Ubah disini)</label>
                    <input
                      type="number"
                      value={editStok}
                      onChange={(e) => setEditStok(e.target.value)}
                      min="0"
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Nama Supplier</label>
                    <input
                      type="text"
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      className="form-control"
                    />
                  </div>
                </div>
              ) : (
                /* Add Mode UI */
                <>
                  {itemsToAdd.map((item, index) => (
                    <div key={index} className="modal-body item-row">
                      <select
                        name="inventoryId"
                        value={item.inventoryId}
                        onChange={(e) =>
                          handleItemChange(index, "inventoryId", e.target.value)
                        }
                        required
                      >
                        <option value="" disabled>
                          -- Pilih Produk --
                        </option>
                        {inventory.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.produk} (Stok: {p.stok})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        name="quantity"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, "quantity", e.target.value)
                        }
                        required
                        min="1"
                        style={{ width: "80px" }}
                      />
                      {itemsToAdd.length > 1 && (
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

                  <div className="supplier-row" style={{ marginTop: "15px" }}>
                    <input
                      type="text"
                      name="supplier"
                      placeholder="Nama Supplier"
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeModal}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddStock}
              >
                {isEditMode ? "Simpan Perubahan" : "Simpan Semua"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
