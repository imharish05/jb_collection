const express = require("express");
const router  = express.Router();
const { getNotifications, markRead, markAllRead, clearAll } = require("../controllers/notificationController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect);
router.use(adminOnly);

router.get("/",              getNotifications);
router.patch("/read-all",    markAllRead);
router.patch("/read/:id",    markRead);
router.delete("/clear-all",  clearAll);

module.exports = router;