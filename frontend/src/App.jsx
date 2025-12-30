import React, { useState, useEffect } from "react";
import {
  HashRouter as Router,
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
import Retur from "./pages/Retur/Retur";
import Reports from "./pages/Reports/Reports";
import Settings from "./pages/Settings/Settings";
import Pelanggan from "./pages/Pelanggan/Pelanggan";
import Pengiriman from "./pages/Pengiriman/Pengiriman";
import LicenseModal from "./components/LicenseModal/LicenseModal";
import { licenseService } from "./utils/licenseService";
import { ToastProvider } from "./components/Toast/Toast";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Can be replaced by real auth check
  const [isActivated, setIsActivated] = useState(
    licenseService.isLocallyActivated()
  );
  const [user, setUser] = useState({ nama: "Admin", role: "admin" }); // Default/Mock user
  const [storeName, setStoreName] = useState("Toko Beras");

  useEffect(() => {
    fetchStoreSettings();
    // Check localStorage for user if needed
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
      checkLicenseValidity();
    }

    // --- ELECTRON FIX: Global cleanup on mount ---
    const cleanupStuckStates = () => {
      document.body.style.overflow = "";
      document.body.style.pointerEvents = "";
      const modalRoot = document.getElementById("modal-root");
      if (modalRoot) {
        modalRoot.innerHTML = "";
      }
    };

    // Run cleanup immediately
    cleanupStuckStates();

    // --- ELECTRON FIX: Cleanup on window ready (from main process) ---
    const handleWindowReady = () => {
      console.log("Electron window ready - running cleanup");
      cleanupStuckStates();
    };

    // Listen for Electron's window-ready event
    if (window.require) {
      try {
        const { ipcRenderer } = window.require("electron");
        ipcRenderer.on("window-ready", handleWindowReady);
      } catch (e) {
        // Not in Electron or IPC not available
      }
    }

    // --- ELECTRON FIX: Cleanup on window focus ---
    const handleWindowFocus = () => {
      // When user switches back to app, ensure no stuck states
      setTimeout(() => {
        document.body.style.overflow = "";
        document.body.style.pointerEvents = "";
      }, 50);
    };

    // --- Global Click Debugger ---
    const handleDebugKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        // Check center element
        const el = document.elementFromPoint(
          window.innerWidth / 2,
          window.innerHeight / 2
        );
        console.log("Blocking Element Check:", el);

        // Check for all overlays in DOM
        const allOverlays = document.querySelectorAll(
          '[class*="overlay"], [class*="modal"], [class*="backdrop"]'
        );

        let overlayInfo = `🎯 Elemen di Tengah: ${
          el ? el.tagName + "." + el.className : "None"
        }\n`;
        overlayInfo += `Z-Index: ${
          el ? window.getComputedStyle(el).zIndex : "N/A"
        }\n`;
        overlayInfo += `Pointer-Events: ${
          el ? window.getComputedStyle(el).pointerEvents : "N/A"
        }\n\n`;

        if (allOverlays.length > 0) {
          overlayInfo += `⚠️ Ditemukan ${allOverlays.length} overlay/modal di DOM:\n\n`;
          allOverlays.forEach((overlay, idx) => {
            const style = window.getComputedStyle(overlay);
            overlayInfo += `${idx + 1}. ${overlay.className}\n`;
            overlayInfo += `   Display: ${style.display}\n`;
            overlayInfo += `   Opacity: ${style.opacity}\n`;
            overlayInfo += `   Z-Index: ${style.zIndex}\n`;
            overlayInfo += `   Pointer-Events: ${style.pointerEvents}\n\n`;
          });
        } else {
          overlayInfo += "✅ Tidak ada overlay/modal terdeteksi";
        }

        alert(overlayInfo);
        console.log("All overlays:", allOverlays);
      }
    };

    // --- Global Modal Purge on Navigation (Electron Safety) ---
    const handleRouteChange = () => {
      const modalRoot = document.getElementById("modal-root");
      if (modalRoot) {
        modalRoot.innerHTML = ""; // Force clear all portals
        document.body.style.overflow = ""; // Unstuck scroll
        document.body.style.pointerEvents = ""; // Unstuck pointer events
      }
    };

    window.addEventListener("keydown", handleDebugKey);
    window.addEventListener("popstate", handleRouteChange); // Listen for back/forward
    window.addEventListener("focus", handleWindowFocus); // Listen for window focus

    return () => {
      window.removeEventListener("keydown", handleDebugKey);
      window.removeEventListener("popstate", handleRouteChange);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, []);

  const checkLicenseValidity = async () => {
    const isValid = await licenseService.validateServerActivation();
    setIsActivated(isValid);
  };

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

  const handleActivated = () => {
    setIsActivated(true);
  };

  const handleLogin = async (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    await checkLicenseValidity();
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
    <ToastProvider>
      <Router>
        {isAuthenticated && !isActivated && (
          <LicenseModal
            onActivated={handleActivated}
            onBackToLogin={handleLogout}
          />
        )}
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <Dashboard {...commonProps} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/products"
            element={
              isAuthenticated ? (
                <Products {...commonProps} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/sales"
            element={
              isAuthenticated ? (
                <Sales {...commonProps} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/pelanggan"
            element={
              isAuthenticated ? (
                <Pelanggan {...commonProps} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/inventory"
            element={
              isAuthenticated ? (
                <Inventory {...commonProps} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/pengiriman"
            element={
              isAuthenticated ? (
                <Pengiriman {...commonProps} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/retur"
            element={
              isAuthenticated ? (
                <Retur {...commonProps} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/reports"
            element={
              isAuthenticated ? (
                <Reports {...commonProps} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/settings"
            element={
              isAuthenticated ? (
                <Settings {...commonProps} refreshStore={fetchStoreSettings} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </Router>
    </ToastProvider>
  );
}
