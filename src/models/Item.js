const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Item = sequelize.define(
  "Item",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "categories",
        key: "id",
      },
    },
    subcategory_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "subcategories",
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Item name cannot be empty" },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    pricing_type: {
      type: DataTypes.ENUM(
        "static",
        "tiered",
        "complimentary",
        "discounted",
        "dynamic"
      ),
      allowNull: false,
      validate: {
        isIn: {
          args: [
            ["static", "tiered", "complimentary", "discounted", "dynamic"],
          ],
          msg: "Invalid pricing type",
        },
      },
    },
    pricing_config: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    tax_applicable: {
      type: DataTypes.BOOLEAN,
      allowNull: true, // Nullable means inherit
    },
    tax_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: { args: [0], msg: "Tax percentage cannot be negative" },
        max: { args: [100], msg: "Tax percentage cannot exceed 100" },
      },
    },
    is_bookable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    availability_config: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
      // Format: { days: ['Monday', 'Tuesday'], time_slots: [{start: '09:00', end: '18:00'}] }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "items",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["category_id"] },
      { fields: ["subcategory_id"] },
      { fields: ["is_active"] },
      { fields: ["pricing_type"] },
    ],
    validate: {
      // Ensure item belongs to either category OR subcategory, not both
      eitherCategoryOrSubcategory() {
        if (this.category_id && this.subcategory_id) {
          throw new Error(
            "Item cannot belong to both category and subcategory"
          );
        }
        if (!this.category_id && !this.subcategory_id) {
          throw new Error("Item must belong to either category or subcategory");
        }
      },
    },
  }
);

module.exports = Item;
