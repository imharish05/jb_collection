const express = require("express");
const router = express.Router();
const { getAll, getByProduct, add, update, remove } = require("../controllers/variantController");

router.get("/", getAll);
router.get("/product/:productId", getByProduct);
router.post("/add", add);
router.put("/update/:id", update);
router.delete("/:id", remove);

module.exports = router;
