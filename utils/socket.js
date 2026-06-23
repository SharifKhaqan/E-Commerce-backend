let ioInstance = null;

function setIO(io) {
  ioInstance = io;
}

function getIO() {
  return ioInstance;
}

function emitNotification(notification) {
  if (!ioInstance) {
    return;
  }

  if (notification.recipientRole === "admin") {
    ioInstance.to("admins").emit("notification:new", notification);
    return;
  }

  if (notification.recipient) {
    ioInstance.to(`user:${notification.recipient}`).emit("notification:new", notification);
  }
}

function emitInventoryUpdate(products, meta = {}) {
  if (!ioInstance) {
    return;
  }

  ioInstance.emit("inventory:updated", {
    products,
    ...meta,
  });
}

module.exports = { emitInventoryUpdate, emitNotification, getIO, setIO };
