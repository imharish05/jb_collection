const express = require("express");
const router  = express.Router();
const { getNotifications, markRead, markAllRead } = require("../controllers/notificationController");

router.get("/",           getNotifications);
router.patch("/read-all", markAllRead);
router.patch("/read/:id", markRead);

module.exports = router;
