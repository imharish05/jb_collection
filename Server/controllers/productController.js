const fs = require("fs");
const path = require("path");
const { Product, Variant, Category, Brand, SubCategory, Combo, ChildComboProduct, CartItem, WishlistItem, Review } = require("../models");
const { Op }    = require("sequelize");
const sequelize = require("../config/database");
const { syncProductVariants } = require("./variantController");

// ─── shared include for GET queries ─────────────────────────────────────────
const PRODUCT_INCLUDE = [
  {
    model: Variant,
    as: "Variants",
    attributes: ["id", "variantName", "mrp", "salesPrice", "stock", "sku", "attributes", "status", "image", "stockStatus", "warningThreshold"],
    required: false,
  },
  {
    model: Category,
    foreignKey: "category_id",
    attributes: ["id", ["label", "name"], "value"],
    required: false,
  },
  {
    model: SubCategory,
    as: "SubCategory",
    attributes: ["id", "label", "value"],
    required: false,
  },
  {
    model: Combo,
    as: "Combo",
    attributes: ["id", "name", "label", "value", "productIds", "price", "discountedPrice", "image", "description"],
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

const slugifyProductName = (value = "") => {
  const slug = String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  return slug || "product";
};

const isUuid = (value = "") =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value));

const buildUniqueProductSlug = async (name, currentProductId = null) => {
  const base = slugifyProductName(name);
  let slug = base;
  let suffix = 2;

  while (true) {
    const where = { slug };
    if (currentProductId) where.id = { [Op.ne]: currentProductId };

    const existing = await Product.findOne({ where, attributes: ["id"] });
    if (!existing) return slug;

    slug = `${base}-${suffix}`;
    suffix += 1;
  }
};

const ensureProductSlug = async (product) => {
  if (!product || product.slug) return product?.slug || null;
  const slug = await buildUniqueProductSlug(product.name, product.id);
  await product.update({ slug });
  product.slug = slug;
  return slug;
};

const deleteFileIfExists = (absPath) => {
  if (!absPath) return;
  try {
    if (process.env.DEBUG_DELETE === 'true') console.log('Attempting to delete file:', absPath);
    if (fs.existsSync(absPath)) {
      fs.unlink(absPath, (err) => { if (err) console.warn('Could not delete file:', absPath, err.message); else if (process.env.DEBUG_DELETE === 'true') console.log('Deleted file:', absPath); });
    }
  } catch (e) { console.warn('deleteFileIfExists error:', e.message); }
};

