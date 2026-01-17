const { Booking, Item } = require("../models");
const { sequelize } = require("../config/database");
const { Op } = require("sequelize");

class BookingService {
  /**
   * Check if two time ranges overlap
   */
  static timesOverlap(start1, end1, start2, end2) {
    return start1 < end2 && end1 > start2;
  }

  /**
   * Check if a time slot is available
   */
  static async checkAvailability(itemId, bookingDate, startTime, endTime) {
    // Get existing bookings for this item on this date
    const existingBookings = await Booking.findAll({
      where: {
        item_id: itemId,
        booking_date: bookingDate,
        status: {
          [Op.in]: ["pending", "confirmed"],
        },
      },
    });

    // Check for conflicts
    for (const booking of existingBookings) {
      if (
        this.timesOverlap(
          startTime,
          endTime,
          booking.start_time,
          booking.end_time
        )
      ) {
        return {
          available: false,
          conflicting_booking: {
            id: booking.id,
            start_time: booking.start_time,
            end_time: booking.end_time,
          },
        };
      }
    }

    return { available: true };
  }

  /**
   * Validate booking against item's availability config
   */
  static validateItemAvailability(item, bookingDate, startTime, endTime) {
    if (!item.is_bookable) {
      throw new Error("This item is not bookable");
    }

    if (!item.availability_config) {
      return true; // No restrictions
    }

    const config = item.availability_config;
    const date = new Date(bookingDate);
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });

    // Check if day is available
    if (config.days && Array.isArray(config.days)) {
      if (!config.days.includes(dayName)) {
        throw new Error(`Item not available on ${dayName}`);
      }
    }

    // Check if time is within allowed slots
    if (config.time_slots && Array.isArray(config.time_slots)) {
      let withinSlot = false;

      for (const slot of config.time_slots) {
        if (startTime >= slot.start && endTime <= slot.end) {
          withinSlot = true;
          break;
        }
      }

      if (!withinSlot) {
        throw new Error(
          `Requested time ${startTime}-${endTime} is outside available slots`
        );
      }
    }

    return true;
  }

  /**
   * Create a new booking with conflict checking
   */
  static async createBooking(bookingData) {
    return await sequelize.transaction(async (t) => {
      // Fetch item
      const item = await Item.findByPk(bookingData.item_id, { transaction: t });

      if (!item) {
        throw new Error("Item not found");
      }

      if (!item.is_active) {
        throw new Error("Item is not active");
      }

      // Validate item availability config
      this.validateItemAvailability(
        item,
        bookingData.booking_date,
        bookingData.start_time,
        bookingData.end_time
      );

      // Lock existing bookings to prevent race condition
      const existingBookings = await Booking.findAll({
        where: {
          item_id: bookingData.item_id,
          booking_date: bookingData.booking_date,
          status: {
            [Op.in]: ["pending", "confirmed"],
          },
        },
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      // Check for conflicts
      for (const booking of existingBookings) {
        if (
          this.timesOverlap(
            bookingData.start_time,
            bookingData.end_time,
            booking.start_time,
            booking.end_time
          )
        ) {
          throw new Error("Time slot already booked");
        }
      }

      // Create booking
      const booking = await Booking.create(bookingData, { transaction: t });

      return booking;
    });
  }

  /**
   * Get available slots for an item on a specific date
   */
  static async getAvailableSlots(itemId, date) {
    // Fetch item with availability config
    const item = await Item.findByPk(itemId);

    if (!item) {
      throw new Error("Item not found");
    }

    if (!item.is_bookable) {
      throw new Error("This item is not bookable");
    }

    // Get day name
    const dateObj = new Date(date);
    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });

    // Check if item is available on this day
    const config = item.availability_config;
    if (config && config.days && !config.days.includes(dayName)) {
      return {
        date,
        day: dayName,
        available: false,
        message: `Item not available on ${dayName}`,
        slots: [],
      };
    }

    // Get time slots
    let timeSlots = [];
    if (config && config.time_slots) {
      timeSlots = config.time_slots;
    } else {
      // Default: 9 AM to 6 PM
      timeSlots = [{ start: "09:00", end: "18:00" }];
    }

    // Get existing bookings
    const bookings = await Booking.findAll({
      where: {
        item_id: itemId,
        booking_date: date,
        status: {
          [Op.in]: ["pending", "confirmed"],
        },
      },
      order: [["start_time", "ASC"]],
    });

    return {
      date,
      day: dayName,
      available: true,
      time_slots: timeSlots,
      booked_slots: bookings.map((b) => ({
        start_time: b.start_time,
        end_time: b.end_time,
        booking_id: b.id,
      })),
    };
  }

  /**
   * Cancel a booking
   */
  static async cancelBooking(bookingId) {
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.status === "cancelled") {
      throw new Error("Booking already cancelled");
    }

    booking.status = "cancelled";
    await booking.save();

    return booking;
  }

  /**
   * Get booking details
   */
  static async getBooking(bookingId) {
    const booking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: Item,
          as: "item",
          attributes: ["id", "name", "description"],
        },
      ],
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    return booking;
  }
}

module.exports = BookingService;
