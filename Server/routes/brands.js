const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { protect, adminOnly } = require("../middleware/auth");
const { getAll, add, update, remove } = require("../controllers/brandController");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

router.get("/", getAll);
router.post("/add", protect, adminOnly, upload.single("logo"), add);
router.put("/update/:id", protect, adminOnly, upload.single("logo"), update);
router.delete("/:id", protect, adminOnly, remove);

module.exports = router;
