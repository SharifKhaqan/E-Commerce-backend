const Order = require("../models/Order");
const Product = require("../models/Product");
const { createNotification } = require("./notificationController");
const { emitInventoryUpdate } = require("../utils/socket");

const orderStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

// Admin gets Order
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "username email phone")
      .populate("items.product", "name category")
      .sort({ createdAt: -1 });

    res.json({
      message: "Orders fetched successfully",
      orders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod = "Online payment" } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order must include at least one item" });
    }

    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId || item.product);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const quantity = Number(item.quantity);

      if (!quantity || quantity < 1) {
        return res.status(400).json({ message: "Each order item needs a valid quantity" });
      }

      const price = product.discountPrice > 0 ? product.discountPrice : product.price;

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity,
        price,
        image: product.image,
      });
    }

    const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const generateOrderId = () => {
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      const timestampPart = Date.now().toString().slice(-6);
      return `ORD-${timestampPart}-${randomPart}`;
    };

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || "Online payment",
      orderId: generateOrderId(),
    });

    const productIds = orderItems.map(item => item.product.toString()).join(", ");
    await createNotification({
      recipientRole: "admin",
      title: "New order placed",
      message: `Order ${order.orderId}: ${orderItems.length} item${orderItems.length === 1 ? "" : "s"} (Product IDs: ${productIds}).`,
      type: "order_created",
      order: order._id,
    });

    res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!orderStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findById(req.params.id).populate("user", "username email phone");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === status) {
      return res.json({
        message: "Order status is already up to date",
        order,
      });
    }

    const shouldDeductStock = status === "confirmed" && !order.stockDeducted;
    let updatedProducts = [];

    if (shouldDeductStock) {
      const productIds = order.items.map((item) => item.product);
      const products = await Product.find({ _id: { $in: productIds } });
      const productsById = new Map(products.map((product) => [product._id.toString(), product]));

      for (const item of order.items) {
        const product = productsById.get(item.product.toString());

        if (!product) {
          return res.status(404).json({ message: `${item.name} is no longer available` });
        }

        if (Number(product.stockQuantity) < Number(item.quantity)) {
          return res.status(400).json({
            message: `Not enough stock to confirm ${item.name}`,
          });
        }
      }

      await Product.bulkWrite(
        order.items.map((item) => ({
          updateOne: {
            filter: { _id: item.product },
            update: { $inc: { stockQuantity: -Number(item.quantity) } },
          },
        }))
      );

      updatedProducts = await Product.find({ _id: { $in: productIds } });
      order.stockDeducted = true;
    }

    order.status = status;
    await order.save();

    if (updatedProducts.length > 0) {
      emitInventoryUpdate(
        updatedProducts.map((product) => ({
          _id: product._id,
          stockQuantity: product.stockQuantity,
        })),
        { orderId: order._id }
      );
    }

    await createNotification({
      recipientRole: "user",
      recipient: order.user._id,
      title: "Order status updated",
      message: `Your order is now ${status}.`,
      type: "order_status",
      order: order._id,
    });

    res.json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createOrder, getOrders, updateOrderStatus };
