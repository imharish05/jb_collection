const fs = require("fs");
const path = require("path");
const { Op, fn, col, literal } = require("sequelize");
const Variant   = require("../models/Variant");
const Product   = require("../models/Product");
const OrderItem = require("../models/OrderItem");
const Order     = require("../models/Order");
const ChildComboProduct = require("../models/ChildComboProduct");

const generateSku = () =>
  `KMV-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

const { refreshVariantStatus } = (() => {
  try { return require("../services/inventoryService"); } catch(e) { return { refreshVariantStatus: async () => {} }; }
})();

const buildImagePath = (file) => {
  if (!file) return null;
  return file.path.replace(/\\/g, "/").replace(/^.*uploads\//, "uploads/");
};

const deleteOldImage = (imagePath) => {
  if (!imagePath) return;
  const absPath = path.join(__dirname, "..", imagePath);
  try {
    if (process.env.DEBUG_DELETE === 'true') console.log('Attempting to delete variant image:', absPath);
    if (fs.existsSync(absPath)) {
      fs.unlink(absPath, (err) => { if (err) console.warn('Could not delete old variant image:', err.message); else if (process.env.DEBUG_DELETE === 'true') console.log('Deleted variant image:', absPath); });
    }
  } catch (e) { console.warn('deleteOldImage error:', e.message); }
};

const parseAttributes = (attributes) => {
  if (Array.isArray(attributes)) return attributes;
  if (typeof attributes === 'string') {
    try { return JSON.parse(attributes); } catch { return []; }
  }
  return attributes || [];
};

// ── Cartesian expand helpers ────────────────────────────────────────────────

// Compute cartesian product of arrays of values.
// cartesian([["Red","Gold"], ["SM","M"]]) →
//   [["Red","SM"],["Red","M"],["Gold","SM"],["Gold","M"]]
const cartesian = (arrays) => {
  if (!arrays.length) return [[]];
  return arrays.reduce(
    (acc, arr) => acc.flatMap(combo => arr.map(v => [...combo, v])),
    [[]]
  );
};

// Given new incoming attributes (e.g. [{key:"Colour",value:"Gold"}]) and all
// existing Variant rows for the product, return an array of full attribute
// arrays — one per combination that must be created.
//
// Example:
//   newAttrs  = [{key:"Colour", value:"Gold"}]
//   existing  = [{key:"Colour",value:"Red"},{key:"Size",value:"SM"},{key:"Material",value:"Glass"}]
//   result    = [[{key:"Colour",value:"Gold"},{key:"Size",value:"SM"},{key:"Material",value:"Glass"}]]
//
// If the product has no variants yet, result = [newAttrs] (just the one row).
const expandToCombinations = (newAttrs, existingVariants) => {
  if (!existingVariants.length) return [newAttrs];

  // Keys introduced by the new attrs
  const newKeys = new Set(newAttrs.map(a => a.key));

  // Collect distinct values for every OTHER dimension already on the product
  const otherDimensions = {}; // { "Size": ["SM","M"], "Material": ["Glass"] }
  existingVariants.forEach(v => {
    parseAttributes(v.attributes).forEach(a => {
      if (!a.key || !a.value || newKeys.has(a.key)) return;
      if (!otherDimensions[a.key]) otherDimensions[a.key] = new Set();
      otherDimensions[a.key].add(a.value);
    });
  });

  const otherKeys   = Object.keys(otherDimensions);
  if (!otherKeys.length) return [newAttrs]; // no other dimensions → single row

  const otherArrays = otherKeys.map(k => [...otherDimensions[k]]);
  const otherCombos = cartesian(otherArrays); // e.g. [["SM","Glass"],["M","Glass"]]

  return otherCombos.map(combo => [
    ...newAttrs,
    ...otherKeys.map((k, i) => ({ key: k, value: combo[i] })),
  ]);
};

// ── Helper to sync variant details (variation JSON blob, price, stock) with the Product model
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
      stockStatus: v.stockStatus,
      warningThreshold: v.warningThreshold,
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

// Active order statuses that count toward sold quantity
const SOLD_STATUSES = ["confirmed", "processing", "shipped", "out_for_delivery", "delivered"];

// GET /variants — returns each variant with a computed soldQuantity field
const getAll = async (req, res) => {
  try {
    // 1. Fetch all variants with their product name
    const data = await Variant.findAll({
      include: [{ model: Product, as: "product", attributes: ["id", "name"] }],
      order: [["createdAt", "DESC"]],
    });

    // 2. Single aggregation: SUM(quantity) per selectedVariantId for active orders only
    const soldRows = await OrderItem.findAll({
      attributes: [
        ["selected_variant_id", "variantId"],
        [fn("SUM", col("OrderItem.quantity")), "totalSold"],
      ],
      include: [{
        model: Order,
        attributes: [],
        where: { status: { [Op.in]: SOLD_STATUSES } },
        required: true,
      }],
      where: {
        selected_variant_id: { [Op.ne]: null },
      },
      group: ["selected_variant_id"],
      raw: true,
    });

    // 3. Build a lookup map: variantId → soldQuantity
    const soldMap = {};
    soldRows.forEach(r => {
      if (r.variantId) soldMap[String(r.variantId)] = parseInt(r.totalSold) || 0;
    });

    // 4. Attach soldQuantity to every variant row
    const result = data.map(v => {
      const plain = v.toJSON();
      plain.soldQuantity = soldMap[String(plain.id)] || 0;
      return plain;
    });

    res.json(result);
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
//
// Accepts EITHER:
//   • A single variant payload (legacy shape) — body has variantName + attributes
//   • An array of variant payloads — body has variants (JSON string / array)
//
// In both cases, each incoming set of attributes is expanded against the
// existing variants on the product so that every new value gets a full
// combination row (cartesian expand).  The uploaded image (req.file) is
// applied to every generated row.
const add = async (req, res) => {
  try {
    const { productId, mrp, salesPrice, stock, status, stockStatus, warningThreshold } = req.body;
    const image = buildImagePath(req.file);

    // ── Basic validation ──────────────────────────────────────────────────
    if (!productId) return res.status(400).json({ message: "productId is required" });
    if (!mrp)       return res.status(400).json({ message: "mrp is required" });
    if (!salesPrice) return res.status(400).json({ message: "salesPrice is required" });
    if (Number(mrp) <= 0)        return res.status(400).json({ message: "MRP must be greater than 0" });
    if (Number(salesPrice) <= 0) return res.status(400).json({ message: "Sales price must be greater than 0" });
    if (Number(salesPrice) > Number(mrp)) return res.status(400).json({ message: "Sales price cannot be greater than MRP" });
    if (stock !== undefined && Number(stock) < 0) return res.status(400).json({ message: "Stock cannot be negative" });

    // ── Normalise incoming payloads to an array ───────────────────────────
    // Support both a single-variant body AND a batch body ({ variants: [...] })
    let incomingPayloads;
    if (req.body.variants) {
      const parsed = parseAttributes(req.body.variants); // reuses JSON-parse helper
      incomingPayloads = Array.isArray(parsed) ? parsed : [parsed];
    } else {
      const { variantName, attributes } = req.body;
      if (!variantName) return res.status(400).json({ message: "variantName is required" });
      incomingPayloads = [{ variantName, attributes: parseAttributes(attributes) }];
    }

    // ── Fetch existing variants once for cartesian expansion ─────────────
    const existingVariants = await Variant.findAll({ where: { productId } });

    // ── Helper: build variantName from attribute combo ────────────────────
    const comboName = (attrs) =>
      attrs.filter(a => a.key && a.value && a.key !== "Custom Note")
           .map(a => `${a.key}: ${a.value}`)
           .join(" · ") || "Default";

    // ── Create one DB row per expanded combination ────────────────────────
    const created = [];
    for (const payload of incomingPayloads) {
      const parsedAttributes = parseAttributes(payload.attributes || []);
      const combinations     = expandToCombinations(parsedAttributes, existingVariants);

      for (const combo of combinations) {
        const name = payload.variantName && combinations.length === 1
          ? payload.variantName   // honour explicit name when no expansion happened
          : comboName(combo);

        const row = await Variant.create({
          productId,
          variantName: name,
          mrp,
          salesPrice,
          stock:      stock      ?? 0,
          stockStatus: stockStatus || null,
          warningThreshold: warningThreshold !== undefined ? parseInt(warningThreshold) : 5,
          sku:        generateSku(),
          attributes: combo,
          status:     status     || "Active",
          image,
        });
        created.push(row);
      }
    }

    await syncProductVariants(productId);

    // Recompute stock statuses for newly created variants
    for (const r of created) {
      refreshVariantStatus(r.id).catch(e => console.error("[Inventory] refreshVariantStatus:", e.message));
    }

    // Return all created rows with product association
    const fresh = await Variant.findAll({
      where: { id: created.map(r => r.id) },
      include: [{ model: Product, as: "product", attributes: ["id", "name"] }],
    });
    res.status(201).json(fresh.length === 1 ? fresh[0] : fresh);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// PUT /variants/update/:id
const update = async (req, res) => {
  try {
    const variant = await Variant.findByPk(req.params.id);
    if (!variant) return res.status(404).json({ message: "Not found" });

    const { productId, variantName, mrp, salesPrice, stock, attributes, status, stockStatus, warningThreshold } = req.body;
    const oldProductId = variant.productId;
    const parsedAttributes = attributes !== undefined ? parseAttributes(attributes) : undefined;

    if (mrp !== undefined && Number(mrp) <= 0) return res.status(400).json({ message: "MRP must be greater than 0" });
    if (salesPrice !== undefined && Number(salesPrice) <= 0) return res.status(400).json({ message: "Sales price must be greater than 0" });
    if (mrp !== undefined && salesPrice !== undefined && Number(salesPrice) > Number(mrp)) {
      return res.status(400).json({ message: "Sales price cannot be greater than MRP" });
    }
    if (stock !== undefined && Number(stock) < 0) return res.status(400).json({ message: "Stock cannot be negative" });

    const updates = {
      ...(productId   !== undefined && { productId }),
      ...(variantName !== undefined && { variantName }),
      ...(mrp         !== undefined && { mrp }),
      ...(salesPrice  !== undefined && { salesPrice }),
      ...(stock       !== undefined && { stock }),
      ...(stockStatus !== undefined && { stockStatus }),
      ...(warningThreshold !== undefined && { warningThreshold: warningThreshold ? parseInt(warningThreshold) : 5 }),
      ...(parsedAttributes !== undefined && { attributes: parsedAttributes }),
      ...(status      !== undefined && { status }),
    };

    if (req.file) {
      deleteOldImage(variant.image);
      updates.image = buildImagePath(req.file);
    }

    await variant.update(updates);

    await syncProductVariants(oldProductId);
    if (variant.productId !== oldProductId) await syncProductVariants(variant.productId);

    // Recompute stock status + maybe fire notification
    refreshVariantStatus(variant.id).catch(e => console.error("[Inventory] refreshVariantStatus:", e.message));

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

    // Clean up combo associations
    await ChildComboProduct.destroy({ where: { variantId: variant.id } });

    // delete variant image file if present
    try { deleteOldImage(variant.image); } catch (e) { /* continue */ }

    await variant.destroy();
    await syncProductVariants(productId);
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

module.exports = { getAll, getByProduct, add, update, remove, syncProductVariants };