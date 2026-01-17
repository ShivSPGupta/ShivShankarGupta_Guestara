const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Category = sequelize.define(
  "Category",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: "Category name cannot be empty" },
        len: {
          args: [2, 255],
          msg: "Category name must be between 2 and 255 characters",
        },
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
      allowNull: false,
      defaultValue: false,
    },
    tax_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: { args: [0], msg: "Tax percentage cannot be negative" },
        max: { args: [100], msg: "Tax percentage cannot exceed 100" },
        isValidTax(value) {
          if (this.tax_applicable && (value === null || value === undefined)) {
            throw new Error(
              "Tax percentage is required when tax is applicable"
            );
          }
        },
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "categories",
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ["name"] }, { fields: ["is_active"] }],
  }
);

module.exports = Category;
