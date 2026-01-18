const express = require("express");
const CategoryController = require("../controllers/categoryController");
const ItemController = require("../controllers/itemController");
const BookingController = require("../controllers/bookingController");
const validate = require("../middleware/validate");

// Import validation schemas
const {
  createCategorySchema,
  updateCategorySchema,
  querySchema: categoryQuerySchema,
} = require("../validators/categoryValidator");

const {
  createItemSchema,
  updateItemSchema,
  priceQuerySchema,
  itemQuerySchema,
} = require("../validators/itemValidator");

const {
  createBookingSchema,
  availableSlotsQuerySchema,
} = require("../validators/bookingValidator");

const router = express.Router();

// ============ Category Routes ============
router.get(
  "/categories",
  validate(categoryQuerySchema, "query"),
  CategoryController.getAll
);

router.get("/categories/:id", CategoryController.getById);

router.post(
  "/categories",
  validate(createCategorySchema),
  CategoryController.create
);

router.put(
  "/categories/:id",
  validate(updateCategorySchema),
  CategoryController.update
);

router.delete("/categories/:id", CategoryController.delete);

// ============ Item Routes ============
router.get("/items", validate(itemQuerySchema, "query"), ItemController.getAll);

router.get("/items/:id", ItemController.getById);

router.post("/items", validate(createItemSchema), ItemController.create);

router.put("/items/:id", validate(updateItemSchema), ItemController.update);

router.delete("/items/:id", ItemController.delete);

// Price calculation endpoint with validation
router.get(
  "/items/:id/price",
  validate(priceQuerySchema, "query"),
  ItemController.calculatePrice
);

// ============ Booking Routes ============
// Get available slots for an item
router.get(
  "/items/:id/available-slots",
  validate(availableSlotsQuerySchema, "query"),
  BookingController.getAvailableSlots
);

// Booking CRUD
router.post(
  "/bookings",
  validate(createBookingSchema),
  BookingController.create
);

router.get("/bookings/:id", BookingController.getById);

router.patch("/bookings/:id/cancel", BookingController.cancel);

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