// shape: rename variants → Variants for frontend compatibility
const shape = (p) => {
  const row = p.toJSON();
  if (!Array.isArray(row.Variants)) {
    row.Variants = Array.isArray(row.variants) ? row.variants : [];
  }
  delete row.variants;
  // Ensure JSON fields are always real arrays, never raw strings
  row.image     = safeParse(row.image,     []);
  row.tag       = safeParse(row.tag,       []);
  row.variation = safeParse(row.variation, []);
  row.category  = safeParse(row.category,  []);
  row.slug      = row.slug || row.id;  // fallback to id — never non-unique name slug
  // Parse Combo.productIds if it came back as a JSON string
  if (row.Combo && typeof row.Combo.productIds === 'string') {
    try { row.Combo.productIds = JSON.parse(row.Combo.productIds); } catch { row.Combo.productIds = []; }
  }
  if (row.Combo && !Array.isArray(row.Combo.productIds)) {
    row.Combo.productIds = [];
  }
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
        sequelize.where(
          sequelize.fn('JSON_CONTAINS', sequelize.col('category'), JSON.stringify(category)),
          sequelize.literal('= 1')
        ),
      ];
    }
    if (tag) {
      where[Op.and] = [
        ...(where[Op.and] || []),
        sequelize.where(
          sequelize.fn('JSON_CONTAINS', sequelize.col('tag'), JSON.stringify(tag)),
          sequelize.literal('= 1')
        ),
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
    const param = req.params.id;
    // Support both UUID (legacy) and slug (new clean URLs)
    const where = isUuid(param)
      ? { id: param, isActive: true }
      : { slug: param, isActive: true };

    const product = await Product.findOne({
      where,
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
//   isNewArrival, isCustomisable, isHotDeal, discount, offerEnd, tag (JSON string), fullDescription,
//   shortDescription, variants (JSON string array of variant objects)
// File: image (single)
const createProduct = async (req, res, next) => {
  try {
    const {
      productName, categoryId, subCategoryId, brandId, comboId,
      isNewArrival, isCustomisable, isHotDeal, discount, offerEnd, tag,
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
      slug:            await buildUniqueProductSlug(productName),
      price,
      stock,
      image,
      discount:        discount    ? parseInt(discount)    : 0,
      offerEnd:        offerEnd    || null,
      isNew:           isNewArrival === "true" || isNewArrival === true,
      isCustomisable:  isCustomisable === "true" || isCustomisable === true,
      isHotDeal:       isHotDeal === "true" || isHotDeal === true,
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
        status:      v.status || "Active",
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
      isNewArrival, isCustomisable, isHotDeal, discount, offerEnd, tag,
      shortDescription, fullDescription, variants,
    } = req.body;

    const productImgFiles = (req.files || []).filter(f => f.fieldname === 'images');
    const newImages      = productImgFiles.length ? productImgFiles.map(f => `uploads/products/${f.filename}`) : null;
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

    // capture existing product images before update so we can remove any that get deleted
    const existingProductImages = safeParse(product.image, []);

    await product.update({
      name:             productName     || product.name,
      slug:             productName && productName !== product.name
                          ? await buildUniqueProductSlug(productName, product.id)
                          : (product.slug || await buildUniqueProductSlug(product.name, product.id)),
      price,
      stock,
      image,
      discount:         discount        !== undefined ? parseInt(discount) : product.discount,
      offerEnd:         offerEnd        !== undefined ? offerEnd           : product.offerEnd,
      isNew:            isNewArrival    !== undefined
                          ? (isNewArrival === "true" || isNewArrival === true)
                          : product.isNew,
      isCustomisable:   isCustomisable  !== undefined
                          ? (isCustomisable === "true" || isCustomisable === true)
                          : product.isCustomisable,
      isHotDeal:        isHotDeal       !== undefined
                          ? (isHotDeal === "true" || isHotDeal === true)
                          : product.isHotDeal,
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
      // ── MAPPING COMBO VARIANTS ───────────────────────────────────────────
      const oldVariants = await Variant.findAll({ where: { productId: product.id } });
      const oldVariantImages = oldVariants.map(v => v.image).filter(Boolean);
      const oldVariantNameMap = new Map();
      oldVariants.forEach(ov => {
        if (ov.id && ov.variantName) {
          oldVariantNameMap.set(ov.id, ov.variantName);
        }
      });

      const affectedComboProds = await ChildComboProduct.findAll({
        where: { productId: product.id }
      });
      // ─────────────────────────────────────────────────────────────────────

      await Variant.destroy({ where: { productId: product.id } });
      const createdVariantImages = [];
      for (let i = 0; i < parsedVariants.length; i++) {
        const v = parsedVariants[i];
        const vImgFile = req.files ? req.files.find(f => f.fieldname === `variantImage_${i}`) : null;
        const vImage   = vImgFile ? `uploads/products/${vImgFile.filename}` : (v.image || null);
        if (vImage) createdVariantImages.push(vImage);
        await Variant.create({
          productId:   product.id,
          variantName: v.variantName,
          unit:        v.unit,
          mrp:         v.mrp,
          salesPrice:  v.salesPrice,
          stock:       v.stock || 0,
          sku:         v.sku || generateSku("KMV"),
          attributes:  v.attributes || [],
          status:      v.status || "Active",
          image:       vImage,
        });
      }

      // ── RESOLVING COMBO VARIANTS MAPPING ──────────────────────────────────
      if (affectedComboProds.length > 0) {
        const newVariants = await Variant.findAll({ where: { productId: product.id } });
        const newVariantIdMap = new Map();
        newVariants.forEach(nv => {
          if (nv.variantName && nv.id) {
            newVariantIdMap.set(nv.variantName, nv.id);
          }
        });

        for (const cp of affectedComboProds) {
          if (cp.variantId) {
            const oldName = oldVariantNameMap.get(cp.variantId);
            const newId = oldName ? newVariantIdMap.get(oldName) : null;
            if (newId) {
              await cp.update({ variantId: newId });
            } else {
              // The variant was deleted, so clean it up from the combo
              await cp.destroy();
            }
          }
        }
      }
      // delete old variant images that are no longer referenced by new variants or product images
      try {
        const productImagesAfter = Array.isArray(image) ? image : [];
        for (const img of oldVariantImages) {
          if (!img) continue;
          const inNewVariants = createdVariantImages.includes(img);
          const inProductImgs = productImagesAfter.includes(img);
          if (!inNewVariants && !inProductImgs && String(img).startsWith('uploads/')) {
            const abs = path.join(__dirname, '..', img);
            if (fs.existsSync(abs)) {
              deleteFileIfExists(abs);
            }
          }
        }
      } catch (e) { console.warn('Error cleaning up old variant images:', e.message); }
      // ─────────────────────────────────────────────────────────────────────
    }

    // Cleanup product images that were removed during update
    try {
      const oldImages = existingProductImages;
      const newImageArray = Array.isArray(image) ? image : [];
      const removed = oldImages.filter(i => i && !newImageArray.includes(i));
      for (const r of removed) {
        if (!r) continue;
        if (String(r).startsWith('uploads/')) {
          const abs = path.join(__dirname, '..', r);
          if (fs.existsSync(abs)) {
            deleteFileIfExists(abs);
          }
        }
      }
    } catch (e) { console.warn('Error cleaning up removed product images:', e.message); }

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

    // delete product images and variant images from disk
    try {
      const productImages = safeParse(product.image, []);
      for (const img of productImages) {
        if (img && String(img).startsWith('uploads/')) {
          const abs = path.join(__dirname, '..', img);
          if (fs.existsSync(abs)) {
            deleteFileIfExists(abs);
          }
        }
      }
      const variants = await Variant.findAll({ where: { productId: product.id } });
      for (const v of variants) {
        if (v.image && String(v.image).startsWith('uploads/')) {
          const abs = path.join(__dirname, '..', v.image);
          if (fs.existsSync(abs)) {
            deleteFileIfExists(abs);
          }
        }
      }
    } catch (e) { console.warn('Error deleting product files:', e.message); }

    // Clean up combo associations, variants, cart items, wishlist entries, and reviews
    await Promise.all([
      ChildComboProduct.destroy({ where: { productId: product.id } }),
      Variant.destroy({ where: { productId: product.id } }),
      CartItem.destroy({ where: { productId: product.id } }),
      WishlistItem.destroy({ where: { productId: product.id } }),
      Review.destroy({ where: { productId: product.id } })
    ]);

    return res.json({ message: "Product deleted", id: product.id });
  } catch (err) {
    next(err);
  }
};

const seedStockTestProducts = async (req, res, next) => {
  try {
    // Clean up any existing test seed products to keep it clean
    await Product.destroy({ where: { sku: { [Op.like]: "SEED-TEST-%" } } });

    const productsToSeed = [
      {
        sku: "SEED-TEST-INSTOCK",
        name: "Test In Stock Mug",
        price: 299.0,
        stock: 12,
        isActive: true,
        category: ["gifts"],
        image: ["/assets/img/products/products-1.jpeg"],
        shortDescription: "A beautiful test mug that is fully in stock.",
        fullDescription: "A beautiful test mug that is fully in stock for checking standard PDP features.",
        warningThreshold: 5,
        stockStatus: null
      },
      {
        sku: "SEED-TEST-LOWSTOCK",
        name: "Test Low Stock Keychain",
        price: 149.0,
        stock: 3,
        isActive: true,
        category: ["gifts"],
        image: ["/assets/img/products/products-2.jpeg"],
        shortDescription: "Only a few left of this test keychain.",
        fullDescription: "Only a few left of this test keychain. Shows low stock warning.",
        warningThreshold: 5,
        stockStatus: null
      },
      {
        sku: "SEED-TEST-OOS",
        name: "Test Out of Stock Bowl",
        price: 499.0,
        stock: 0,
        isActive: true,
        category: ["gifts"],
        image: ["/assets/img/products/products-3.jpeg"],
        shortDescription: "This test bowl is completely out of stock.",
        fullDescription: "This test bowl is completely out of stock. Testing notify me features.",
        warningThreshold: 5,
        stockStatus: null
      },
      {
        sku: "SEED-TEST-UNAVAILABLE",
        name: "Test Temporarily Unavailable Frame",
        price: 899.0,
        stock: 10,
        isActive: true,
        category: ["gifts"],
        image: ["/assets/img/products/products-4.jpeg"],
        shortDescription: "Temporarily unavailable test frame.",
        fullDescription: "Temporarily unavailable test frame. Stock exists but status makes it unavailable.",
        warningThreshold: 5,
        stockStatus: "Temporarily Unavailable"
      },
      {
        sku: "SEED-TEST-DISCONTINUED",
        name: "Test Discontinued Box",
        price: 1200.0,
        stock: 0,
        isActive: true,
        category: ["gifts"],
        image: ["/assets/img/products/products-5.jpeg"],
        shortDescription: "Discontinued box that cannot be bought.",
        fullDescription: "Discontinued box that cannot be bought. Testing discontinued state.",
        warningThreshold: 5,
        stockStatus: "Discontinued"
      }
    ];

    const seeded = [];
    for (const p of productsToSeed) {
      const prod = await Product.create(p);
      seeded.push(prod);
    }

    // Seed the variable product
    const varProd = await Product.create({
      sku: "SEED-TEST-VARPRODUCT",
      name: "Test Variable T-Shirt",
      price: 399.0,
      stock: 27,
      isActive: true,
      category: ["gifts"],
      image: ["/assets/img/products/products-6.jpeg"],
      shortDescription: "A multi-attribute variable product for complex OOS testing.",
      fullDescription: "Testing sizes and colors dynamic options filtering, invalid vs OOS combos, auto-recovery.",
      warningThreshold: 5,
    });

    const variants = [
      {
        productId: varProd.id,
        variantName: "Colour: Red · Size: S",
        mrp: 599.0,
        salesPrice: 399.0,
        stock: 10,
        stockStatus: "Temporarily Unavailable",
        sku: "SEED-TEST-VAR-1",
        attributes: [{ key: "Colour", value: "Red" }, { key: "Size", value: "S" }],
        status: "Active"
      },
      {
        productId: varProd.id,
        variantName: "Colour: Red · Size: M",
        mrp: 599.0,
        salesPrice: 399.0,
        stock: 0,
        stockStatus: null,
        sku: "SEED-TEST-VAR-2",
        attributes: [{ key: "Colour", value: "Red" }, { key: "Size", value: "M" }],
        status: "Active"
      },
      {
        productId: varProd.id,
        variantName: "Colour: Blue · Size: S",
        mrp: 599.0,
        salesPrice: 449.0,
        stock: 2,
        stockStatus: null,
        sku: "SEED-TEST-VAR-3",
        attributes: [{ key: "Colour", value: "Blue" }, { key: "Size", value: "S" }],
        status: "Active"
      },
      {
        productId: varProd.id,
        variantName: "Colour: Blue · Size: M",
        mrp: 599.0,
        salesPrice: 449.0,
        stock: 15,
        stockStatus: null,
        sku: "SEED-TEST-VAR-4",
        attributes: [{ key: "Colour", value: "Blue" }, { key: "Size", value: "M" }],
        status: "Active"
      }
    ];

    for (const v of variants) {
      await Variant.create(v);
    }

    // Call internal helper to sync variant info to Product table
    await syncProductVariants(varProd.id);

    const freshVar = await Product.findByPk(varProd.id, { include: PRODUCT_INCLUDE });
    seeded.push(freshVar);

    res.json({ success: true, message: "Stock test products seeded successfully!", count: seeded.length });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, seedStockTestProducts };