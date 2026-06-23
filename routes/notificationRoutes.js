const express = require("express");
const router = express.Router();

const {
  getNotifications,
  markNotificationRead,
  markNotificationsRead,
  deleteNotification,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getNotifications);
router.patch("/:id/read", protect, markNotificationRead);
router.patch("/read", protect, markNotificationsRead);
router.delete("/:id", protect, deleteNotification);

module.exports = router;
