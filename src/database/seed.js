require("dotenv").config();
const { Category, Subcategory, Item, Addon } = require("../models");

async function seed() {
  try {
    console.log("🌱 Seeding database...");

    // Check if data already exists
    const existingCategories = await Category.count();
    if (existingCategories > 0) {
      console.log("⚠️  Database already has data. Skipping seed.");
      console.log(`   Found ${existingCategories} categories.`);
      console.log("   To re-seed, first run: docker-compose down -v");
      process.exit(0);
    }

    // Create Categories
    const beverages = await Category.create({
      name: "Beverages",
      description: "Hot and cold beverages",
      tax_applicable: true,
      tax_percentage: 5,
      is_active: true,
    });

    const rooms = await Category.create({
      name: "Meeting Rooms",
      description: "Conference and meeting spaces",
      tax_applicable: true,
      tax_percentage: 18,
      is_active: true,
    });

    const food = await Category.create({
      name: "Food",
      description: "Main course and snacks",
      tax_applicable: true,
      tax_percentage: 10,
      is_active: true,
    });

    console.log("✅ Categories created");

    // Create Subcategories
    const hotDrinks = await Subcategory.create({
      category_id: beverages.id,
      name: "Hot Drinks",
      description: "Coffee, tea, and hot beverages",
    });

    const coldDrinks = await Subcategory.create({
      category_id: beverages.id,
      name: "Cold Drinks",
      description: "Iced beverages and smoothies",
      tax_applicable: true, // ← Must set this to true!
      tax_percentage: 8, // Override parent tax
    });

    const breakfast = await Subcategory.create({
      category_id: food.id,
      name: "Breakfast",
      description: "Morning breakfast items",
    });

    console.log("✅ Subcategories created");

    // Create Items

    // 1. Static Pricing - Coffee
    const cappuccino = await Item.create({
      subcategory_id: hotDrinks.id,
      name: "Cappuccino",
      description: "Rich espresso with steamed milk",
      pricing_type: "static",
      pricing_config: {
        base_price: 200,
      },
      is_active: true,
    });

    // Add-ons for coffee
    await Addon.bulkCreate([
      {
        item_id: cappuccino.id,
        name: "Extra shot",
        price: 50,
        is_mandatory: false,
      },
      {
        item_id: cappuccino.id,
        name: "Oat milk",
        price: 40,
        is_mandatory: false,
      },
    ]);

    // 2. Tiered Pricing - Meeting Room
    const conferenceRoom = await Item.create({
      category_id: rooms.id,
      name: "Conference Room A",
      description: "Large conference room with projector",
      pricing_type: "tiered",
      pricing_config: {
        tiers: [
          { max_units: 1, price: 300 },
          { max_units: 2, price: 500 },
          { max_units: 4, price: 800 },
        ],
      },
      is_bookable: true,
      availability_config: {
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        time_slots: [{ start: "09:00", end: "18:00" }],
      },
      is_active: true,
    });

    await Addon.bulkCreate([
      {
        item_id: conferenceRoom.id,
        name: "Projector",
        price: 100,
        is_mandatory: false,
      },
      {
        item_id: conferenceRoom.id,
        name: "Whiteboard",
        price: 50,
        is_mandatory: false,
      },
    ]);

    // 3. Dynamic Pricing - Breakfast Combo
    const breakfastCombo = await Item.create({
      subcategory_id: breakfast.id,
      name: "Breakfast Combo",
      description: "Eggs, toast, and coffee",
      pricing_type: "dynamic",
      pricing_config: {
        time_windows: [
          { start: "08:00", end: "11:00", price: 199 },
          { start: "11:00", end: "14:00", price: 249 },
        ],
      },
      is_active: true,
    });

    // 4. Complimentary Item
    await Item.create({
      subcategory_id: coldDrinks.id,
      name: "Welcome Drink",
      description: "Complimentary welcome beverage",
      pricing_type: "complimentary",
      pricing_config: {},
      is_active: true,
    });

    // 5. Discounted Item
    const icedCoffee = await Item.create({
      subcategory_id: coldDrinks.id,
      name: "Iced Coffee",
      description: "Cold brew coffee with ice",
      pricing_type: "discounted",
      pricing_config: {
        base_price: 250,
        discount: {
          type: "percentage",
          value: 20,
        },
      },
      is_active: true,
    });

    console.log("✅ Items created");
    console.log("✅ Add-ons created");

    console.log("\n📊 Sample Data Summary:");
    console.log(`  - Categories: 3`);
    console.log(`  - Subcategories: 3`);
    console.log(`  - Items: 5`);
    console.log(`  - Add-ons: 4`);

    console.log("\n✅ Database seeding completed successfully!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
