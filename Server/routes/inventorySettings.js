const express = require("express");
const router  = express.Router();
const { getSettings, updateSettings, getSummary } = require("../controllers/inventorySettingsController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/",        getSettings);
router.put("/",        protect, adminOnly, updateSettings);
router.get("/summary", getSummary);

module.exports = router;
