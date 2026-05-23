const { Category, Event, Combo, SubCategory } = require("../models/Category");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pick = (obj, keys) =>
  keys.reduce((acc, k) => (obj[k] !== undefined ? { ...acc, [k]: obj[k] } : acc), {});

// ═════════════════════════════════════════════════════════════════════════════
//  COMBINED NAV  –  GET /api/nav
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Returns all active categories, events, and combos in a single response.
 * Used to hydrate the navigation bar on initial page load.
 */
const getNav = async (req, res) => {
  try {
    const [categories, events, combos] = await Promise.all([
      Category.findAll({
        where: { isActive: true },
        attributes: ["id", "label", "value", "image"],
        order: [["sortOrder", "ASC"]],
        include: [{
          model: SubCategory,
          as: "subcategories",
          where: { isActive: true },
          attributes: ["id", "label", "value"],
          required: false,
        }],
      }),
      Event.findAll({
        where: { isActive: true },
        attributes: ["label", "value","image"],
        order: [["sortOrder", "ASC"]],
      }),
      Combo.findAll({
        where: { isActive: true },
        attributes: ["id", "label", "value"],
        order: [["sortOrder", "ASC"]],
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: { categories, events, combos },
    });
  } catch (error) {
    console.error("getNav error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
//  CATEGORY
// ═════════════════════════════════════════════════════════════════════════════

const getCategories = async (req, res) => {
  try {
    const { active } = req.query; // ?active=true|false  (omit for all)
    const where = active !== undefined ? { isActive: active === "true" } : {};

    const categories = await Category.findAll({
      where,
      order: [["sortOrder", "ASC"]],
      include: [{ model: SubCategory, as: "subcategories", attributes: ["id", "label", "value", "sortOrder"], required: false }],
    });

    return res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error("getCategories error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    return res.status(200).json({ success: true, data: category });
  } catch (error) {
    console.error("getCategoryById error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const createCategory = async (req, res) => {
  try {
    const allowed = pick(req.body, ["label", "value", "isActive"]);
    if (!allowed.label)
      return res.status(400).json({ success: false, message: "label is required" });

    if (req.file) allowed.image = `categories/${req.file.filename}`;

    // Auto sortOrder = count of existing rows + 1
    const count = await Category.count();
    allowed.sortOrder = count + 1;

    const category = await Category.create(allowed);
    return res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error("createCategory error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category)
      return res.status(404).json({ success: false, message: "Category not found" });

    const allowed = pick(req.body, ["label", "value", "sortOrder", "isActive"]);
    if (req.file) allowed.image = `categories/${req.file.filename}`; // ← add

    await category.update(allowed);
    return res.status(200).json({ success: true, data: category });
  }catch (error) {
    console.error("updateCategory error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    await category.destroy();
    return res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("deleteCategory error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
//  EVENT
// ═════════════════════════════════════════════════════════════════════════════

const getEvents = async (req, res) => {
  try {
    const { active } = req.query;
    const where = active !== undefined ? { isActive: active === "true" } : {};

    const events = await Event.findAll({
      where,
      order: [["sortOrder", "ASC"]],
    });

    return res.status(200).json({ success: true, data: events });
  } catch (error) {
    console.error("getEvents error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    return res.status(200).json({ success: true, data: event });
  } catch (error) {
    console.error("getEventById error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const createEvent = async (req, res) => {
  try {
    const allowed = pick(req.body, ["label", "value", "isActive"]);
    if (!allowed.label)
      return res.status(400).json({ success: false, message: "label is required" });

    if (req.file) allowed.image = `events/${req.file.filename}`;  // ← add

    const count = await Event.count();
    allowed.sortOrder = count + 1;

    const event = await Event.create(allowed);
    return res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error("createEvent error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event)
      return res.status(404).json({ success: false, message: "Event not found" });

    const allowed = pick(req.body, ["label", "value", "sortOrder", "isActive"]);
    if (req.file) allowed.image = `events/${req.file.filename}`;  // ← add

    await event.update(allowed);
    return res.status(200).json({ success: true, data: event });
  } catch (error) {
    console.error("updateEvent error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    await event.destroy();
    return res.status(200).json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    console.error("deleteEvent error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
//  COMBO
// ═════════════════════════════════════════════════════════════════════════════

const getCombos = async (req, res) => {
  try {
    const { active } = req.query;
    const where = active !== undefined ? { isActive: active === "true" } : {};

    const combos = await Combo.findAll({ where, order: [["sortOrder", "ASC"]] });

    const data = combos.map(c => {
      const row = c.toJSON();
      // parse productIds if stored as JSON string
      if (typeof row.productIds === 'string') {
        try { row.productIds = JSON.parse(row.productIds); } catch { row.productIds = []; }
      }
      if (!Array.isArray(row.productIds)) row.productIds = [];
      return row;
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("getCombos error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getComboById = async (req, res) => {
  try {
    const combo = await Combo.findByPk(req.params.id);
    if (!combo) {
      return res.status(404).json({ success: false, message: "Combo not found" });
    }
    return res.status(200).json({ success: true, data: combo });
  } catch (error) {
    console.error("getComboById error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const createCombo = async (req, res) => {
  try {
    const allowed = pick(req.body, [
      "name", "label", "value", "productIds",
      "price", "discountedPrice", "description", "sortOrder", "isActive",
    ]);

    // image uploaded via multer
    if (req.file) allowed.image = `uploads/combos/${req.file.filename}`;

    // productIds arrives as JSON string from FormData
    if (allowed.productIds && typeof allowed.productIds === 'string') {
      try { allowed.productIds = JSON.parse(allowed.productIds); } catch { allowed.productIds = []; }
    }
    if (!Array.isArray(allowed.productIds)) allowed.productIds = [];

    // auto-generate value slug from name if not provided
    if (!allowed.value && allowed.name) {
      allowed.value = allowed.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
    // label defaults to name
    if (!allowed.label && allowed.name) allowed.label = allowed.name;

    const missing = ["name", "price"].filter(k => !allowed[k] && allowed[k] !== 0);
    if (missing.length) {
      return res.status(400).json({ success: false, message: `Missing required fields: ${missing.join(", ")}` });
    }

    const combo = await Combo.create(allowed);
    return res.status(201).json({ success: true, data: combo });
  } catch (error) {
    console.error("createCombo error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateCombo = async (req, res) => {
  try {
    const combo = await Combo.findByPk(req.params.id);
    if (!combo) return res.status(404).json({ success: false, message: "Combo not found" });

    const allowed = pick(req.body, [
      "name", "label", "value", "productIds",
      "price", "discountedPrice", "description", "sortOrder", "isActive",
    ]);

    if (req.file) allowed.image = `uploads/combos/${req.file.filename}`;

    if (allowed.productIds && typeof allowed.productIds === 'string') {
      try { allowed.productIds = JSON.parse(allowed.productIds); } catch { allowed.productIds = []; }
    }
    if (allowed.productIds && !Array.isArray(allowed.productIds)) allowed.productIds = [];

    await combo.update(allowed);
    return res.status(200).json({ success: true, data: combo });
  } catch (error) {
    console.error("updateCombo error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const deleteCombo = async (req, res) => {
  try {
    const combo = await Combo.findByPk(req.params.id);
    if (!combo) {
      return res.status(404).json({ success: false, message: "Combo not found" });
    }

    await combo.destroy();
    return res.status(200).json({ success: true, message: "Combo deleted successfully" });
  } catch (error) {
    console.error("deleteCombo error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  // Combined nav
  getNav,

  // Category
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,

  // Event
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,

  // Combo
  getCombos,
  getComboById,
  createCombo,
  updateCombo,
  deleteCombo,
};