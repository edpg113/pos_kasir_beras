import React, { useState } from "react";
import { licenseService } from "../../utils/licenseService";
import "./LicenseModal.css";

const LicenseModal = ({ onActivated, onBackToLogin }) => {
  const [licenseKey, setLicenseKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hwId, setHwId] = useState("Loading...");

  React.useEffect(() => {
    licenseService.getDeviceId().then((id) => setHwId(id));
  }, []);

  const handleActivate = async (e) => {
    e.preventDefault();
    if (!licenseKey.trim()) {
      setError("Silakan masukkan key lisensi.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const result = await licenseService.activateLicense(licenseKey.trim());

    if (result.success) {
      setSuccess(result.message);
      licenseService.setLocallyActivated(true);
      setTimeout(() => {
        onActivated();
      }, 1500);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="license-modal-overlay">
      <div className="license-modal-content">
        <div className="license-modal-header">
          <h2>Aktivasi Aplikasi</h2>
          <p>
            Selamat datang! Silakan masukkan key lisensi untuk mulai menggunakan
            aplikasi ini.
          </p>
        </div>

        <form onSubmit={handleActivate} className="license-modal-body">
          <div className="form-group">
            <label htmlFor="licenseKey">Key Lisensi</label>
            <input
              type="text"
              id="licenseKey"
              placeholder="Masukkan key lisensi anda"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              disabled={loading || success}
              autoFocus
            />
          </div>

          <div className="license-info-box">
            <small>
              Device Fingerprint: <code>{hwId}</code>
            </small>
            <br />
            <small>
              Status:{" "}
              {navigator.onLine
                ? "🟢 Online"
                : "🔴 Offline (Butuh internet untuk aktivasi)"}
            </small>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="license-modal-footer">
            <button
              type="button"
              className="btn-back"
              onClick={onBackToLogin}
              disabled={loading || success}
            >
              Kembali ke Login
            </button>
            <button
              type="submit"
              className="btn-activate"
              disabled={loading || success}
            >
              {loading ? "Memproses..." : "Aktivasi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LicenseModal;
