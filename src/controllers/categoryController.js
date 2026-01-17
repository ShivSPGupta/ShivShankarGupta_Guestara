const { Category, Subcategory, Item } = require("../models");
const { Op } = require("sequelize");

class CategoryController {
  // Get all categories with pagination, filtering, and sorting
  static async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "name",
        order = "ASC",
        search = "",
        active = null,
      } = req.query;

      const offset = (page - 1) * limit;

      // Build where clause
      const where = {};

      if (search) {
        where.name = {
          [Op.iLike]: `%${search}%`,
        };
      }

      if (active !== null) {
        where.is_active = active === "true";
      }

      // Fetch categories
      const { count, rows } = await Category.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, order.toUpperCase()]],
        include: [
          {
            model: Subcategory,
            as: "subcategories",
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

  // Get single category by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const category = await Category.findByPk(id, {
        include: [
          {
            model: Subcategory,
            as: "subcategories",
            include: [
              {
                model: Item,
                as: "items",
                where: { is_active: true },
                required: false,
              },
            ],
          },
          {
            model: Item,
            as: "items",
            where: { is_active: true },
            required: false,
          },
        ],
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          error: "Category not found",
        });
      }

      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Create new category
  static async create(req, res) {
    try {
      const categoryData = req.body;

      const category = await Category.create(categoryData);

      res.status(201).json({
        success: true,
        data: category,
        message: "Category created successfully",
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

      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({
          success: false,
          error: "Category name already exists",
        });
      }

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Update category
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const category = await Category.findByPk(id);

      if (!category) {
        return res.status(404).json({
          success: false,
          error: "Category not found",
        });
      }

      await category.update(updateData);

      res.json({
        success: true,
        data: category,
        message: "Category updated successfully",
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

  // Soft delete category
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const category = await Category.findByPk(id);

      if (!category) {
        return res.status(404).json({
          success: false,
          error: "Category not found",
        });
      }

      // Soft delete
      await category.update({ is_active: false });

      res.json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = CategoryController;
