const express = require("express");
const router = express.Router();
const { getAll, update, remove } = require("../controllers/reviewController");

router.get("/", getAll);
router.put("/update/:id", update);
router.delete("/:id", remove);

module.exports = router;
