import "./style/Login.scss";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../components/Toast/Toast";

export default function Login({ onLogin }) {
  const [toko, setToko] = useState([]);
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Email dan password harus diisi!");
      return;
    }

    setLoading(true);
    try {
      console.log("📤 Sending login data:", formData);
      const response = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log("📥 Received response:", data);

      if (response.ok) {
        console.log("✅ Login successful");
        toast.showToast("✅ Login berhasil!", "success");

        const userData = {
          email: formData.email,
          nama: data.user?.nama || "User",
          role: data.user?.role || "user",
        };

        onLogin(userData); // This will set isAuthenticated and trigger activation check
        setFormData({ email: "", password: "" });
        navigate("/dashboard");
      } else {
        setError(data.error || "❌ Login gagal!");
        console.error("❌ Login error:", data.error);
      }
    } catch (error) {
      console.error("❌ Error during login:", error);
      setError("❌ Server tidak merespon...");
    } finally {
      setLoading(false);
    }
  };

  // GET nama toko from API Setting
  useEffect(() => {
    fetchToko();
  }, []);

  const fetchToko = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/getsetting");
      setToko(response.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {toko.map((item) => (
          <h1>{item.namaToko}</h1>
        ))}
        <p className="login-subtitle">Sistem Manajemen Toko Beras</p>

        <form onSubmit={handleSubmit} id="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
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
              name="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Masukkan password"
            />
          </div>
        </form>

        {error && (
          <div
            style={{ color: "#e74c3c", marginBottom: "15px", fontSize: "14px" }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          form="login-form"
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? "Memproses..." : "Masuk"}
        </button>
        <Link to="/register">Belum punya akun ? Register</Link>
      </div>
    </div>
  );
}
