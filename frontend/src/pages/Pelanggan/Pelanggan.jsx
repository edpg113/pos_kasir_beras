import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import Modal from "../../components/Modal";
import "./style/Pelanggan.scss";
import axios from "axios";
import { useEffect, useState } from "react";
import { useToast } from "../../components/Toast/Toast";

export default function Pelanggan({ onLogout, user, storeName }) {
  const [pelanggan, setPelanggan] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    nama: "",
    telepon: "",
    alamat: "",
    kategori: "",
  });
  const toast = useToast();

  // Fetch customer data from backend
  const fetchPelanggan = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/pelanggan");
      setPelanggan(response.data);
    } catch (error) {
      console.error("Gagal mengambil data pelanggan:", error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchPelanggan();
  }, []);

  // Correctly handle input changes
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  // Handle Add Customer
  const handleAddPelanggan = async () => {
    try {
      await axios.post("http://localhost:3000/api/addpelanggan", formData);
      toast.showToast(`Pelanggan berhasil ditambahkan!`, {
        type: "success",
      });
      fetchPelanggan();
      closeModal();
    } catch (error) {
      console.error("Gagal menambahkan pelanggan:", error);
      toast.showToast(
        "Gagal menambahkan pelanggan: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // Handle Update Customer
  const handleUpdatePelanggan = async () => {
    try {
      await axios.put(
        `http://localhost:3000/api/pelanggan/${editId}`,
        formData
      );
      toast.showToast(`Pelanggan berhasil diperbarui!`, {
        type: "success",
      });
      fetchPelanggan();
      closeModal();
    } catch (error) {
      console.error("Gagal memperbarui pelanggan:", error);
      toast.showToast(
        "Gagal memperbarui pelanggan: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // Switcher for form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditMode) {
      handleUpdatePelanggan();
    } else {
      handleAddPelanggan();
    }
  };

  const handleDeletePelanggan = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus pelanggan ini?"))
      return;

    try {
      await axios.delete(`http://localhost:3000/api/pelanggan/${editId}`);
      toast.showToast("Pelanggan berhasil dihapus!", {
        type: "success",
      });
      fetchPelanggan();
      closeModal();
    } catch (error) {
      console.error("Gagal menghapus pelanggan:", error);
      toast.showToast(
        "Gagal menghapus pelanggan: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const openModal = (pelangganData = null) => {
    if (pelangganData) {
      setIsEditMode(true);
      setEditId(pelangganData.id);
      setFormData({
        nama: pelangganData.nama,
        telepon: pelangganData.telepon,
        alamat: pelangganData.alamat,
        kategori: pelangganData.kategori,
      });
    } else {
      setIsEditMode(false);
      setEditId(null);
      setFormData({ nama: "", telepon: "", alamat: "", kategori: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditId(null);
    setFormData({ nama: "", telepon: "", alamat: "", kategori: "" }); // Reset form
  };

  return (
    <div className="pelanggan-container">
      <Sidebar onLogout={onLogout} user={user} storeName={storeName} />
      <div className="pelanggan-content-wrapper">
        <Navbar title="Manajemen Pelanggan" onLogout={onLogout} user={user} />

        <div className="pelanggan-page-content">
          <div className="pelanggan-action-bar">
            <button className="btn btn-primary" onClick={() => openModal(null)}>
              + Tambah Pelanggan
            </button>
          </div>

          <div className="table-card">
            <h2>Daftar Pelanggan</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Telepon</th>
                    <th>Alamat</th>
                    <th>Kategori</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pelanggan.map((p) => (
                    <tr key={p.id}>
                      <td>{p.nama}</td>
                      <td>{p.telepon}</td>
                      <td>{p.alamat}</td>
                      <td>{p.kategori}</td>
                      <td>
                        <button
                          className="btn-edit"
                          onClick={() => openModal(p)}
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

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditMode ? "Edit Pelanggan" : "Tambah Pelanggan Baru"}
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="nama">Nama Pelanggan</label>
              <input
                type="text"
                id="nama"
                value={formData.nama}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="telepon">Nomor Telepon</label>
              <input
                type="tel"
                id="telepon"
                value={formData.telepon}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="alamat">Alamat</label>
              <textarea
                id="alamat"
                value={formData.alamat}
                onChange={handleInputChange}
                rows="3"
                required
              ></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="kategori">Kategori Pelanggan</label>
              <select
                id="kategori"
                name="kategori"
                value={formData.kategori}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Pilih Kategori --</option>
                <option value="Pelanggan Baru">Pelanggan Baru</option>
                <option value="Pelanggan Setia">Pelanggan Setia</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            {isEditMode && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeletePelanggan}
                style={{
                  marginRight: "auto",
                  backgroundColor: "#dc3545",
                  color: "white",
                }}
              >
                Hapus
              </button>
            )}
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
