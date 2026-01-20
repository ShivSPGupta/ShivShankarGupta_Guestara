const { Item, Category, Subcategory, Addon } = require("../models");

class PricingService {
  /**
   * Get effective tax for an item (with inheritance)
   */
  static async getEffectiveTax(item) {
    // Priority 1: Check if item has tax defined
    if (item.tax_applicable !== null && item.tax_applicable !== undefined) {
      return {
        applicable: item.tax_applicable,
        percentage: item.tax_percentage || 0,
        inherited_from: "item",
      };
    }

    // Priority 2: Check subcategory
    if (item.subcategory) {
      if (
        item.subcategory.tax_applicable !== null &&
        item.subcategory.tax_applicable !== undefined
      ) {
        return {
          applicable: item.subcategory.tax_applicable,
          percentage: item.subcategory.tax_percentage || 0,
          inherited_from: "subcategory",
        };
      }

      // Priority 3: Check category through subcategory
      if (item.subcategory.category) {
        return {
          applicable: item.subcategory.category.tax_applicable || false,
          percentage: item.subcategory.category.tax_percentage || 0,
          inherited_from: "category",
        };
      }
    }

    // Priority 4: Check category directly (if item belongs to category without subcategory)
    if (item.category) {
      return {
        applicable: item.category.tax_applicable || false,
        percentage: item.category.tax_percentage || 0,
        inherited_from: "category",
      };
    }

    // Default: no tax
    return {
      applicable: false,
      percentage: 0,
      inherited_from: "default",
    };
  }

  /**
   * Calculate static pricing
   */
  static calculateStaticPrice(config) {
    return parseFloat(config.base_price || 0);
  }

  /**
   * Calculate tiered pricing based on units/duration
   */
  static calculateTieredPrice(config, units) {
    if (!config.tiers || !Array.isArray(config.tiers)) {
      throw new Error("Invalid tiered pricing configuration");
    }

    // Sort tiers by max_units ascending
    const sortedTiers = config.tiers.sort((a, b) => a.max_units - b.max_units);

    // Find the appropriate tier
    for (const tier of sortedTiers) {
      if (units <= tier.max_units) {
        return parseFloat(tier.price);
      }
    }

    // If no tier matches, use the highest tier
    const highestTier = sortedTiers[sortedTiers.length - 1];
    return parseFloat(highestTier.price);
  }

  /**
   * Calculate complimentary pricing (always 0)
   */
  static calculateComplimentaryPrice() {
    return 0;
  }

  /**
   * Calculate discounted pricing
   */
  static calculateDiscountedPrice(config) {
    const basePrice = parseFloat(config.base_price || 0);
    const discount = config.discount || {};

    let discountAmount = 0;
    let finalPrice = basePrice;

    if (discount.type === "percentage") {
      discountAmount = (basePrice * parseFloat(discount.value)) / 100;
      finalPrice = basePrice - discountAmount;
    } else if (discount.type === "flat") {
      discountAmount = parseFloat(discount.value);
      finalPrice = basePrice - discountAmount;
    }

    // Ensure price never goes negative
    finalPrice = Math.max(0, finalPrice);

    return {
      originalPrice: basePrice,
      discountType: discount.type,
      discountValue: discount.value,
      discountAmount: discountAmount,
      finalPrice: finalPrice,
    };
  }

  /**
   * Calculate dynamic pricing based on time
   */
  static calculateDynamicPrice(config, time) {
    if (!config.time_windows || !Array.isArray(config.time_windows)) {
      throw new Error("Invalid dynamic pricing configuration");
    }

    // Parse time (format: HH:MM or HH:MM:SS)
    const requestTime = this.parseTime(time);

    // Find matching time window
    for (const window of config.time_windows) {
      const startTime = this.parseTime(window.start);
      const endTime = this.parseTime(window.end);

      if (requestTime >= startTime && requestTime < endTime) {
        return parseFloat(window.price);
      }
    }

    // No matching window found
    return null; // Item not available at this time
  }

  /**
   * Parse time string to minutes since midnight
   */
  static parseTime(timeStr) {
    const parts = timeStr.split(":");
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    return hours * 60 + minutes;
  }

