// seeders/migrateJsonItemsToOrderItems.js
// This script migrates existing orders from JSON items format to the new OrderItem table structure

const sequelize = require("../config/database");
const { Order, OrderItem } = require("../models");

const migrateJsonItemsToOrderItems = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log("🔄 Starting migration of JSON items to OrderItem table...");

    const [columns] = await sequelize.query("SHOW COLUMNS FROM orders LIKE 'items'", { transaction });
    if (!columns.length) {
      console.log("⚠️  No legacy 'items' column found on orders. Nothing to migrate.");
      await transaction.rollback();
      process.exit(0);
    }

    // Get all orders with legacy items content
    const [orders] = await sequelize.query("SELECT id, items FROM orders", { transaction });
    console.log(`📦 Found ${orders.length} orders to process`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const order of orders) {
      try {
        // Check if this order already has OrderItems (migration already done)
        const existingItems = await OrderItem.findAll({
          where: { orderId: order.id },
          transaction,
        });

        if (existingItems.length > 0) {
          console.log(`⏭️  Order ${order.id} already migrated. Skipping...`);
          skippedCount++;
          continue;
        }

        // If legacy items is null or not an array, skip
        let legacyItems;
        try {
          legacyItems = JSON.parse(order.items);
        } catch (parseErr) {
          console.warn(`⚠️  Could not parse legacy items for order ${order.id}: ${parseErr.message}`);
          skippedCount++;
          continue;
        }

        if (!legacyItems || !Array.isArray(legacyItems)) {
          console.log(`⏭️  Order ${order.id} has no legacy items. Skipping...`);
          skippedCount++;
          continue;
        }

        // Migrate items for this order
        console.log(`✏️  Migrating order ${order.id} with ${legacyItems.length} items...`);

        for (const item of legacyItems) {
          await OrderItem.create(
            {
              orderId: order.id,
              productId: item.productId,
              productName: item.productName || item.name || "Unknown Product",
              selectedVariantId: item.selectedVariantId || null,
              selectedVariantName: item.selectedVariantName || null,
              variantAttributes: item.variantAttributes || null,
              quantity: item.quantity || 1,
              price: item.price || 0,
              mrp: item.mrp || null,
              salesPrice: item.salesPrice || null,
              discount: item.discount || 0,
              image: item.image || null,
              selectedProductColor: item.selectedProductColor || null,
              selectedProductSize: item.selectedProductSize || null,
            },
            { transaction }
          );
        }

        migratedCount++;
        console.log(`✅ Order ${order.id} migrated successfully`);
      } catch (err) {
        console.error(`❌ Error migrating order ${order.id}:`, err.message);
        throw err;
      }
    }

    await transaction.commit();
    console.log(
      `\n✨ Migration completed!\n` +
      `✅ Migrated: ${migratedCount} orders\n` +
      `⏭️  Skipped: ${skippedCount} orders`
    );
    process.exit(0);
  } catch (err) {
    await transaction.rollback();
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
};

// Run migration
if (require.main === module) {
  migrateJsonItemsToOrderItems();
}

module.exports = migrateJsonItemsToOrderItems;
