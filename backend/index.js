const express = require("express");
const cors = require("cors");
const db = require("./db"); // Import the database connection

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import Routes
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const productRoutes = require("./routes/products");
const categoryRoutes = require("./routes/categories");
const pelangganRoutes = require("./routes/pelanggan");
const transaksiRoutes = require("./routes/transaksi");
const inventoryRoutes = require("./routes/inventory");
const settingsRoutes = require("./routes/settings");
const reportsRoutes = require("./routes/reports");

// Use Routes
app.use("/api", authRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", productRoutes);
app.use("/api", categoryRoutes);
app.use("/api", pelangganRoutes);
app.use("/api", transaksiRoutes);
app.use("/api", inventoryRoutes);
app.use("/api", settingsRoutes);
app.use("/api", reportsRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res
    .status(500)
    .json({ error: "Internal server error", details: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app; // Export app for potential testing
