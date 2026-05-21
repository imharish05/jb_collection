const Brand = require("../models/Brand");

// GET /brands
const getAll = async (req, res) => {
  try {
    const data = await Brand.findAll({ order: [["createdAt", "DESC"]] });
    res.json(data);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /brands/add
const add = async (req, res) => {
  try {
    const { name } = req.body;
    const logo = req.file ? req.file.filename : null;
    const brand = await Brand.create({ name, logo });
    res.status(201).json(brand);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// PUT /brands/update/:id
const update = async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);
    if (!brand) return res.status(404).json({ message: "Not found" });
    const { name, isActive } = req.body;
    const logo = req.file ? req.file.filename : brand.logo;
    await brand.update({ name, logo, isActive });
    res.json(brand);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// DELETE /brands/:id
const remove = async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);
    if (!brand) return res.status(404).json({ message: "Not found" });
    await brand.destroy();
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

module.exports = { getAll, add, update, remove };
