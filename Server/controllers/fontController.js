const { Font } = require("../models");

// GET /api/fonts — public (for product detail page dropdowns)
const getAllFonts = async (req, res, next) => {
  try {
    const activeOnly = req.query.active !== "false";
    const where = activeOnly ? { isActive: true } : {};
    const fonts = await Font.findAll({ where, order: [["name", "ASC"]] });
    return res.json(fonts);
  } catch (err) {
    next(err);
  }
};

// POST /api/fonts — admin only
const createFont = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "Font name is required" });

    const existing = await Font.findOne({ where: { name: name.trim() } });
    if (existing) return res.status(400).json({ message: "A font with this name already exists" });

    const font = await Font.create({ name: name.trim(), isActive: true });
    return res.status(201).json(font);
  } catch (err) {
    next(err);
  }
};

// PUT /api/fonts/:id — admin only
const updateFont = async (req, res, next) => {
  try {
    const font = await Font.findByPk(req.params.id);
    if (!font) return res.status(404).json({ message: "Font not found" });

    const { name, isActive } = req.body;

    if (name !== undefined && name.trim() !== font.name) {
      const existing = await Font.findOne({ where: { name: name.trim() } });
      if (existing && existing.id !== font.id) {
        return res.status(400).json({ message: "A font with this name already exists" });
      }
    }

    await font.update({
      name: name !== undefined ? name.trim() : font.name,
      isActive: isActive !== undefined ? isActive : font.isActive,
    });
    return res.json(font);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/fonts/:id — admin only
const deleteFont = async (req, res, next) => {
  try {
    const font = await Font.findByPk(req.params.id);
    if (!font) return res.status(404).json({ message: "Font not found" });
    await font.destroy();
    return res.json({ message: "Font deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllFonts, createFont, updateFont, deleteFont };
