const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { machineIdSync } = require("node-machine-id");
const { spawn } = require("child_process");

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    show: false, // Don't show immediately to prevent focus loss
    backgroundColor: "#ffffff",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      // Enable hardware acceleration for better rendering
      offscreen: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.maximize(); // Maximize window on startup
    mainWindow.show();
    mainWindow.focus();

    // Force a repaint after showing to ensure proper rendering
    setTimeout(() => {
      if (mainWindow) {
        mainWindow.webContents.send("window-ready");
      }
    }, 100);
  });

  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    // Open DevTools in dev mode
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "frontend/dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function startBackend() {
  const backendPath = path.join(__dirname, "backend/index.js");

  // Use 'node' to run the backend script
  backendProcess = spawn("node", [backendPath], {
    stdio: "inherit",
    env: { ...process.env, PORT: 5000 }, // Ensure it runs on 5000 as expected by frontend
  });

  backendProcess.on("error", (err) => {
    console.error("Failed to start backend:", err);
  });

  backendProcess.on("exit", (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

app.on("ready", () => {
  startBackend();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("quit", () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// --- License & Security IPC Handlers ---

const LICENSE_PATH = path.join(app.getPath("userData"), "license_config.dat");

// Function to get a encryption key derived from machine ID
function getSecretKey() {
  const mId = machineIdSync();
  return crypto
    .createHash("sha256")
    .update(mId + "pos-secure-salt")
    .digest();
}

ipcMain.handle("get-machine-id", async () => {
  return machineIdSync();
});

ipcMain.handle("secure-save-license", async (event, licenseData) => {
  try {
    const secretKey = getSecretKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-gcm", secretKey, iv);

    const text = JSON.stringify(licenseData);
    const encrypted = Buffer.concat([
      cipher.update(text, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    const dataToSave = Buffer.concat([iv, tag, encrypted]).toString("base64");
    fs.writeFileSync(LICENSE_PATH, dataToSave);
    return { success: true };
  } catch (error) {
    console.error("Encryption error:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("secure-get-license", async () => {
  try {
    if (!fs.existsSync(LICENSE_PATH)) return null;

    const savedData = fs.readFileSync(LICENSE_PATH, "utf8");
    const buffer = Buffer.from(savedData, "base64");

    const iv = buffer.subarray(0, 16);
    const tag = buffer.subarray(16, 32);
    const encrypted = buffer.subarray(32);

    const secretKey = getSecretKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", secretKey, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return JSON.parse(decrypted.toString("utf8"));
  } catch (error) {
    console.error("Decryption error:", error);
    return null; // Return null if tampering or key mismatch detected
  }
});
