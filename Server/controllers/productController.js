const fs = require("fs");
const path = require("path");
const { Product, Variant, Category, Brand, SubCategory, SubSubCategory, CartItem, WishlistItem, Review } = require("../models");
const { Op }    = require("sequelize");
const sequelize = require("../config/database");
const { syncProductVariants } = require("./variantController");

// ─── shared include for GET queries ─────────────────────────────────────────
const PRODUCT_INCLUDE = [
  {
    model: Variant,
    as: "Variants",
    attributes: ["id", "variantName", "mrp", "salesPrice", "stock", "sku", "attributes", "status", "image", "stockStatus", "warningThreshold", "gstMode", "gstRate", "images"],
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
    model: SubSubCategory,
    as: "SubSubCategory",
    attributes: ["id", "label", "value"],
    required: false,
  },
  {
    model: Brand,
    as: "Brand",
    attributes: ["id", "name", "logo"],
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

const getVariantSignature = (attributes) => {
  const parsed = safeParse(attributes, []);
  return parsed
    .filter(a => a.key && a.value !== undefined && a.value !== null && String(a.value).trim() !== '')
    .map(a => `${a.key.trim().toLowerCase()}:${a.value.trim().toLowerCase()}`)
    .sort()
    .join(';');
};

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
    // Preserve uploaded images to prevent breaking customer order history / order details pages.
    if (process.env.DEBUG_DELETE === 'true' || true) {
      console.log('Skipping physical deletion of product image to preserve order history:', absPath);
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
  row.customisationFields = safeParse(row.customisationFields, null);
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
    const { category, tag, search, minPrice, maxPrice, rating, sort, includeCombos, brand } = req.query;

    const where = { isActive: true };

    if (search) {
      where[Op.or] = [
        { name:             { [Op.like]: `%${search}%` } },
        { shortDescription: { [Op.like]: `%${search}%` } },
      ];
    }
    if (brand) {
      where.brandId = parseInt(brand) || null;
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
    const mappedProducts = products.map(shape);
    const merged = [...mappedProducts];

    // JS level sort for combined items
    if (sort === "price_asc") {
      merged.sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
      merged.sort((a, b) => b.price - a.price);
    } else if (sort === "rating") {
      merged.sort((a, b) => b.rating - a.rating);
    } else if (sort === "sales") {
      merged.sort((a, b) => b.saleCount - a.saleCount);
    }

    return res.json(merged);
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
      productName, categoryId, subCategoryId, subSubCategoryId, brandId,
      isNewArrival, isHotDeal, discount, offerEnd, tag,
      shortDescription, fullDescription, variants,
      isPartialCodAvailable,
      shippingWeight, shippingDimensions,
    } = req.body;

    if (!productName) return res.status(400).json({ message: "productName is required" });

    // req.files is a flat array from upload.any(); split product gallery from variant images
    const productImgFiles = (req.files || []).filter(f => f.fieldname === 'images');
    const image           = productImgFiles.length ? productImgFiles.map(f => `uploads/products/${f.filename}`) : [];
    const parsedVariants  = variants ? safeParse(variants, []) : [];
    const parsedTags      = tag      ? safeParse(tag,      []) : [];

    // Verify uniqueness of incoming variant options and SKUs inside parsedVariants
    const incomingSignatures = [];
    const incomingSkus = [];
    for (const v of parsedVariants) {
      const sig = getVariantSignature(v.attributes);
      if (sig) {
        if (incomingSignatures.includes(sig)) {
          return res.status(400).json({ message: `Duplicate variant options for "${v.variantName || sig}" specified in the request.` });
        }
        incomingSignatures.push(sig);
      }

      if (v.sku) {
        const skuVal = String(v.sku).trim();
        if (incomingSkus.includes(skuVal)) {
          return res.status(400).json({ message: `Duplicate SKU code "${skuVal}" specified inside the product variants.` });
        }
        incomingSkus.push(skuVal);

        const conflict = await Variant.findOne({ where: { sku: skuVal } });
        if (conflict) {
          return res.status(400).json({ message: `SKU code "${skuVal}" is already in use by another variant.` });
        }
      }
    }

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
      isHotDeal:       isHotDeal === "true" || isHotDeal === true,
      category:        categoryId  ? [String(categoryId)] : [],
      tag:             parsedTags,
      variation:       parsedVariants,
      shortDescription: shortDescription || null,
      fullDescription:  fullDescription  || null,
      categoryId:      categoryId    || null,
      subCategoryId:   subCategoryId || null,
      subSubCategoryId: subSubCategoryId || null,
      brandId:         brandId       || null,
      isPartialCodAvailable: isPartialCodAvailable === "false" || isPartialCodAvailable === false ? false : true,
      shippingWeight:  shippingWeight ? parseFloat(shippingWeight) : null,
      shippingDimensions: shippingDimensions ? safeParse(shippingDimensions, null) : null,
    });

    // create Variant rows
    for (let i = 0; i < parsedVariants.length; i++) {
      const v = parsedVariants[i];

      const vGalleryFiles = req.files ? req.files.filter(f => f.fieldname === `variantGallery_${i}`) : [];
      const vGalleryImages = vGalleryFiles.map(f => `uploads/products/${f.filename}`);

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
        image:       vGalleryImages[0] || null,
        images:      vGalleryImages,
        gstMode:     v.gstMode || "Inclusive",
        gstRate:     v.gstRate || 0.00,
      });
    }

    // Sync variants to product.variation, price, and stock
    await syncProductVariants(product.id);

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
      productName, categoryId, subCategoryId, subSubCategoryId, brandId,
      isNewArrival, isHotDeal, discount, offerEnd, tag,
      shortDescription, fullDescription, variants,
      isPartialCodAvailable,
      shippingWeight, shippingDimensions,
    } = req.body;

    const productImgFiles = (req.files || []).filter(f => f.fieldname === 'images');
    const newImages      = productImgFiles.length ? productImgFiles.map(f => `uploads/products/${f.filename}`) : null;
    const existingImages = req.body.existingImages ? safeParse(req.body.existingImages, []) : [];
    const image          = newImages ? [...existingImages, ...newImages] : (existingImages.length ? existingImages : safeParse(product.image, []));
    const parsedVariants = variants ? safeParse(variants, null) : null;
    const parsedTags     = tag      ? safeParse(tag,      safeParse(product.tag, [])) : safeParse(product.tag, []);

    if (parsedVariants) {
      const incomingSignatures = [];
      const incomingSkus = [];
      for (const v of parsedVariants) {
        const sig = getVariantSignature(v.attributes);
        if (sig) {
          if (incomingSignatures.includes(sig)) {
            return res.status(400).json({ message: `Duplicate variant options for "${v.variantName || sig}" specified in the request.` });
          }
          incomingSignatures.push(sig);
        }

        if (v.sku) {
          const skuVal = String(v.sku).trim();
          if (incomingSkus.includes(skuVal)) {
            return res.status(400).json({ message: `Duplicate SKU code "${skuVal}" specified inside the product variants.` });
          }
          incomingSkus.push(skuVal);

          const conflict = await Variant.findOne({
            where: {
              sku: skuVal,
              productId: { [Op.ne]: product.id }
            }
          });
          if (conflict) {
            return res.status(400).json({ message: `SKU code "${skuVal}" is already in use by another variant.` });
          }
        }
      }
    }

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
      isHotDeal:        isHotDeal       !== undefined
                          ? (isHotDeal === "true" || isHotDeal === true)
                          : product.isHotDeal,
      category:         categoryId      ? [String(categoryId)]            : product.category,
      tag:              parsedTags,
      variation:        parsedVariants  || product.variation,
      shortDescription: shortDescription !== undefined ? shortDescription : product.shortDescription,
      fullDescription:  fullDescription  !== undefined ? fullDescription  : product.fullDescription,
      categoryId:       categoryId       !== undefined ? (categoryId || null)        : product.categoryId,
      subCategoryId:    subCategoryId    !== undefined ? (subCategoryId || null)     : product.subCategoryId,
      subSubCategoryId: subSubCategoryId !== undefined ? (subSubCategoryId || null)  : product.subSubCategoryId,
      brandId:          brandId          !== undefined ? (brandId || null)           : product.brandId,
      isPartialCodAvailable: isPartialCodAvailable !== undefined
                          ? (isPartialCodAvailable === "false" || isPartialCodAvailable === false ? false : true)
                          : product.isPartialCodAvailable,
      shippingWeight:   shippingWeight !== undefined ? (shippingWeight ? parseFloat(shippingWeight) : null) : product.shippingWeight,
      shippingDimensions: shippingDimensions !== undefined ? (shippingDimensions ? safeParse(shippingDimensions, null) : null) : product.shippingDimensions,
    });

    // replace variants if new ones supplied
    if (parsedVariants) {
      // Fetch existing variants
      const oldVariants = await Variant.findAll({ where: { productId: product.id } });
      const oldVariantImages = oldVariants.map(v => v.image).filter(Boolean);
      
      // Map old variants by name for easy lookup
      const oldVariantMap = new Map();
      oldVariants.forEach(ov => {
        if (ov.variantName) {
          oldVariantMap.set(ov.variantName.trim().toLowerCase(), ov);
        }
      });

      // Keep track of which existing variant IDs are kept
      const activeVariantIds = new Set();
      const createdVariantImages = [];

      for (let i = 0; i < parsedVariants.length; i++) {
        const v = parsedVariants[i];

        const vNameKey = v.variantName ? v.variantName.trim().toLowerCase() : '';
        const existingVariant = oldVariantMap.get(vNameKey);

        const vGalleryFiles = req.files ? req.files.filter(f => f.fieldname === `variantGallery_${i}`) : [];
        const newGalleryPaths = vGalleryFiles.map(f => `uploads/products/${f.filename}`);
        const existingGallery = v.images ? safeParse(v.images, []) : [];
        const vImages = [...existingGallery, ...newGalleryPaths];

        const mainVarImg = vImages[0] || null;
        if (mainVarImg) createdVariantImages.push(mainVarImg);

        if (existingVariant) {
          // Update existing variant (keeps same ID)
          await existingVariant.update({
            unit:        v.unit,
            mrp:         v.mrp,
            salesPrice:  v.salesPrice,
            stock:       v.stock || 0,
            sku:         v.sku || existingVariant.sku || null,
            status:      v.status || "Active",
            attributes:  v.attributes || [],
            image:       mainVarImg,
            images:      vImages,
            gstMode:     v.gstMode || "Inclusive",
            gstRate:     v.gstRate || 0.00,
          });
          activeVariantIds.add(existingVariant.id);
        } else {
          // Create new variant
          const newVar = await Variant.create({
            productId:   product.id,
            variantName: v.variantName,
            unit:        v.unit,
            mrp:         v.mrp,
            salesPrice:  v.salesPrice,
            stock:       v.stock || 0,
            sku:         v.sku || generateSku("KMV"),
            attributes:  v.attributes || [],
            status:      v.status || "Active",
            image:       mainVarImg,
            images:      vImages,
            gstMode:     v.gstMode || "Inclusive",
            gstRate:     v.gstRate || 0.00,
          });
          activeVariantIds.add(newVar.id);
        }
      }

      // Identify which variants were deleted
      const deletedVariants = oldVariants.filter(ov => !activeVariantIds.has(ov.id));
      
      if (deletedVariants.length > 0) {
        const deletedIds = deletedVariants.map(dv => dv.id);

        // 1. Clean up referencing cart items
        await CartItem.destroy({
          where: { selectedVariantId: deletedIds }
        });

        // 2. Clean up referencing wishlist items
        await WishlistItem.destroy({
          where: { variantId: deletedIds }
        });

        // 4. Destroy deleted variants
        await Variant.destroy({
          where: { id: deletedIds }
        });
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

      // Sync the variants to product.variation, price, and stock
      await syncProductVariants(product.id);
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

    // Clean up variants, cart items, wishlist entries, and reviews
    await Promise.all([
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

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };