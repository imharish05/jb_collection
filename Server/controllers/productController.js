const { Product, Variant, Category, Brand, SubCategory } = require("../models");
const { Op }    = require("sequelize");
const sequelize = require("../config/database");

// ─── shared include for GET queries ─────────────────────────────────────────
const PRODUCT_INCLUDE = [
  {
    model: Variant,
    as: "variants",
    attributes: ["id", "variantName", "mrp", "salesPrice", "stock", "sku", "attributes", "status", "image"],
    required: false,
  },
  {
    model: Category,
    foreignKey: "category_id",
    attributes: ["id", ["label", "name"]],
    required: false,
  },
  {
    model: SubCategory,
    as: "SubCategory",
    attributes: ["id", "label", "value"],
    required: false,
  },
];

// safely parse a value that might be a JSON string or already an array/object
function safeParse(val, fallback = []) {
  if (val === null || val === undefined) return fallback;
  if (Array.isArray(val) || (typeof val === 'object')) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return fallback;
}

const isAllCategory = value =>
  ["all", "all-categories", "all-products"].includes(String(value || "").toLowerCase());

const generateSku = (prefix = "KM") =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

// shape: rename variants → Variants for frontend compatibility
const shape = (p) => {
  const row = p.toJSON();
  row.Variants = row.variants || [];
  delete row.variants;
  // Ensure JSON fields are always real arrays, never raw strings
  row.image     = safeParse(row.image,     []);
  row.tag       = safeParse(row.tag,       []);
  row.variation = safeParse(row.variation, []);
  row.category  = safeParse(row.category,  []);
  return row;
};

