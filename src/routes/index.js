const express = require("express");
const CategoryController = require("../controllers/categoryController");
const ItemController = require("../controllers/itemController");
const BookingController = require("../controllers/bookingController");

const router = express.Router();

// ============ Category Routes ============
router.get("/categories", CategoryController.getAll);
router.get("/categories/:id", CategoryController.getById);
router.post("/categories", CategoryController.create);
router.put("/categories/:id", CategoryController.update);
router.delete("/categories/:id", CategoryController.delete);

// ============ Item Routes ============
router.get("/items", ItemController.getAll);
router.get("/items/:id", ItemController.getById);
router.post("/items", ItemController.create);
router.put("/items/:id", ItemController.update);
router.delete("/items/:id", ItemController.delete);

// Price calculation endpoint
router.get("/items/:id/price", ItemController.calculatePrice);

// ============ Booking Routes ============
// Get available slots for an item
router.get("/items/:id/available-slots", BookingController.getAvailableSlots);

// Booking CRUD
router.post("/bookings", BookingController.create);
router.get("/bookings/:id", BookingController.getById);
router.patch("/bookings/:id/cancel", BookingController.cancel);

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

module.exports = router;
