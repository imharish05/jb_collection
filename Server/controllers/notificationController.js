// controllers/notificationController.js
const Notification = require("../models/Notification");
const { Op } = require("sequelize");

// GET /api/notifications?limit=5
const getNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const [notifications, unreadCount] = await Promise.all([
      Notification.findAll({ order: [["createdAt", "DESC"]], limit }),
      Notification.count({ where: { isRead: false } }),
    ]);
    res.json({ notifications, unreadCount });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// PATCH /api/notifications/read/:id
const markRead = async (req, res) => {
  try {
    await Notification.update({ isRead: true }, { where: { id: req.params.id } });
    const unreadCount = await Notification.count({ where: { isRead: false } });
    res.json({ success: true, unreadCount });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// PATCH /api/notifications/read-all
const markAllRead = async (req, res) => {
  try {
    await Notification.update({ isRead: true }, { where: { isRead: false } });
    res.json({ success: true, unreadCount: 0 });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = { getNotifications, markRead, markAllRead };
