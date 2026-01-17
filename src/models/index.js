const Category = require("./Category");
const Subcategory = require("./Subcategory");
const Item = require("./Item");
const Addon = require("./Addon");
const Booking = require("./Booking");

// Define associations

// Category has many Subcategories
Category.hasMany(Subcategory, {
  foreignKey: "category_id",
  as: "subcategories",
  onDelete: "RESTRICT", // Prevent delete if subcategories exist
});
Subcategory.belongsTo(Category, {
  foreignKey: "category_id",
  as: "category",
});

// Category has many Items (direct)
Category.hasMany(Item, {
  foreignKey: "category_id",
  as: "items",
  onDelete: "RESTRICT",
});
Item.belongsTo(Category, {
  foreignKey: "category_id",
  as: "category",
});

// Subcategory has many Items
Subcategory.hasMany(Item, {
  foreignKey: "subcategory_id",
  as: "items",
  onDelete: "RESTRICT",
});
Item.belongsTo(Subcategory, {
  foreignKey: "subcategory_id",
  as: "subcategory",
});

// Item has many Addons
Item.hasMany(Addon, {
  foreignKey: "item_id",
  as: "addons",
  onDelete: "CASCADE", // Delete addons when item is deleted
});
Addon.belongsTo(Item, {
  foreignKey: "item_id",
  as: "item",
});

// Item has many Bookings
Item.hasMany(Booking, {
  foreignKey: "item_id",
  as: "bookings",
  onDelete: "RESTRICT",
});
Booking.belongsTo(Item, {
  foreignKey: "item_id",
  as: "item",
});

module.exports = {
  Category,
  Subcategory,
  Item,
  Addon,
  Booking,
};
