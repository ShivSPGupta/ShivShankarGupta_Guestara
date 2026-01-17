const { Item, Category, Subcategory, Addon } = require("../models");
const PricingService = require("../services/pricingService");
const { Op } = require("sequelize");

class ItemController {
  // Get all items with filters, search, pagination
  static async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "name",
        order = "ASC",
        search = "",
        category_id = null,
        subcategory_id = null,
        pricing_type = null,
        active = null,
        min_price = null,
        max_price = null,
      } = req.query;

      const offset = (page - 1) * limit;

      // Build where clause
      const where = {};

      if (search) {
        where.name = {
          [Op.iLike]: `%${search}%`,
        };
      }

      if (category_id) {
        where.category_id = category_id;
      }

      if (subcategory_id) {
        where.subcategory_id = subcategory_id;
      }

      if (pricing_type) {
        where.pricing_type = pricing_type;
      }

      if (active !== null) {
        where.is_active = active === "true";
      }

      // Price filtering (for static pricing only)
      if (min_price || max_price) {
        where.pricing_type = "static";
        where["pricing_config.base_price"] = {};

        if (min_price) {
          where["pricing_config.base_price"][Op.gte] = parseFloat(min_price);
        }
        if (max_price) {
          where["pricing_config.base_price"][Op.lte] = parseFloat(max_price);
        }
      }

      // Fetch items
      const { count, rows } = await Item.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, order.toUpperCase()]],
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

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get single item by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const item = await Item.findByPk(id, {
        include: [
          { model: Category, as: "category" },
          {
            model: Subcategory,
            as: "subcategory",
            include: [{ model: Category, as: "category" }],
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
        return res.status(404).json({
          success: false,
          error: "Item not found",
        });
      }

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Create new item
  static async create(req, res) {
    try {
      const itemData = req.body;

      const item = await Item.create(itemData);

      // If addons are provided, create them
      if (itemData.addons && Array.isArray(itemData.addons)) {
        const addons = itemData.addons.map((addon) => ({
          ...addon,
          item_id: item.id,
        }));
        await Addon.bulkCreate(addons);
      }

      // Fetch complete item with relations
      const completeItem = await Item.findByPk(item.id, {
        include: [
          { model: Category, as: "category" },
          { model: Subcategory, as: "subcategory" },
          { model: Addon, as: "addons" },
        ],
      });

      res.status(201).json({
        success: true,
        data: completeItem,
        message: "Item created successfully",
      });
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        return res.status(400).json({
          success: false,
          error: "Validation error",
          details: error.errors.map((e) => ({
            field: e.path,
            message: e.message,
          })),
        });
      }

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Update item
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const item = await Item.findByPk(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          error: "Item not found",
        });
      }

      await item.update(updateData);

      // Fetch updated item with relations
      const updatedItem = await Item.findByPk(id, {
        include: [
          { model: Category, as: "category" },
          { model: Subcategory, as: "subcategory" },
          { model: Addon, as: "addons" },
        ],
      });

      res.json({
        success: true,
        data: updatedItem,
        message: "Item updated successfully",
      });
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        return res.status(400).json({
          success: false,
          error: "Validation error",
          details: error.errors.map((e) => ({
            field: e.path,
            message: e.message,
          })),
        });
      }

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Soft delete item
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const item = await Item.findByPk(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          error: "Item not found",
        });
      }

      await item.update({ is_active: false });

      res.json({
        success: true,
        message: "Item deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Calculate item price
  static async calculatePrice(req, res) {
    try {
      const { id } = req.params;
      const params = req.query;

      // Parse addons if provided as comma-separated string
      if (params.addons && typeof params.addons === "string") {
        params.addons = params.addons.split(",").map((id) => parseInt(id));
      }

      const priceBreakdown = await PricingService.calculatePrice(id, params);

      res.json({
        success: true,
        data: priceBreakdown,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = ItemController;
