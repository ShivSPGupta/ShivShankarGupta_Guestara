require("dotenv").config();
const { sequelize } = require("../config/database");
const models = require("../models");

async function migrate() {
  try {
    console.log("🔄 Starting database migration...");

    await sequelize.authenticate();
    console.log("✅ Database connection established");

    // Drop all tables and recreate (use with caution!)
    // await sequelize.sync({ force: true });

    // Create tables if they don't exist
    await sequelize.sync({ alter: true });

    console.log("✅ Database migration completed successfully");
    console.log("\nTables created:");
    console.log("  - categories");
    console.log("  - subcategories");
    console.log("  - items");
    console.log("  - addons");
    console.log("  - bookings");

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrate();
