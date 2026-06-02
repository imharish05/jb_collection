const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
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
} = require("../controllers/marketingController");
const { protect, adminOnly } = require("../middleware/auth");

// ── Hero Slide upload ────────────────────────────────────────
const heroSlideUploadDir = path.join(__dirname, "../uploads/hero-slides");
if (!fs.existsSync(heroSlideUploadDir)) fs.mkdirSync(heroSlideUploadDir, { recursive: true });

const heroSlideStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, heroSlideUploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const uploadHeroSlide = multer({
  storage: heroSlideStorage,
  limits: { fileSize: 3 * 1024 * 1024 },
});

// ── Offer Banner upload ──────────────────────────────────────
const offerBannerUploadDir = path.join(__dirname, "../uploads/offer-banners");
if (!fs.existsSync(offerBannerUploadDir)) fs.mkdirSync(offerBannerUploadDir, { recursive: true });

const offerBannerStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, offerBannerUploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const uploadOfferBanner = multer({ storage: offerBannerStorage });

// ── Hero Slides ──────────────────────────────────────────────
router.get("/hero-slides", getHeroSlides);
router.post("/hero-slides", protect, adminOnly, uploadHeroSlide.single("image"), createHeroSlide);
router.put("/hero-slides/:id", protect, adminOnly, uploadHeroSlide.single("image"), updateHeroSlide);
router.delete("/hero-slides/:id", protect, adminOnly, deleteHeroSlide);

// ── Offer Banners (Timeless Treasures) ──────────────────────
router.get("/offer-banners", getOfferBanners);
router.post("/offer-banners", protect, adminOnly, uploadOfferBanner.single("image"), createOfferBanner);
router.put("/offer-banners/:id", protect, adminOnly, uploadOfferBanner.single("image"), updateOfferBanner);
router.delete("/offer-banners/:id", protect, adminOnly, deleteOfferBanner);

// ── Marquee ──────────────────────────────────────────────────
router.get("/marquee", getMarqueeMessages);
router.post("/marquee", protect, adminOnly, createMarqueeMessage);
router.put("/marquee/:id", protect, adminOnly, updateMarqueeMessage);
router.patch("/marquee/:id", protect, adminOnly, updateMarqueeMessage);
router.delete("/marquee/:id", protect, adminOnly, deleteMarqueeMessage);

module.exports = router;