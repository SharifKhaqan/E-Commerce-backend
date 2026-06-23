const Notification = require("../models/Notification");
const { emitNotification } = require("../utils/socket");

async function createNotification(data) {
  const notification = await Notification.create(data);
  emitNotification(notification);
  return notification;
}

const getNotifications = async (req, res) => {
  try {
    const query =
      req.user.role === "admin"
        ? { recipientRole: "admin" }
        : { recipientRole: "user", recipient: req.user.id };

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(30);

    res.json({
      message: "Notifications fetched successfully",
      notifications,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markNotificationsRead = async (req, res) => {
  try {
    const query =
      req.user.role === "admin"
        ? { recipientRole: "admin", read: false }
        : { recipientRole: "user", recipient: req.user.id, read: false };

    await Notification.updateMany(query, { read: true });

    res.json({ message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const query =
      req.user.role === "admin"
        ? { _id: req.params.id, recipientRole: "admin" }
        : { _id: req.params.id, recipientRole: "user", recipient: req.user.id };

    const notification = await Notification.findOneAndUpdate(
      query,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const query =
      req.user.role === "admin"
        ? { _id: req.params.id, recipientRole: "admin" }
        : { _id: req.params.id, recipientRole: "user", recipient: req.user.id };

    const notification = await Notification.findOneAndDelete(query);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createNotification, getNotifications, markNotificationRead, markNotificationsRead, deleteNotification };
