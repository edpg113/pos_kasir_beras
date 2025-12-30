import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import "./style/Products.scss";
import Navbar from "../../components/Navbar";
import Modal from "../../components/Modal";
import axios from "axios";
import { useToast } from "../../components/Toast/Toast";

export default function Products({ onLogout, user, storeName }) {
  const [products, setProducts] = useState([]);
  const [newCategories, setNewCategories] = useState({
    category: "",
  });
  const [getcategory, setGetCategory] = useState([]);
  const [modalCategory, setModalCategory] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    namaProduk: "",
    kategori: "",
    harga: "",
    modal: "",
    stok: "",
  });
  const toast = useToast();

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
  // CATEGORY HANDLERS
  // =============================
  const dataCategories = {
    category: newCategories,
  };

  const handleAddCategories = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        "http://localhost:3000/api/addcategories",
        dataCategories,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      toast.showToast("Berhasil menambahkan kategori", {
        type: "success",
      });
      setNewCategories("");
      fetchCategories();
    } catch (err) {
      console.log(err);
      toast.showToast("Gagal menambahkan kategori", {
        type: "error",
      });
    }
  };

  const fetchCategories = async () => {
    try {
      // Assuming an endpoint to get categories exists
      const response = await axios.get("http://localhost:3000/api/categories");
      console.log("📥 Fetched products:", response.data);
      setGetCategory(response.data);
    } catch (error) {
      console.error("❌ Error fetching categories:", error);
    }
  };

  // =============================
  // EDIT CATEGORY HANDLERS
  // =============================

  const handleEditCategory = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.put(
        `http://localhost:3000/api/editcategories/${editCategory.id}`,
        editCategory
      );
      setEditCategory(response.data);
      toast.showToast("✅ Kategori berhasil diperbarui!", {
        type: "success",
      });
      fetchCategories();
      setModalCategory(false);
    } catch (err) {
      console.log(err);
    }
  };

  // =============================
  // DELETE CATEGORY HANDLERS
  // =============================
  const handleDeleteCategory = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/deletecategories/${id}`);
      toast.showToast("✅ Kategori berhasil dihapus!", {
        type: "success",
      });
      fetchCategories();
      setEditCategory(null);
      setModalCategory(false);
    } catch (error) {
      console.log("❌ Error updating kategori:", error);
      toast.showToast("❌ Gagal menghapus kategori!", {
        type: "error",
      });
    }
  };

  // =============================
  // PRODUCT HANDLERS
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
      toast.showToast("✅ Produk baru berhasil ditambahkan!", {
        type: "success",
      });
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
      toast.showToast("❌ Gagal menambahkan produk baru!", {
        type: "error",
      });
    }
  };

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
    fetchCategories();
  }, []);

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
      toast.showToast("✅ Produk berhasil diperbarui!", {
        type: "success",
      });
      fetchProducts();
      setEditingProduct(null);
    } catch (error) {
      console.log("❌ Error updating product:", error);
      toast.showToast("❌ Gagal memperbarui produk!", {
        type: "error",
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/deleteproduct/${id}`);
      toast.showToast("✅ Produk berhasil dihapus!", {
        type: "success",
      });
      fetchProducts();
      setEditingProduct(null);
    } catch (error) {
      console.log("❌ Error updating product:", error);
      toast.showToast("❌ Gagal menghapus produk!", {
        type: "error",
      });
    }
  };

  return (
    <div className="products-container">
      <Sidebar onLogout={onLogout} user={user} storeName={storeName} />
      <div className="products-content-wrapper">
        <Navbar
          title="Produk"
          onLogout={onLogout}
          user={user}
          storeName={storeName}
        />

        <div className="products-page-content">
          <div className="products-page-header">
            <h1>Manajemen Produk & Kategori</h1>
            <p>Kelola semua produk beras dan kategori yang tersedia</p>
          </div>

          <div className="products-layout">
            {/* Left Column: Product List */}
            <div className="products-main-column">
              <div className="products-action-bar">
                <h3>Daftar Produk</h3>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowModal(true)}
                >
                  + Tambah Produk
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
                          <td>Rp. {product.harga.toLocaleString("id-ID")}</td>
                          <td>Rp. {product.modal.toLocaleString("id-ID")}</td>
                          <td>{product.stok}</td>
                          <td>{getStokBadge(product.stok)}</td>
                          <td>
                            <button onClick={() => handleEditClick(product)}>
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

            {/* Right Column: Category Management */}
            <div className="products-side-column">
              <div className="category-card">
                <h3>Buat Kategori Baru</h3>
                <form onSubmit={handleAddCategories} className="category-form">
                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="Nama Kategori"
                      value={newCategories.category}
                      onChange={(e) => setNewCategories(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn btn-primary">
                      +
                    </button>
                  </div>
                </form>
              </div>
              <div className="category-card">
                <h3>Daftar Kategori</h3>
                <ul className="category-list">
                  {getcategory.map((item) => (
                    <li key={item.id}>
                      {item.kategori} <span>|</span>
                      <button
                        onClick={() => {
                          setEditCategory(item);
                          setModalCategory(true);
                        }}
                      >
                        Edit
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <Modal
                isOpen={modalCategory}
                onClose={() => setModalCategory(false)}
                title="Edit Kategori"
              >
                <form className="modal-body" onSubmit={handleEditCategory}>
                  <div className="form-group">
                    <input
                      type="text"
                      value={editCategory ? editCategory.kategori : ""}
                      onChange={(e) =>
                        setEditCategory({
                          ...editCategory,
                          kategori: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-logout"
                      onClick={() => handleDeleteCategory(editCategory.id)}
                    >
                      Hapus
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Simpan
                    </button>
                  </div>
                </form>
              </Modal>
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showModal && (
        <Modal
          key="add-product-modal"
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Tambah Produk Baru"
        >
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
                <option value="">-- Pilih Kategori --</option>
                {getcategory.map((item) => (
                  <option key={item.id} value={item.kategori}>
                    {item.kategori}
                  </option>
                ))}
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
        </Modal>
      )}

      {/* Edit Product Modal */}
      {editingProduct !== null && (
        <Modal
          key={`edit-product-${editingProduct?.id}`}
          isOpen={editingProduct !== null}
          onClose={handleEditCancel}
          title="Edit Produk"
        >
          <form onSubmit={handleUpdateProduct} className="modal-body">
            <div className="form-group">
              <label>Nama Produk</label>
              <input
                type="text"
                name="namaProduk"
                value={editingProduct?.namaProduk || ""}
                onChange={handleEditChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Kategori</label>
              <select
                name="kategori"
                value={editingProduct?.kategori || ""}
                onChange={handleEditChange}
                required
              >
                <option value="">-- Pilih Kategori --</option>
                {getcategory.map((item) => (
                  <option key={item.id} value={item.kategori}>
                    {item.kategori}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Harga Beli</label>
              <input
                type="number"
                name="modal"
                value={editingProduct?.modal || ""}
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
                  value={editingProduct?.harga || ""}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Stok (kg)</label>
                <input
                  type="number"
                  name="stok"
                  value={editingProduct?.stok || ""}
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
              <button
                type="button"
                className="btn btn-logout"
                onClick={() => handleDelete(editingProduct.id)}
              >
                Hapus Produk
              </button>
              <button type="submit" className="btn btn-primary">
                Simpan Perubahan
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
