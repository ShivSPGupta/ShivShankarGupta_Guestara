const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Subcategory = sequelize.define(
  "Subcategory",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "categories",
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Subcategory name cannot be empty" },
      },
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tax_applicable: {
      type: DataTypes.BOOLEAN,
      allowNull: true, // Nullable means inherit from category
    },
    tax_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: { args: [0], msg: "Tax percentage cannot be negative" },
        max: { args: [100], msg: "Tax percentage cannot exceed 100" },
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "subcategories",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["category_id"] },
      { fields: ["name", "category_id"], unique: true },
      { fields: ["is_active"] },
    ],
  }
);

module.exports = Subcategory;
