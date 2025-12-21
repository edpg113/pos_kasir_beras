import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import "./style/Products.scss";
import Navbar from "../../components/Navbar";
import axios from "axios";

export default function Products({ onLogout, user }) {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // State untuk produk yang diedit & visibilitas modal
  const [newProduct, setNewProduct] = useState({
    namaProduk: "",
    kategori: "",
    harga: "",
    modal: "",
    stok: "",
  });

  const getStokBadge = (stok) => {
    if (stok > 100)
      return <span className="badge badge-success">Stok Tinggi</span>;
    if (stok >= 50)
      return <span className="badge badge-info">Stok Normal</span>;
    return <span className="badge badge-warning">Stok Rendah</span>;
  };

  const handleChange = (e) => {
    setNewProduct({
      ...newProduct,
      [e.target.name]: e.target.value,
    });
  };

  // =============================
  // ADD PRODUCT
  // =============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:3000/api/products",
        newProduct,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("📥 New product added response:", response);
      alert("✅ Produk baru berhasil ditambahkan!");
      setNewProduct({
        namaProduk: "",
        kategori: "",
        harga: "",
        modal: "",
        stok: "",
      });
      fetchProducts();
      setShowModal(false);
    } catch (error) {
      console.log("❌ Error adding new product:", error);
      alert("❌ Gagal menambahkan produk baru!");
    }
  };

  // =============================
  // FETCH PRODUCT
  // =============================
  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/getproducts");
      setProducts(response.data);
      console.log("📥 Fetched products:", response.data);
    } catch (error) {
      console.error("❌ Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // =============================
  // EDIT PRODUCT HANDLERS
  // =============================
  const handleEditClick = (product) => {
    setEditingProduct(product);
  };

  const handleEditCancel = () => {
    setEditingProduct(null);
  };

  const handleEditChange = (e) => {
    setEditingProduct({
      ...editingProduct,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const response = await axios.put(
        `http://localhost:3000/api/editproduct/${editingProduct.id}`,
        editingProduct
      );
      console.log("🔄 Product updated response:", response);
      alert("✅ Produk berhasil diperbarui!");
      fetchProducts();
      setEditingProduct(null); // Tutup modal setelah berhasil
    } catch (error) {
      console.log("❌ Error updating product:", error);
      alert("❌ Gagal memperbarui produk!");
    }
  };

  // =============================
  // DELETE PRODUCT HANDLERS
  // =============================
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/deleteproduct/${id}`);
      alert("✅ Produk berhasil dihapus!");
      fetchProducts();
      setEditingProduct(null);
    } catch (error) {
      console.log("❌ Error updating product:", error);
      alert("❌ Gagal menghapus produk!");
    }
  };

  return (
    <div className="products-container">
      <Sidebar onLogout={onLogout} user={user} />
      <div className="products-content-wrapper">
        <Navbar title="Produk" onLogout={onLogout} user={user} />

        <div className="products-page-content">
          <div className="products-page-header">
            <h1>Daftar Produk Beras</h1>
            <p>Kelola semua produk beras yang tersedia di toko Anda</p>
          </div>

          <div className="products-action-bar">
            <button
              className="btn btn-primary"
              style={{ width: "auto" }}
              onClick={() => setShowModal(true)}
            >
              + Tambah Produk Baru
            </button>
          </div>

          <div className="products-card">
            <div className="products-table-container">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Nama Produk</th>
                    <th>Kategori</th>
                    <th>Harga Jual (Rp/kg)</th>
                    <th>Harga Beli</th>
                    <th>Stok (kg)</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.namaProduk}</strong>
                      </td>
                      <td>{product.kategori}</td>
                      <td>{product.harga.toLocaleString("id-ID")}</td>
                      <td>{product.modal.toLocaleString("id-ID")}</td>
                      <td>{product.stok}</td>
                      <td>{getStokBadge(product.stok)}</td>
                      <td>
                        <button onClick={() => handleEditClick(product)}>
                          ✏️
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
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Tambah Produk Baru</h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ✖
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Nama Produk</label>
                <input
                  type="text"
                  name="namaProduk"
                  value={newProduct.namaProduk}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Kategori</label>
                <select
                  name="kategori"
                  value={newProduct.kategori}
                  onChange={handleChange}
                  required
                >
                  <option value="">Pilih Kategori</option>
                  <option value="Premium">Premium</option>
                  <option value="Standar">Standar</option>
                  <option value="Organik">Organik</option>
                  <option value="Import">Import</option>
                  <option value="Khusus">Khusus</option>
                </select>
              </div>
              <div className="form-group">
                <label>Harga Beli</label>
                <input
                  type="number"
                  name="modal"
                  value={newProduct.modal}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Harga Jual (Rp/kg)</label>
                  <input
                    type="number"
                    name="harga"
                    value={newProduct.harga}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Stok (kg)</label>
                  <input
                    type="number"
                    name="stok"
                    value={newProduct.stok}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Edit Produk</h2>
              <button className="modal-close" onClick={handleEditCancel}>
                ✖
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="modal-body">
              <div className="form-group">
                <label>Nama Produk</label>
                <input
                  type="text"
                  name="namaProduk"
                  value={editingProduct.namaProduk}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Kategori</label>
                <select
                  name="kategori"
                  value={editingProduct.kategori}
                  onChange={handleEditChange}
                  required
                >
                  <option value="">Pilih Kategori</option>
                  <option value="Premium">Premium</option>
                  <option value="Standar">Standar</option>
                  <option value="Organik">Organik</option>
                  <option value="Import">Import</option>
                  <option value="Khusus">Khusus</option>
                </select>
              </div>
              <div className="form-group">
                <label>Harga Beli</label>
                <input
                  type="number"
                  name="modal"
                  value={editingProduct.modal}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Harga Jual (Rp/kg)</label>
                  <input
                    type="number"
                    name="harga"
                    value={editingProduct.harga}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Stok (kg)</label>
                  <input
                    type="number"
                    name="stok"
                    value={editingProduct.stok}
                    onChange={handleEditChange}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleEditCancel}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-logout" onClick={() => handleDelete(editingProduct.id)}>
                  Hapus Produk
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
