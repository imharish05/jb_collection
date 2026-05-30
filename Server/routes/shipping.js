const express = require("express");
const router = express.Router();
const { getRates } = require("../controllers/shippingController");

// Public — called from checkout when address changes
router.get("/rates", getRates);

module.exports = router;