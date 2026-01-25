import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import "./style/Inventory.scss";
import Navbar from "../../components/Navbar";
import Modal from "../../components/Modal";
import axios from "axios";
import { printStockEntry } from "../../utils/printStockEntry";
import { printInventory } from "../../utils/printInventory";
import { useToast } from "../../components/Toast/Toast";

export default function Inventory({ onLogout, user, storeName }) {
  const [inventory, setInventory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
  const [supplier, setSupplier] = useState("");
  const [editHargaBeli, setEditHargaBeli] = useState(0);
  const [editHargaJual, setEditHargaJual] = useState(0);
  const [editHargaPerKg, setEditHargaPerKg] = useState(0);
  const [editStok, setEditStok] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [storeSettings, setStoreSettings] = useState(null);

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastAddedStock, setLastAddedStock] = useState(null);
  const toast = useToast();

  // State for multi-item stock update
  const initialItem = {
    inventoryId: "",
    produk: "",
    stok: 0,
    quantity: 1,
    hargaBeli: 0,
    hargaJual: 0,
    hargaPerKg: 0,
    biayaKuli: 0,
    biayaSopir: 0,
    dp: 0,
    totalProduk: 0, // Gross
    total: 0, // Net
  };
  const [itemsToAdd, setItemsToAdd] = useState([initialItem]);

  const getWeightFromKategori = (kategori) => {
    if (!kategori) return 1;
    const m = String(kategori).match(/(\d+(?:\.\d+)?)/);
    const weight = m ? parseFloat(m[0]) : 1;
    return weight > 0 ? weight : 1;
  };

  const fetchInventory = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/inventory");
      setInventory(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/getsetting");
      if (response.data && response.data.length > 0) {
        setStoreSettings(response.data[0]);
      }
    } catch (error) {
      console.error("Gagal mengambil setting toko:", error);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchSettings();
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
        item.kategori = selectedProduct.kategori; // Store category for weight calc
        // fill prices from product
        item.hargaBeli = selectedProduct.modal || 0;
        item.hargaJual = selectedProduct.harga || 0;
        // fill harga per 1kg
        item.hargaPerKg = selectedProduct.harga_per_kg || 0;
        // recompute total
        const q = parseFloat(item.quantity || 0);
        item.total =
          Math.round(parseFloat(item.hargaBeli || 0) * q * 100) / 100;
      }
    }

    if (field === "hargaBeli") {
      const weight = getWeightFromKategori(item.kategori);
      item.hargaPerKg =
        Math.round((parseFloat(value || 0) / weight) * 100) / 100;
    }
    if (
      field === "quantity" ||
      field === "hargaBeli" ||
      field === "biayaKuli" ||
      field === "biayaSopir" ||
      field === "dp"
    ) {
      const q = parseFloat(item.quantity || 0);
      const hb_val = parseFloat(item.hargaBeli || 0);
      const bk = parseFloat(item.biayaKuli || 0);
      const bs = parseFloat(item.biayaSopir || 0);
      const d_p = parseFloat(item.dp || 0);
      item.totalProduk = Math.round(hb_val * q);
      item.total = Math.round(item.totalProduk - bk - bs - d_p);
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
      setEditHargaBeli(item.modal || 0);
      setEditHargaJual(item.harga || 0);
      setEditHargaPerKg(item.harga_per_kg || 0);
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
      toast.showToast("❌ Harap isi nama supplier.", {
        type: "error",
      });
      return;
    }

    // Logic for Edit Mode
    if (isEditMode) {
      try {
        await axios.put(`http://localhost:3000/api/inventory/${editData.id}`, {
          stok: editStok,
          supplier: supplier,
          hargaBeli: editHargaBeli,
          hargaJual: editHargaJual,
          hargaPerKg: editHargaPerKg,
        });
        toast.showToast("✅ Inventori berhasil diupdate", {
          type: "success",
        });
        fetchInventory();
        closeModal();
      } catch (error) {
        console.error("Failed to update inventory", error);
        toast.showToast(
          `❌ Gagal update inventori: ${
            error.response?.data?.message || error.message
          }`,
        );
      }
      return;
    }

    // Logic for Add Mode (Multiple Items)
    const validItems = itemsToAdd.filter(
      (item) => item.inventoryId && parseInt(item.quantity, 10) > 0,
    );

    if (validItems.length === 0) {
      toast.showToast("❌ Harap isi data produk dan jumlah dengan benar.", {
        type: "error",
      });
      return;
    }

    const itemsWithSupplier = validItems.map((item) => ({
      inventoryId: item.inventoryId,
      produk: item.produk,
      quantity: parseInt(item.quantity, 10),
      supplier,
      hargaBeli: parseFloat(item.hargaBeli || 0),
      hargaJual: parseFloat(item.hargaJual || 0),
      hargaPerKg: parseFloat(item.hargaPerKg || 0),
      biayaKuli: parseFloat(item.biayaKuli || 0),
      biayaSopir: parseFloat(item.biayaSopir || 0),
      dp: parseFloat(item.dp || 0),
      totalProduk: Math.round(
        parseFloat(item.hargaBeli || 0) * parseInt(item.quantity, 10),
      ),
      total: Math.round(
        parseFloat(item.hargaBeli || 0) * parseInt(item.quantity, 10) -
          parseFloat(item.biayaKuli || 0) -
          parseFloat(item.biayaSopir || 0) -
          parseFloat(item.dp || 0),
      ),
    }));

    try {
      await axios.post(`http://localhost:3000/api/inventory/add-stocks`, {
        items: itemsWithSupplier,
      });

      // Prepare data for success modal
      setLastAddedStock({
        supplier,
        items: itemsWithSupplier,
        tanggal: new Date(),
      });

      fetchInventory(); // Refresh data
      setIsModalOpen(false); // Close the input modal
      setShowSuccessModal(true); // Open the success modal
    } catch (error) {
      console.error("Failed to add stocks", error);
      toast.showToast(
        `❌ Gagal menambah stok: ${
          error.response?.data?.message || error.message
        }`,
        {
          type: "error",
        },
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
    (item) => item.stok <= item.minStok,
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
              <div className="unit">karung</div>
            </div>
            <div className="inventory-stat-card">
              <h3>Jumlah Produk</h3>
              <div className="value">{inventory.length}</div>
              <div className="unit">produk</div>
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
              <div className="unit">karung</div>
            </div>
          </div>

          <div
            className="inventory-action-bar"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              className="btn btn-primary"
              style={{ width: "auto" }}
              onClick={() => openModal(null)}
            >
              + Tambah Stok
            </button>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="text"
                placeholder="Cari Produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "10px",
                  borderRadius: "5px",
                  border: "1px solid #ddd",
                  width: "250px",
                  backgroundColor: "#fff",
                  color: "#333",
                }}
              />
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const filtered = inventory.filter((item) =>
                    item.produk
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()),
                  );
                  printInventory(storeSettings, filtered);
                }}
              >
                🖨 Cetak Inventory
              </button>
            </div>
          </div>

          <div className="inventory-card">
            <h2>Detail Inventori</h2>
            <div className="inventory-table-container">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>Stok Saat Ini (kg)</th>
                    <th>Harga/1kg (Rp)</th>
                    <th>Total Produk (Rp)</th>
                    <th>Total Bayar (Rp)</th>
                    <th>Min Stok (kg)</th>
                    <th>Qty Reorder (kg)</th>
                    <th>Status</th>
                    <th>Supplier</th>
                    <th>Update Terakhir</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory
                    .filter((item) =>
                      item.produk
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()),
                    )
                    .map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.produk}</strong>
                        </td>
                        <td>{item.stok}</td>
                        <td>
                          {item.harga_per_kg
                            ? Number(item.harga_per_kg).toLocaleString("id-ID")
                            : "-"}
                        </td>
                        <td>
                          {item.lastTotalProduk
                            ? Number(item.lastTotalProduk).toLocaleString(
                                "id-ID",
                              )
                            : "-"}
                        </td>
                        <td>
                          {item.lastTotal
                            ? Number(item.lastTotal).toLocaleString("id-ID")
                            : item.reorder && item.lastHargaBeli
                              ? (
                                  item.reorder * item.lastHargaBeli
                                ).toLocaleString("id-ID")
                              : "-"}
                        </td>
                        <td>{item.minStok}</td>
                        <td>{item.reorder}</td>
                        <td>{getStokStatus(item.stok, item.minStok)}</td>
                        <td>{item.supplier}</td>
                        <td>
                          {new Date(item.lastUpdate).toLocaleDateString(
                            "id-ID",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
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

      {/* Main Stock Modal */}
      {isModalOpen && (
        <Modal
          key="inventory-main-modal"
          isOpen={isModalOpen}
          onClose={closeModal}
          title={isEditMode ? "Edit Stok Produk" : "Tambah Stok Produk"}
          className="large"
        >
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
                  <label>Harga Beli (Rp)</label>
                  <input
                    type="number"
                    value={editHargaBeli}
                    // onChange={(e) => setEditHargaBeli(e.target.value)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditHargaBeli(val);
                      const weight = getWeightFromKategori(editData.kategori);
                      setEditHargaPerKg(
                        Math.round((parseFloat(val || 0) / weight) * 100) / 100,
                      );
                    }}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Harga Jual / Karung (Rp)</label>
                  <input
                    type="number"
                    value={editHargaJual}
                    onChange={(e) => setEditHargaJual(e.target.value)}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Harga / 1kg (Rp) (Read-Only)</label>
                  <input
                    type="number"
                    value={editHargaPerKg}
                    readOnly
                    className="form-control"
                    style={{ backgroundColor: "#f5f5f5" }}
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
              <div className="modal-body-inner" style={{ padding: 0 }}>
                {itemsToAdd.map((item, index) => (
                  <div
                    key={index}
                    className="item-row"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      padding: "20px",
                      border: "1px solid #eee",
                      borderRadius: "8px",
                      marginBottom: "20px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <h4 style={{ margin: 0 }}>Item #{index + 1}</h4>
                      {itemsToAdd.length > 1 && (
                        <button
                          className="remove"
                          onClick={() => removeItem(index)}
                          style={{
                            color: "#e74c3c",
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            fontSize: "20px",
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>

                    <div className="form-group-full">
                      <label>Nama Produk</label>
                      <select
                        name="inventoryId"
                        value={item.inventoryId}
                        onChange={(e) =>
                          handleItemChange(index, "inventoryId", e.target.value)
                        }
                        required
                        className="form-control"
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
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "15px",
                      }}
                    >
                      <div className="form-group-full">
                        <label>Harga Beli/Karung</label>
                        <input
                          type="number"
                          name="hargaBeli"
                          placeholder="Harga Beli"
                          value={item.hargaBeli}
                          onChange={(e) =>
                            handleItemChange(index, "hargaBeli", e.target.value)
                          }
                          className="form-control"
                        />
                      </div>
                      <div className="form-group-full">
                        <label>Harga Jual/Karung</label>
                        <input
                          type="number"
                          name="hargaJual"
                          placeholder="Harga Jual"
                          value={item.hargaJual}
                          onChange={(e) =>
                            handleItemChange(index, "hargaJual", e.target.value)
                          }
                          className="form-control"
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "15px",
                      }}
                    >
                      <div className="form-group-full">
                        <label>Harga/1kg</label>
                        <input
                          type="number"
                          name="hargaPerKg"
                          placeholder="Harga/1kg"
                          value={item.hargaPerKg}
                          readOnly
                          className="form-control"
                          style={{ backgroundColor: "#f5f5f5" }}
                        />
                      </div>
                      <div className="form-group-full">
                        <label>Jumlah (Qty)</label>
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
                          className="form-control"
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: "15px",
                      }}
                    >
                      <div className="form-group-full">
                        <label>Biaya Kuli</label>
                        <input
                          type="number"
                          name="biayaKuli"
                          placeholder="Rp"
                          value={item.biayaKuli}
                          onChange={(e) =>
                            handleItemChange(index, "biayaKuli", e.target.value)
                          }
                          className="form-control"
                        />
                      </div>
                      <div className="form-group-full">
                        <label>Biaya Sopir</label>
                        <input
                          type="number"
                          name="biayaSopir"
                          placeholder="Rp"
                          value={item.biayaSopir}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "biayaSopir",
                              e.target.value,
                            )
                          }
                          className="form-control"
                        />
                      </div>
                      <div className="form-group-full">
                        <label>DP</label>
                        <input
                          type="number"
                          name="dp"
                          placeholder="Rp"
                          value={item.dp}
                          onChange={(e) =>
                            handleItemChange(index, "dp", e.target.value)
                          }
                          className="form-control"
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "15px",
                      }}
                    >
                      <div className="form-group-full">
                        <label>Total Harga Produk</label>
                        <input
                          type="text"
                          name="totalProduk"
                          placeholder="Total Rp"
                          value={
                            item.totalProduk
                              ? Number(item.totalProduk).toLocaleString("id-ID")
                              : "0"
                          }
                          readOnly
                          className="form-control"
                          style={{
                            backgroundColor: "#f5f5f5",
                            fontWeight: "500",
                          }}
                        />
                      </div>
                      <div className="form-group-full">
                        <label>Total Bayar</label>
                        <input
                          type="text"
                          name="total"
                          placeholder="Total Rp"
                          value={
                            item.total
                              ? Number(item.total).toLocaleString("id-ID")
                              : "0"
                          }
                          readOnly
                          className="form-control"
                          style={{
                            backgroundColor: "#f5f5f5",
                            fontWeight: "bold",
                            color: "#27ae60",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button className="add-item" onClick={addItem}>
                  + Tambah Produk
                </button>

                <div className="form-group">
                  <label>Nama Supplier</label>
                  <input
                    type="text"
                    name="supplier"
                    placeholder="Nama Supplier"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    required
                  />
                </div>
              </div>
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
        </Modal>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <Modal
          key="inventory-success-modal"
          isOpen={showSuccessModal && lastAddedStock !== null}
          onClose={() => {
            setShowSuccessModal(false);
            closeModal();
          }}
          title="Stok Berhasil Ditambahkan!"
        >
          {lastAddedStock && (
            <div className="modal-body">
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <div style={{ fontSize: "50px", color: "#27ae60" }}>✅</div>
                <p>Data stok telah berhasil disimpan ke gudang.</p>
              </div>

              <div className="stock-summary-card">
                <h4>Ringkasan Penambahan:</h4>
                <div className="summary-info">
                  <p>
                    <span>Supplier:</span>{" "}
                    <strong>{lastAddedStock.supplier}</strong>
                  </p>
                  <p>
                    <span>Tanggal:</span>{" "}
                    <strong>
                      {new Date(lastAddedStock.tanggal).toLocaleDateString(
                        "id-ID",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </strong>
                  </p>
                </div>
                <table className="summary-table">
                  <thead>
                    <tr>
                      <th>Produk</th>
                      <th>Harga Beli (Rp)</th>
                      <th>Qty (kg)</th>
                      <th>Total (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastAddedStock.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.produk}</td>
                        <td>
                          {item.hargaBeli
                            ? Number(item.hargaBeli).toLocaleString("id-ID")
                            : "-"}
                        </td>
                        <td>{item.quantity}</td>
                        <td>
                          {item.total
                            ? Number(item.total).toLocaleString("id-ID")
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr
                      style={{
                        fontWeight: "bold",
                        borderTop: "2px solid #ddd",
                      }}
                    >
                      <td colSpan="2" style={{ textAlign: "right" }}>
                        Total:
                      </td>
                      <td>
                        {lastAddedStock.items.reduce(
                          (sum, item) => sum + (Number(item.quantity) || 0),
                          0,
                        )}
                      </td>
                      <td>
                        {Number(
                          lastAddedStock.items.reduce(
                            (sum, item) => sum + (Number(item.total) || 0),
                            0,
                          ),
                        ).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowSuccessModal(false);
                closeModal();
              }}
            >
              Selesai
            </button>
            <button
              className="btn btn-primary"
              onClick={() => printStockEntry(storeSettings, lastAddedStock)}
            >
              🖨 Cetak PDF
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
