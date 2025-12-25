import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.scss";
import Login from "./pages/Login/Login";
import Register from "./pages/Login/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import Products from "./pages/Products/Products";
import Sales from "./pages/Sales/Sales";
import Inventory from "./pages/Inventory/Inventory";
import Reports from "./pages/Reports/Reports";
import Settings from "./pages/Settings/Settings";
import Pelanggan from "./pages/Pelanggan/Pelanggan";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Can be replaced by real auth check
  const [user, setUser] = useState({ name: "Admin", role: "admin" }); // Default/Mock user
  const [storeName, setStoreName] = useState("Toko Beras");

  useEffect(() => {
    fetchStoreSettings();
    // Check localStorage for user if needed
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const fetchStoreSettings = async () => {
    try {
      // We need axios here
      const response = await fetch("http://localhost:3000/api/getsetting");
      const data = await response.json();
      if (data && data.length > 0) {
        setStoreName(data[0].namaToko);
      }
    } catch (error) {
      console.error("Gagal mengambil setting toko:", error);
    }
  };

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("user");
  };

  const commonProps = {
    user,
    storeName,
    onLogout: handleLogout,
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard {...commonProps} />} />
        <Route path="/products" element={<Products {...commonProps} />} />
        <Route path="/sales" element={<Sales {...commonProps} />} />
        <Route path="/pelanggan" element={<Pelanggan {...commonProps} />} />
        <Route path="/inventory" element={<Inventory {...commonProps} />} />
        <Route path="/reports" element={<Reports {...commonProps} />} />
        <Route
          path="/settings"
          element={
            <Settings {...commonProps} refreshStore={fetchStoreSettings} />
          }
        />
      </Routes>
    </Router>
  );
}
