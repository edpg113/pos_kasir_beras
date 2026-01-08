import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Sidebar.scss";
import axios from "axios";

export default function Sidebar({ onLogout, user, storeName }) {
  const isActive = (path) => (location.pathname === path ? "active" : "");

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div>
          <h2>{storeName || "Toko Beras"}</h2>
        </div>
        <p>
          {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) ||
            "karyawan"}
        </p>
      </div>

      <ul className="sidebar-menu">
        <li className="menu-item">
          <Link to="/dashboard" className={isActive("/dashboard")}>
            <span className="menu-icon">📊</span>
            Dashboard
          </Link>
        </li>
        <li className="menu-item">
          <Link to="/products" className={isActive("/products")}>
            <span className="menu-icon">📦</span>
            Produk
          </Link>
        </li>
        <li className="menu-item">
          <Link to="/sales" className={isActive("/sales")}>
            <span className="menu-icon">💰</span>
            Penjualan
          </Link>
        </li>
        <li className="menu-item">
          <Link to="/pelanggan" className={isActive("/pelanggan")}>
            <span className="menu-icon">🙎‍♂️</span>
            Pelanggan
          </Link>
        </li>
        <li className="menu-item">
          <Link to="/inventory" className={isActive("/inventory")}>
            <span className="menu-icon">📋</span>
            Inventori
          </Link>
        </li>
        <li className="menu-item">
          <Link to="/pengiriman" className={isActive("/pengiriman")}>
            <span className="menu-icon">🚚</span>
            Pengiriman
          </Link>
        </li>
        <li className="menu-item">
          <Link to="/pobarang" className={isActive("/pobarang")}>
            <span className="menu-icon">📋</span>
            PO Barang
          </Link>
        </li>
        <li className="menu-item">
          <Link to="/retur" className={isActive("/retur")}>
            <span className="menu-icon">↺</span>
            Retur
          </Link>
        </li>
        <li className="menu-item">
          <Link to="/reports" className={isActive("/reports")}>
            <span className="menu-icon">📈</span>
            Laporan
          </Link>
        </li>
        <li className="menu-item">
          <Link to="/pengeluaran" className={isActive("/pengeluaran")}>
            <span className="menu-icon">📠</span>
            Pengeluaran
          </Link>
        </li>
        <li className="menu-item">
          <Link to="/settings" className={isActive("/settings")}>
            <span className="menu-icon">⚙️</span>
            Pengaturan
          </Link>
        </li>
      </ul>
    </div>
  );
}
