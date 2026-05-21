const express = require("express");
const router = express.Router();
const { register, login, getMe, updateMe, updatePassword, adminLogin } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/admin/login", adminLogin);
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.put("/update-password", protect, updatePassword);

module.exports = router;
