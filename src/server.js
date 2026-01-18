require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { sequelize, testConnection } = require("./config/database");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api", routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Sync database (create tables if they don't exist)
    await sequelize.sync({ alter: false });
    console.log("✅ Database synchronized");

    // Start listening
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════╗
║   🚀 Menu Management Backend Server Running   ║
║                                                ║
║   Port: ${PORT}                                   ║
║   Environment: ${process.env.NODE_ENV || "development"}                   ║
║   Database: ${process.env.DB_NAME}                   ║
║                                                ║
║   API Docs: http://localhost:${PORT}/api/health   ║
╚════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
