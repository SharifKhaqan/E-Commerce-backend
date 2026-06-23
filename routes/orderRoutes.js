const express = require("express");
const router = express.Router();

const { createOrder, getOrders, updateOrderStatus } = require("../controllers/orderController");
const { protect, protectAdmin } = require("../middleware/authMiddleware");

router.get("/", protectAdmin, getOrders);
router.post("/", protect, createOrder);
router.patch("/:id/status", protectAdmin, updateOrderStatus);

module.exports = router;
