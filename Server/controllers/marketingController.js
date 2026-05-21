const path = require("path");
const fs = require("fs");
const { HeroSlide, OfferBanner, MarqueeMessage } = require("../models");

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build the public image path stored in DB from the multer file object.
 * Stored as a relative path that the frontend can prepend with the server base URL.
 * e.g.  "uploads/hero-slides/1716000000000.jpeg"
 */
const buildImagePath = (file) => {
  if (!file) return null;
  // Normalize to forward slashes and strip leading separator
  return file.path.replace(/\\/g, "/").replace(/^.*uploads\//, "uploads/");
};

/**
 * Delete a file that was previously uploaded (when replacing an image).
 */
const deleteOldFile = (imagePath) => {
  if (!imagePath) return;
  // imagePath is like "uploads/hero-slides/123.jpeg"
  const abs = path.join(__dirname, "..", imagePath);
  if (fs.existsSync(abs)) {
    fs.unlink(abs, (err) => {
      if (err) console.warn("Could not delete old file:", abs, err.message);
    });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
//  HERO SLIDES
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/hero-slides
const getHeroSlides = async (req, res, next) => {
  try {
    const { all } = req.query; // ?all=true to include inactive (admin use)
    const where = all === "true" ? {} : { isActive: true };

    const slides = await HeroSlide.findAll({
      where,
      order: [["sortOrder", "ASC"]],
    });
    return res.json(slides);
  } catch (err) {
    next(err);
  }
};

// POST /api/hero-slides
const createHeroSlide = async (req, res, next) => {
  try {
    const { title, subtitle, url, sortOrder, isActive } = req.body;

    if (!title) {
      return res.status(400).json({ message: "title is required" });
    }

    // Image is mandatory for a new slide — must upload a file
    if (!req.file) {
      return res.status(400).json({ message: "Slide image is required" });
    }

    const imagePath = buildImagePath(req.file);

    const slide = await HeroSlide.create({
      title,
      subtitle: subtitle || null,
      image: imagePath,
      url: url || "/shop",
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
      isActive: isActive !== undefined ? isActive === "true" || isActive === true : true,
    });

    return res.status(201).json(slide);
  } catch (err) {
    next(err);
  }
};

// PUT /api/hero-slides/:id
const updateHeroSlide = async (req, res, next) => {
  try {
    const slide = await HeroSlide.findByPk(req.params.id);
    if (!slide) return res.status(404).json({ message: "Slide not found" });

    const updates = {};

    if (req.body.title !== undefined)     updates.title     = req.body.title;
    if (req.body.subtitle !== undefined)  updates.subtitle  = req.body.subtitle;
    if (req.body.url !== undefined)       updates.url       = req.body.url;
    if (req.body.sortOrder !== undefined) updates.sortOrder = Number(req.body.sortOrder);
    if (req.body.isActive !== undefined)  updates.isActive  = req.body.isActive === "true" || req.body.isActive === true;

    if (req.file) {
      // Replace image: delete old file, store new path
      deleteOldFile(slide.image);
      updates.image = buildImagePath(req.file);
    }

    await slide.update(updates);
    return res.json(slide);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/hero-slides/:id
const deleteHeroSlide = async (req, res, next) => {
  try {
    const slide = await HeroSlide.findByPk(req.params.id);
    if (!slide) return res.status(404).json({ message: "Slide not found" });

    deleteOldFile(slide.image);
    await slide.destroy();
    return res.json({ message: "Slide deleted" });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
//  OFFER BANNERS  (Timeless Treasures)
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/offer-banners
const getOfferBanners = async (req, res, next) => {
  try {
    const { all } = req.query;
    const where = all === "true" ? {} : { isActive: true };

    const banners = await OfferBanner.findAll({
      where,
      order: [["sortOrder", "ASC"]],
    });
    return res.json(banners);
  } catch (err) {
    next(err);
  }
};

// POST /api/offer-banners
const createOfferBanner = async (req, res, next) => {
  try {
    const { title, off, link, sortOrder, isActive } = req.body;

    if (!title) {
      return res.status(400).json({ message: "title is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Banner image is required" });
    }

    const imagePath = buildImagePath(req.file);

    const banner = await OfferBanner.create({
      title,
      off: off || null,
      image: imagePath,
      link: link || "/shop",
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
      isActive: isActive !== undefined ? isActive === "true" || isActive === true : true,
    });

    return res.status(201).json(banner);
  } catch (err) {
    next(err);
  }
};

// PUT /api/offer-banners/:id
const updateOfferBanner = async (req, res, next) => {
  try {
    const banner = await OfferBanner.findByPk(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner not found" });

    const updates = {};

    if (req.body.title !== undefined)     updates.title     = req.body.title;
    if (req.body.off !== undefined)       updates.off       = req.body.off;
    if (req.body.link !== undefined)      updates.link      = req.body.link;
    if (req.body.sortOrder !== undefined) updates.sortOrder = Number(req.body.sortOrder);
    if (req.body.isActive !== undefined)  updates.isActive  = req.body.isActive === "true" || req.body.isActive === true;

    if (req.file) {
      deleteOldFile(banner.image);
      updates.image = buildImagePath(req.file);
    }

    await banner.update(updates);
    return res.json(banner);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/offer-banners/:id
const deleteOfferBanner = async (req, res, next) => {
  try {
    const banner = await OfferBanner.findByPk(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner not found" });

    deleteOldFile(banner.image);
    await banner.destroy();
    return res.json({ message: "Banner deleted" });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
//  MARQUEE MESSAGES
// ══════════════════════════════════════════════════════════════════════════════

const getMarqueeMessages = async (req, res, next) => {
  try {
    const { all } = req.query;
    // Admin requests ?all=true → return full objects (all statuses)
    // Client requests (no param) → return only active message strings
    const where = all === "true" ? {} : { isActive: true };
    const messages = await MarqueeMessage.findAll({
      where,
      order: [["sortOrder", "ASC"]],
    });
    if (all === "true") return res.json(messages);
    return res.json(messages.map((m) => m.message));
  } catch (err) {
    next(err);
  }
};

const createMarqueeMessage = async (req, res, next) => {
  try {
    const msg = await MarqueeMessage.create(req.body);
    return res.status(201).json(msg);
  } catch (err) {
    next(err);
  }
};

const updateMarqueeMessage = async (req, res, next) => {
  try {
    const msg = await MarqueeMessage.findByPk(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message not found" });
    await msg.update(req.body);
    return res.json(msg);
  } catch (err) {
    next(err);
  }
};

const deleteMarqueeMessage = async (req, res, next) => {
  try {
    const msg = await MarqueeMessage.findByPk(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message not found" });
    await msg.destroy();
    return res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  getOfferBanners,
  createOfferBanner,
  updateOfferBanner,
  deleteOfferBanner,
  getMarqueeMessages,
  createMarqueeMessage,
  updateMarqueeMessage,
  deleteMarqueeMessage,
};