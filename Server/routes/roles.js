const express = require("express");
const router = express.Router();
const { getAllRoles, createRole, updateRole, deleteRole } = require("../controllers/roleController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect);
router.use(adminOnly);

router.get("/", getAllRoles);
router.post("/", createRole);
router.put("/:id", updateRole);
router.delete("/:id", deleteRole);

module.exports = router;