  /**
   * Calculate base price based on pricing type
   */
  static async calculateBasePrice(item, params = {}) {
    const config = item.pricing_config;

    switch (item.pricing_type) {
      case "static":
        return {
          basePrice: this.calculateStaticPrice(config),
          details: null,
        };

      case "tiered":
        if (!params.units && !params.duration) {
          throw new Error("Units or duration required for tiered pricing");
        }
        return {
          basePrice: this.calculateTieredPrice(
            config,
            params.units || params.duration,
          ),
          details: {
            units: params.units || params.duration,
            tier_used: this.getSelectedTier(
              config,
              params.units || params.duration,
            ),
          },
        };

      case "complimentary":
        return {
          basePrice: this.calculateComplimentaryPrice(),
          details: null,
        };

      case "discounted":
        const discountDetails = this.calculateDiscountedPrice(config);
        return {
          basePrice: discountDetails.finalPrice,
          details: {
            original_price: discountDetails.originalPrice,
            discount_type: discountDetails.discountType,
            discount_value: discountDetails.discountValue,
            discount_amount: discountDetails.discountAmount,
          },
        };

      case "dynamic":
        if (!params.time) {
          throw new Error("Time required for dynamic pricing");
        }
        const price = this.calculateDynamicPrice(config, params.time);
        if (price === null) {
          throw new Error("Item not available at the requested time");
        }
        return {
          basePrice: price,
          details: {
            requested_time: params.time,
            time_window_used: this.getTimeWindow(config, params.time),
          },
        };

      default:
        throw new Error(`Unknown pricing type: ${item.pricing_type}`);
    }
  }

  /**
   * Helper: Get selected tier for tiered pricing
   */
  static getSelectedTier(config, units) {
    if (!config.tiers || !Array.isArray(config.tiers)) return null;

    const sortedTiers = config.tiers.sort((a, b) => a.max_units - b.max_units);

    for (const tier of sortedTiers) {
      if (units <= tier.max_units) {
        return `Up to ${tier.max_units} ${tier.max_units === 1 ? "unit" : "units"}`;
      }
    }

    const highestTier = sortedTiers[sortedTiers.length - 1];
    return `Up to ${highestTier.max_units} ${highestTier.max_units === 1 ? "unit" : "units"}`;
  }

  /**
   * Helper: Get time window for dynamic pricing
   */
  static getTimeWindow(config, time) {
    if (!config.time_windows || !Array.isArray(config.time_windows))
      return null;

    const requestTime = this.parseTime(time);

    for (const window of config.time_windows) {
      const startTime = this.parseTime(window.start);
      const endTime = this.parseTime(window.end);

      if (requestTime >= startTime && requestTime < endTime) {
        return `${window.start} - ${window.end}`;
      }
    }

    return null;
  }

  /**
   * Calculate addons total
   */
  static async calculateAddonsTotal(addonIds) {
    if (!addonIds || addonIds.length === 0) {
      return 0;
    }

    const addons = await Addon.findAll({
      where: {
        id: addonIds,
        is_active: true,
      },
    });

    return addons.reduce((total, addon) => {
      return total + parseFloat(addon.price);
    }, 0);
  }

  /**
   * Main method: Calculate complete price breakdown
   */
  static async calculatePrice(itemId, params = {}) {
    // Fetch item with relationships
    const item = await Item.findByPk(itemId, {
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "tax_applicable", "tax_percentage"],
        },
        {
          model: Subcategory,
          as: "subcategory",
          attributes: ["id", "name", "tax_applicable", "tax_percentage"],
          include: [
            {
              model: Category,
              as: "category",
              attributes: ["id", "name", "tax_applicable", "tax_percentage"],
            },
          ],
        },
        {
          model: Addon,
          as: "addons",
          where: { is_active: true },
          required: false,
        },
      ],
    });

    if (!item) {
      throw new Error("Item not found");
    }

    if (!item.is_active) {
      throw new Error("Item is not active");
    }

    // Calculate base price
    const priceResult = await this.calculateBasePrice(item, params);
    const basePrice = priceResult.basePrice;
    const pricingDetails = priceResult.details;

    // Calculate addons total
    const addonIds = params.addons || [];
    const addonsTotal = await this.calculateAddonsTotal(addonIds);

    // Get addon details
    let selectedAddons = [];
    if (addonIds.length > 0) {
      selectedAddons = await Addon.findAll({
        where: { id: addonIds, is_active: true },
        attributes: ["id", "name", "price"],
      });
    }

    // Calculate subtotal
    const subtotal = basePrice + addonsTotal;

    // Get effective tax
    const taxInfo = await this.getEffectiveTax(item);
    const taxAmount = taxInfo.applicable
      ? (subtotal * taxInfo.percentage) / 100
      : 0;

    // Calculate grand total
    const grandTotal = subtotal + taxAmount;

    // Build response
    const breakdown = {
      pricing_type: item.pricing_type,
      base_price: parseFloat(basePrice.toFixed(2)),
      addons: selectedAddons.map((a) => ({
        id: a.id,
        name: a.name,
        price: parseFloat(a.price),
      })),
      addons_total: parseFloat(addonsTotal.toFixed(2)),
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: {
        applicable: taxInfo.applicable,
        percentage: taxInfo.percentage,
        amount: parseFloat(taxAmount.toFixed(2)),
        inherited_from: taxInfo.inherited_from,
      },
      grand_total: parseFloat(grandTotal.toFixed(2)),
    };

    // Add pricing-specific details
    if (pricingDetails) {
      breakdown.pricing_details = pricingDetails;
    }

    return {
      item_id: item.id,
      item_name: item.name,
      pricing_breakdown: breakdown,
    };
  }
}

module.exports = PricingService;
