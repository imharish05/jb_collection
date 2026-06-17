const express = require("express");
const router  = express.Router();
const { getNotifications, markRead, markAllRead, clearAll } = require("../controllers/notificationController");

router.get("/",              getNotifications);
router.patch("/read-all",    markAllRead);
router.patch("/read/:id",    markRead);
router.delete("/clear-all",  clearAll);

module.exports = router;