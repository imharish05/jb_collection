const Variant = require("../models/Variant");
const Product = require("../models/Product");

const generateSku = () =>
  `KMV-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

// Helper to sync variant details (variation JSON blob, price, stock) with the Product model
const syncProductVariants = async (productId) => {
  if (!productId) return;
  try {
    const product = await Product.findByPk(productId);
    if (!product) return;

    const variants = await Variant.findAll({ where: { productId } });

    // Map database variants to the variation JSON structure expected by client components
    const mappedVariations = variants.map(v => ({
      id: v.id,
      variantName: v.variantName,
      unit: v.unit,
      mrp: v.mrp,
      salesPrice: v.salesPrice,
      stock: v.stock,
      attributes: v.attributes || [],
      image: v.image,
      sku: v.sku,
      status: v.status,
    }));

    // Update product price (first variant salesPrice, or 0) and total stock
    const price = mappedVariations.length > 0 ? parseFloat(mappedVariations[0].salesPrice) || 0 : product.price;
    const stock = mappedVariations.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);

    await product.update({
      variation: mappedVariations,
      price,
      stock,
    });
  } catch (err) {
    console.error("Error in syncProductVariants:", err);
  }
};

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
    const { productId, variantName, mrp, salesPrice, stock, attributes, status } = req.body;

    if (!productId)   return res.status(400).json({ message: "productId is required" });
    if (!variantName) return res.status(400).json({ message: "variantName is required" });
    if (!mrp)         return res.status(400).json({ message: "mrp is required" });
    if (!salesPrice)  return res.status(400).json({ message: "salesPrice is required" });
    if (Number(mrp) <= 0) return res.status(400).json({ message: "MRP must be greater than 0" });
    if (Number(salesPrice) <= 0) return res.status(400).json({ message: "Sales price must be greater than 0" });
    if (Number(salesPrice) > Number(mrp)) return res.status(400).json({ message: "Sales price cannot be greater than MRP" });
    if (stock !== undefined && Number(stock) < 0) return res.status(400).json({ message: "Stock cannot be negative" });

    const variant = await Variant.create({
      productId,
      variantName,
      mrp,
      salesPrice,
      stock:      stock      ?? 0,
      sku:        generateSku(),
      attributes: attributes || [],
      status:     status     || "Active",
    });

    await syncProductVariants(productId);

    const fresh = await Variant.findByPk(variant.id, {
      include: [{ model: Product, as: "product", attributes: ["id", "name"] }],
    });
    res.status(201).json(fresh);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// PUT /variants/update/:id
const update = async (req, res) => {
  try {
    const variant = await Variant.findByPk(req.params.id);
    if (!variant) return res.status(404).json({ message: "Not found" });

    const { productId, variantName, mrp, salesPrice, stock, attributes, status } = req.body;

    if (mrp !== undefined && Number(mrp) <= 0) return res.status(400).json({ message: "MRP must be greater than 0" });
    if (salesPrice !== undefined && Number(salesPrice) <= 0) return res.status(400).json({ message: "Sales price must be greater than 0" });
    if (mrp !== undefined && salesPrice !== undefined && Number(salesPrice) > Number(mrp)) {
      return res.status(400).json({ message: "Sales price cannot be greater than MRP" });
    }
    if (stock !== undefined && Number(stock) < 0) return res.status(400).json({ message: "Stock cannot be negative" });

    await variant.update({
      ...(productId   !== undefined && { productId }),
      ...(variantName !== undefined && { variantName }),
      ...(mrp         !== undefined && { mrp }),
      ...(salesPrice  !== undefined && { salesPrice }),
      ...(stock       !== undefined && { stock }),
      ...(attributes  !== undefined && { attributes }),
      ...(status      !== undefined && { status }),
    });

    await syncProductVariants(variant.productId);

    const fresh = await Variant.findByPk(variant.id, {
      include: [{ model: Product, as: "product", attributes: ["id", "name"] }],
    });
    res.json(fresh);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// DELETE /variants/:id
const remove = async (req, res) => {
  try {
    const variant = await Variant.findByPk(req.params.id);
    if (!variant) return res.status(404).json({ message: "Not found" });
    const productId = variant.productId;
    await variant.destroy();
    await syncProductVariants(productId);
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

module.exports = { getAll, getByProduct, add, update, remove };
