const BookingService = require("../services/bookingService");
const PricingService = require("../services/pricingService");

class BookingController {
  // Get available slots for an item
  static async getAvailableSlots(req, res) {
    try {
      const { id } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          error: "Date parameter is required",
        });
      }

      const slots = await BookingService.getAvailableSlots(id, date);

      res.json({
        success: true,
        data: slots,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Create a new booking
  static async create(req, res) {
    try {
      const bookingData = req.body;

      // Calculate price first
      const duration = calculateDuration(
        bookingData.start_time,
        bookingData.end_time
      );

      const priceParams = {
        duration: duration,
        time: bookingData.start_time,
        addons: bookingData.addons || [],
      };

      const priceBreakdown = await PricingService.calculatePrice(
        bookingData.item_id,
        priceParams
      );

      // Prepare booking data with pricing
      const completeBookingData = {
        ...bookingData,
        base_price: priceBreakdown.pricing_breakdown.base_price,
        addons_total: priceBreakdown.pricing_breakdown.addons_total,
        tax_amount: priceBreakdown.pricing_breakdown.tax.amount,
        grand_total: priceBreakdown.pricing_breakdown.grand_total,
      };

      // Create booking
      const booking = await BookingService.createBooking(completeBookingData);

      res.status(201).json({
        success: true,
        data: booking,
        pricing: priceBreakdown.pricing_breakdown,
        message: "Booking created successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get booking by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const booking = await BookingService.getBooking(id);

      res.json({
        success: true,
        data: booking,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Cancel booking
  static async cancel(req, res) {
    try {
      const { id } = req.params;

      const booking = await BookingService.cancelBooking(id);

      res.json({
        success: true,
        data: booking,
        message: "Booking cancelled successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
}

// Helper function to calculate duration in hours
function calculateDuration(startTime, endTime) {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return (endMinutes - startMinutes) / 60;
}

module.exports = BookingController;
