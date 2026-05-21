const express = require("express");
const router = express.Router();
const { addToCompare, removeFromCompare } = require("../controllers/compareController");

// Compare is stateless on the server (Redux handles state)
router.post("/add", addToCompare);
router.delete("/remove/:productId", removeFromCompare);

module.exports = router;
