const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const {
  getAll,
  getByProduct,
  getByCombo,
  getEligibility,
  getComboEligibility,
  create,
  update,
  remove,
} = require("../controllers/reviewController");

router.get("/product/:productId", getByProduct);
router.get("/combo/eligibility/:childComboId", protect, getComboEligibility);
router.get("/combo/:childComboId", getByCombo);

router.get("/eligibility/:productId", protect, getEligibility);
router.post("/", protect, create);

router.get("/", protect, adminOnly, getAll);
router.put("/update/:id", protect, adminOnly, update);
router.delete("/:id", protect, adminOnly, remove);

module.exports = router;
