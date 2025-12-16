import { useState } from "react";
import "./style/Login.scss";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    password: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validasi input
    if (!formData.nama || !formData.email || !formData.password || !formData.role) {
      setError("Semua field harus diisi!");
      return;
    }

    setLoading(true);

    try {
      console.log("📤 Sending data:", formData);
      
      const response = await fetch("http://localhost:3000/api/newusers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      console.log("📥 Response status:", response.status);
      
      const data = await response.json();
      console.log("📥 Response data:", data);

      if (response.ok) {
        alert("✅ Registrasi berhasil! Silakan login.");
        setFormData({ nama: "", email: "", password: "", role: "" });
        navigate("/");
      } else {
        setError(data.error || "❌ Registrasi gagal!");
      }
    } catch (error) {
      console.error("❌ Error during registration:", error);
      setError("❌ Server tidak merespon. Pastikan backend berjalan di http://localhost:3000");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🌾 Toko Beras</h1>
        <p className="login-subtitle">Sistem Manajemen Toko Beras</p>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Nama Lengkap</label>
            <input
              type="text"
              id="nama"
              value={formData.nama}
              onChange={handleChange}
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Masukkan email Anda"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Masukkan password"
            />
          </div>

          <div className="form-group">
            <label>Peran</label>
            <select id="role" value={formData.role} onChange={handleChange}>
              <option value="">-- Pilih Peran --</option>
              <option value="Owner">Owner</option>
              <option value="Karyawan">Karyawan</option>
            </select>
          </div>

          <div className="login-toggle-form">
            <button type="submit" disabled={loading}>
              {loading ? "Membuat Akun..." : "Buat Akun"}
            </button>
          </div>
        </form>
        <Link to="/">Sudah punya akun? Login</Link>
      </div>
    </div>
  );
}