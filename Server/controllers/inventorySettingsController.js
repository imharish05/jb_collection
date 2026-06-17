// controllers/inventorySettingsController.js
const InventorySettings = require("../models/InventorySettings");
const {
  invalidateSettingsCache,
  refreshAllVariantStatuses,
  getInventorySummary,
} = require("../services/inventoryService");

// GET /api/inventory-settings
const getSettings = async (req, res) => {
  try {
    let row = await InventorySettings.findOne({ order: [["id", "DESC"]] });
    if (!row) row = await InventorySettings.create({ highStockThreshold: 51, mediumStockThreshold: 11, lowStockThreshold: 1 });
    res.json(row);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// PUT /api/inventory-settings
const updateSettings = async (req, res) => {
  try {
    const { highStockThreshold, mediumStockThreshold, lowStockThreshold, updatedBy } = req.body;

    const high   = parseInt(highStockThreshold);
    const medium = parseInt(mediumStockThreshold);
    const low    = parseInt(lowStockThreshold);

    // Validation
    if (isNaN(high) || isNaN(medium) || isNaN(low))
      return res.status(400).json({ message: "All thresholds must be numbers" });
    if (low <= 0)
      return res.status(400).json({ message: "Low threshold must be > 0" });
    if (medium <= low)
      return res.status(400).json({ message: "Medium threshold must be > Low threshold" });
    if (high <= medium)
      return res.status(400).json({ message: "High threshold must be > Medium threshold" });

    let row = await InventorySettings.findOne({ order: [["id", "DESC"]] });
    if (row) {
      await row.update({ highStockThreshold: high, mediumStockThreshold: medium, lowStockThreshold: low, updatedBy: updatedBy || "admin" });
    } else {
      row = await InventorySettings.create({ highStockThreshold: high, mediumStockThreshold: medium, lowStockThreshold: low, updatedBy: updatedBy || "admin" });
    }

    // Bust cache then re-compute all variant statuses
    invalidateSettingsCache();
    // Fire-and-forget (don't block response)
    refreshAllVariantStatuses().catch(e => console.error("[Inventory] refreshAllVariantStatuses error:", e.message));

    res.json({ success: true, settings: row });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET /api/inventory-summary
const getSummary = async (req, res) => {
  try {
    const summary = await getInventorySummary();
    res.json(summary);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = { getSettings, updateSettings, getSummary };
