const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { getAll, add, update, remove } = require("../controllers/brandController");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

router.get("/", getAll);
router.post("/add", upload.single("logo"), add);
router.put("/update/:id", upload.single("logo"), update);
router.delete("/:id", remove);

module.exports = router;
