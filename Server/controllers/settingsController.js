const { SiteSetting } = require("../models");

// GET /api/settings
const getSettings = async (req, res, next) => {
  try {
    const settingsRows = await SiteSetting.findAll({ raw: true });
    
    // Map array of { key, value } to a single object
    const settings = {};
    settingsRows.forEach(row => {
      settings[row.key] = row.value;
    });
    
    res.json(settings);
  } catch (err) {
    next(err);
  }
};

// PUT /api/settings
const updateSettings = async (req, res, next) => {
  try {
    const updates = { ...req.body };

    // Process uploaded files if any
    if (req.files) {
      if (req.files.logo && req.files.logo[0]) {
        // Save relative path: uploads/settings/filename
        updates.logoUrl = `uploads/settings/${req.files.logo[0].filename}`;
      }
      if (req.files.aboutImage && req.files.aboutImage[0]) {
        updates.aboutImageUrl = `uploads/settings/${req.files.aboutImage[0].filename}`;
      }
    }

    // Save each key-value pair
    const promises = Object.entries(updates).map(async ([key, value]) => {
      // Sequelize upsert: inserts if key doesn't exist, updates if it does
      await SiteSetting.upsert({
        key,
        value: value !== undefined ? String(value) : null,
      });
    });

    await Promise.all(promises);

    // Fetch the updated settings to return
    const settingsRows = await SiteSetting.findAll({ raw: true });
    const settings = {};
    settingsRows.forEach(row => {
      settings[row.key] = row.value;
    });

    res.json({
      message: "Settings updated successfully",
      settings,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