// ─── GET /api/products ───────────────────────────────────────────────────────
// Query params: category, tag, search, minPrice, maxPrice, rating, sort
const getAllProducts = async (req, res, next) => {
  try {
    const { category, tag, search, minPrice, maxPrice, rating, sort } = req.query;

    const where = { isActive: true };

    if (search) {
      where[Op.or] = [
        { name:             { [Op.like]: `%${search}%` } },
        { shortDescription: { [Op.like]: `%${search}%` } },
      ];
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }
    if (rating) {
      where.rating = { [Op.gte]: parseFloat(rating) };
    }
    if (category && !isAllCategory(category)) {
      where[Op.and] = [
        ...(where[Op.and] || []),
        sequelize.literal(`JSON_CONTAINS(category, '"${category}"')`),
      ];
    }
    if (tag) {
      where[Op.and] = [
        ...(where[Op.and] || []),
        sequelize.literal(`JSON_CONTAINS(\`tag\`, '"${tag}"')`),
      ];
    }

    const ORDER_MAP = {
      price_asc:  [["price",     "ASC"]],
      price_desc: [["price",     "DESC"]],
      rating:     [["rating",    "DESC"]],
      sales:      [["saleCount", "DESC"]],
    };
    const order = ORDER_MAP[sort] || [["createdAt", "DESC"]];

    const products = await Product.findAll({ where, order, include: PRODUCT_INCLUDE });
    return res.json(products.map(shape));
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/products/:id ───────────────────────────────────────────────────
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, isActive: true },
      include: PRODUCT_INCLUDE,
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json(shape(product));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/products/add ──────────────────────────────────────────────────
// Body (multipart/form-data):
//   productName*, categoryId, subCategoryId, brandId, comboId,
//   isNewArrival, discount, offerEnd, tag (JSON string), fullDescription,
//   shortDescription, variants (JSON string array of variant objects)
// File: image (single)
const createProduct = async (req, res, next) => {
  try {
    const {
      productName, categoryId, subCategoryId, brandId, comboId,
      isNewArrival, discount, offerEnd, tag,
      shortDescription, fullDescription, variants,
    } = req.body;

    if (!productName) return res.status(400).json({ message: "productName is required" });

    // req.files is a flat array from upload.any(); split product gallery from variant images
    const productImgFiles = (req.files || []).filter(f => f.fieldname === 'images');
    const image           = productImgFiles.length ? productImgFiles.map(f => `uploads/products/${f.filename}`) : [];
    const parsedVariants  = variants ? safeParse(variants, []) : [];
    const parsedTags      = tag      ? safeParse(tag,      []) : [];

    // derive price + stock from first variant if provided
    const price = parsedVariants.length > 0
      ? parseFloat(parsedVariants[0].salesPrice) || 0
      : 0;
    const stock = parsedVariants.reduce((s, v) => s + (parseInt(v.stock) || 0), 0);

    const product = await Product.create({
      sku:             `SKU-${Date.now()}`,
      name:            productName,
      price,
      stock,
      image,
      discount:        discount    ? parseInt(discount)    : 0,
      offerEnd:        offerEnd    || null,
      isNew:           isNewArrival === "true" || isNewArrival === true,
      category:        categoryId  ? [String(categoryId)] : [],
      tag:             parsedTags,
      variation:       parsedVariants,
      shortDescription: shortDescription || null,
      fullDescription:  fullDescription  || null,
      categoryId:      categoryId    || null,
      subCategoryId:   subCategoryId || null,
      brandId:         brandId       || null,
      comboId:         comboId       || null,
    });

    // create Variant rows
    for (let i = 0; i < parsedVariants.length; i++) {
      const v = parsedVariants[i];
      // variant image: uploaded as variantImage_<idx>
      const vImgFile = req.files ? req.files.find(f => f.fieldname === `variantImage_${i}`) : null;
      const vImage   = vImgFile ? `uploads/products/${vImgFile.filename}` : (v.image || null);
      await Variant.create({
        productId:   product.id,
        variantName: v.variantName,
        unit:        v.unit,
        mrp:         v.mrp,
        salesPrice:  v.salesPrice,
        stock:       v.stock || 0,
        sku:         v.sku || generateSku("KMV"),
        attributes:  v.attributes || [],
        image:       vImage,
      });
    }

    // re-fetch with associations so response matches GET shape
    const fresh = await Product.findByPk(product.id, { include: PRODUCT_INCLUDE });
    return res.status(201).json(shape(fresh));
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/products/update/:id ────────────────────────────────────────────
// Same body fields as POST — all optional (only supplied fields are updated).
// If variants are supplied, existing Variant rows are replaced.
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const {
      productName, categoryId, subCategoryId, brandId, comboId,
      isNewArrival, discount, offerEnd, tag,
      shortDescription, fullDescription, variants,
    } = req.body;

    const newImages      = req.files?.length ? req.files.map(f => `uploads/products/${f.filename}`) : null;
    const existingImages = req.body.existingImages ? safeParse(req.body.existingImages, []) : [];
    const image          = newImages ? [...existingImages, ...newImages] : (existingImages.length ? existingImages : safeParse(product.image, []));
    const parsedVariants = variants ? safeParse(variants, null) : null;
    const parsedTags     = tag      ? safeParse(tag,      safeParse(product.tag, [])) : safeParse(product.tag, []);

    const price = parsedVariants
      ? parseFloat(parsedVariants[0]?.salesPrice) || product.price
      : product.price;
    const stock = parsedVariants
      ? parsedVariants.reduce((s, v) => s + (parseInt(v.stock) || 0), 0)
      : product.stock;

    await product.update({
      name:             productName     || product.name,
      price,
      stock,
      image,
      discount:         discount        !== undefined ? parseInt(discount) : product.discount,
      offerEnd:         offerEnd        !== undefined ? offerEnd           : product.offerEnd,
      isNew:            isNewArrival    !== undefined
                          ? (isNewArrival === "true" || isNewArrival === true)
                          : product.isNew,
      category:         categoryId      ? [String(categoryId)]            : product.category,
      tag:              parsedTags,
      variation:        parsedVariants  || product.variation,
      shortDescription: shortDescription !== undefined ? shortDescription : product.shortDescription,
      fullDescription:  fullDescription  !== undefined ? fullDescription  : product.fullDescription,
      categoryId:       categoryId       !== undefined ? categoryId        : product.categoryId,
      subCategoryId:    subCategoryId    !== undefined ? subCategoryId     : product.subCategoryId,
      brandId:          brandId          !== undefined ? brandId           : product.brandId,
      comboId:          comboId          !== undefined ? comboId           : product.comboId,
    });

    // replace variants if new ones supplied
    if (parsedVariants) {
      await Variant.destroy({ where: { productId: product.id } });
      for (let i = 0; i < parsedVariants.length; i++) {
        const v = parsedVariants[i];
        const vImgFile = req.files ? req.files.find(f => f.fieldname === `variantImage_${i}`) : null;
        const vImage   = vImgFile ? `uploads/products/${vImgFile.filename}` : (v.image || null);
        await Variant.create({
          productId:   product.id,
          variantName: v.variantName,
          unit:        v.unit,
          mrp:         v.mrp,
          salesPrice:  v.salesPrice,
          stock:       v.stock || 0,
          sku:         v.sku || generateSku("KMV"),
          attributes:  v.attributes || [],
          image:       vImage,
        });
      }
    }

    const fresh = await Product.findByPk(product.id, { include: PRODUCT_INCLUDE });
    return res.json(shape(fresh));
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────
// Soft delete — sets isActive = false
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    await product.update({ isActive: false });
    return res.json({ message: "Product deleted", id: product.id });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };
