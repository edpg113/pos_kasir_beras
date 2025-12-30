import { supabase } from "./supabaseClient";

// Detect if running in Electron environment
const isElectron = typeof window !== "undefined" && window.require;
const ipcRenderer = isElectron ? window.require("electron").ipcRenderer : null;

const GRACE_PERIOD_DAYS = 60;

export const licenseService = {
  /**
   * Gets the unique hardware-bound device ID.
   */
  getDeviceId: async () => {
    if (!ipcRenderer) {
      // Fallback for browser dev mode
      console.warn("Running in browser mode, using mock device ID");
      return "browser-dev-mock-id";
    }
    return await ipcRenderer.invoke("get-machine-id");
  },

  /**
   * Verifies and activates a license key.
   */
  activateLicense: async (licenseKey) => {
    try {
      const deviceId = await licenseService.getDeviceId();

      // 1. Check if key exists in Supabase
      const { data: license, error: fetchError } = await supabase
        .from("licenses")
        .select("*")
        .eq("license_key", licenseKey)
        .single();

      if (fetchError || !license) {
        return {
          success: false,
          message: "Key lisensi tidak valid atau tidak ditemukan.",
        };
      }

      // 2. Validate Binding & Status
      if (license.status === "blocked") {
        return { success: false, message: "Key lisensi ini telah diblokir." };
      }

      if (license.status === "active" && license.device_id !== deviceId) {
        return {
          success: false,
          message: "Key lisensi ini sudah aktif di perangkat lain.",
        };
      }

      // 3. Activate/Sync on Supabase
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("licenses")
        .update({
          status: "active",
          device_id: deviceId,
          activated_at: license.activated_at || now,
          last_verified_at: now,
        })
        .eq("license_key", licenseKey);

      if (updateError) {
        return { success: false, message: "Gagal sinkronisasi ke server." };
      }

      // 4. Save Securely to Local Disk
      const localData = {
        license_key: licenseKey,
        device_id: deviceId,
        last_verified: now,
        status: "active",
      };

      if (ipcRenderer) {
        await ipcRenderer.invoke("secure-save-license", localData);
      } else {
        // Browser fallback: use localStorage (less secure)
        console.warn("Browser mode: storing license in localStorage");
        localStorage.setItem("pos_license_data", JSON.stringify(localData));
      }
      localStorage.setItem("pos_activated", "true");

      return { success: true, message: "Aktivasi berhasil!" };
    } catch (err) {
      console.error("Activation Error:", err);
      return { success: false, message: "Terjadi kesalahan sistem." };
    }
  },

  /**
   * Comprehensive license health check (Online & Offline).
   */
  validateServerActivation: async () => {
    try {
      const deviceId = await licenseService.getDeviceId();

      // Get local license with fallback for browser mode
      let localLicense = null;
      if (ipcRenderer) {
        localLicense = await ipcRenderer.invoke("secure-get-license");
      } else {
        // Browser fallback: read from localStorage
        const stored = localStorage.getItem("pos_license_data");
        if (stored) {
          try {
            localLicense = JSON.parse(stored);
          } catch (e) {
            console.error("Failed to parse license data:", e);
          }
        }
      }

      // --- ONLINE CHECK ---
      if (navigator.onLine) {
        if (!localLicense) {
          localStorage.removeItem("pos_activated");
          return false;
        }

        const { data, error } = await supabase
          .from("licenses")
          .select("status, device_id")
          .eq("license_key", localLicense.license_key)
          .single();

        if (
          error ||
          !data ||
          data.status !== "active" ||
          data.device_id !== deviceId
        ) {
          // Lock app if server says no
          localStorage.removeItem("pos_activated");
          return false;
        }

        // Sync local verified date
        const now = new Date().toISOString();
        await supabase
          .from("licenses")
          .update({ last_verified_at: now })
          .eq("license_key", localLicense.license_key);

        localLicense.last_verified = now;
        if (ipcRenderer) {
          await ipcRenderer.invoke("secure-save-license", localLicense);
        } else {
          localStorage.setItem(
            "pos_license_data",
            JSON.stringify(localLicense)
          );
        }
        localStorage.setItem("pos_activated", "true");
        return true;
      }

      // --- OFFLINE CHECK ---
      if (!localLicense) {
        localStorage.removeItem("pos_activated");
        return false;
      }

      // Validate binding locally
      if (
        localLicense.device_id !== deviceId ||
        localLicense.status !== "active"
      ) {
        localStorage.removeItem("pos_activated");
        return false;
      }

      // Check Grace Period
      const lastVerified = new Date(localLicense.last_verified);
      const now = new Date();
      const diffTime = Math.abs(now - lastVerified);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > GRACE_PERIOD_DAYS) {
        console.warn("Offline limit exceeded");
        return false; // Force online activation/sync
      }

      return true;
    } catch (err) {
      console.error("Validation error:", err);
      return localStorage.getItem("pos_activated") === "true"; // Emergency fallback
    }
  },

  isLocallyActivated: () => {
    return localStorage.getItem("pos_activated") === "true";
  },

  setLocallyActivated: (status) => {
    if (status) {
      localStorage.setItem("pos_activated", "true");
    } else {
      localStorage.removeItem("pos_activated");
      if (ipcRenderer) {
        ipcRenderer.invoke("secure-save-license", null); // Clear secure storage too
      } else {
        localStorage.removeItem("pos_license_data"); // Clear browser fallback
      }
    }
  },
};
