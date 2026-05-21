const Variant = require("../models/Variant");
const Product = require("../models/Product");

// GET /variants
const getAll = async (req, res) => {
  try {
    const data = await Variant.findAll({
      include: [{ model: Product, as: "product", attributes: ["id", "name"] }],
      order: [["createdAt", "DESC"]],
    });
    res.json(data);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /variants/product/:productId
const getByProduct = async (req, res) => {
  try {
    const data = await Variant.findAll({ where: { productId: req.params.productId } });
    res.json(data);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /variants/add
const add = async (req, res) => {
  try {
    const { productId, variantName, unit, mrp, salesPrice, stock } = req.body;
    const variant = await Variant.create({ productId, variantName, unit, mrp, salesPrice, stock });
    res.status(201).json(variant);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// PUT /variants/update/:id
const update = async (req, res) => {
  try {
    const variant = await Variant.findByPk(req.params.id);
    if (!variant) return res.status(404).json({ message: "Not found" });
    await variant.update(req.body);
    res.json(variant);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// DELETE /variants/:id
const remove = async (req, res) => {
  try {
    const variant = await Variant.findByPk(req.params.id);
    if (!variant) return res.status(404).json({ message: "Not found" });
    await variant.destroy();
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

module.exports = { getAll, getByProduct, add, update, remove };