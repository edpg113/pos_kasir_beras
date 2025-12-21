import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import "./style/Settings.scss";
import Navbar from "../../components/Navbar";
import axios from "axios";
import ChangePasswordModal from "./ChangePasswordModal"; // Impor modal

export default function Settings({ onLogout, user }) {
  const [formData, setFormData] = useState({
    id: "",
    namaToko: "",
    pemilik: "",
    email: "",
    telepon: "",
    alamat: "",
  });

  const [data, setData] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // State untuk modal

  const fetchSetting = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/getsetting");
      console.log("📥 Fetched setting data:", response.data);
      setData(response.data);
    } catch (error) {
      console.error("❌ Error fetching setting data:", error);
    }
  };

  useEffect(() => {
    fetchSetting();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`http://localhost:3000/api/user/password/${formData.id}`, {
        namaToko: formData.namaToko,
        pemilik: formData.pemilik,
        email: formData.email,
        telepon: formData.telepon,
        alamat: formData.alamat,
      });
      console.log("📥 Settings saved response:", response);
      alert("✅ Pengaturan berhasil disimpan!");
    } catch (error) {
      console.error("❌ Error saving settings:", error);
      alert("❌ Gagal menyimpan pengaturan!");
    }
    fetchSetting();
    setEditMode(false);
  };

  const handleCancel = () => {
    setEditMode(false);
  };

  return (
    <>
      <div className="settings-container">
        <Sidebar onLogout={onLogout} user={user} />
        <div className="settings-content-wrapper">
          <Navbar title="Setting" onLogout={onLogout} user={user} />

          <div className="settings-page-content">
            <div className="settings-page-header">
              <h1>Pengaturan Toko</h1>
              <p>Kelola informasi dan konfigurasi toko Anda</p>
            </div>

            <div className="settings-card">
              <div className="settings-card-header">
                <h2>Informasi Toko</h2>
                {!editMode && (
                  <button
                    className="btn btn-primary"
                    style={{ width: "auto" }}
                    onClick={() => {
                      setFormData(data[0]);
                      setEditMode(true);
                    }}
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>

              {editMode ? (
                <div className="settings-form-container">
                  <form onSubmit={handleSave}>
                    <div className="settings-form-row">
                      <div className="settings-form-group">
                        <label>Nama Toko</label>
                        <input
                          type="text"
                          name="namaToko"
                          id="namaToko"
                          value={formData.namaToko}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="settings-form-group">
                        <label>Pemilik</label>
                        <input
                          type="text"
                          name="pemilik"
                          id="pemilik"
                          value={formData.pemilik}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="settings-form-row">
                      <div className="settings-form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={formData.email}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="settings-form-group">
                        <label>No. Telepon</label>
                        <input
                          type="tel"
                          name="telepon"
                          id="telepon"
                          value={formData.telepon}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="settings-form-group">
                      <label>Alamat</label>
                      <input
                        type="text"
                        name="alamat"
                        id="alamat"
                        value={formData.alamat}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="settings-button-group">
                      <button
                        className="btn btn-primary"
                        style={{ width: "auto" }}
                        type="submit"
                      >
                        💾 Simpan
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ width: "auto" }}
                        onClick={handleCancel}
                      >
                        ❌ Batal
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="settings-info-section">
                  {data.map((item) => (
                    <ul key={item.id}>
                      <div className="settings-info-row" key={item.id}>
                        <strong>Nama Toko:</strong> {item.namaToko || "-"}
                      </div>
                      <div className="settings-info-row">
                        <strong>Pemilik:</strong> {item.pemilik || "-"}
                      </div>
                      <div className="settings-info-row">
                        <strong>Email:</strong> {item.email || "-"}
                      </div>
                      <div className="settings-info-row">
                        <strong>No. Telepon:</strong> {item.telepon || "-"}
                      </div>
                      <div className="settings-info-row">
                        <strong>Alamat:</strong> {item.alamat || "-"}
                      </div>
                    </ul>
                  ))}
                </div>
              )}
            </div>

            <div className="settings-card">
              <h2>Keamanan</h2>
              <div className="settings-info-section">
                <div className="settings-info-row">
                  <button
                    className="btn btn-primary"
                    style={{ width: "auto" }}
                    onClick={() => setIsModalOpen(true)} // Buka modal
                  >
                    🔐 Ubah Password
                  </button>
                </div>
                <div className="settings-info-row">
                  <button className="btn btn-secondary" style={{ width: "auto" }}>
                    📋 Lihat Log Aktivitas
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ChangePasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
