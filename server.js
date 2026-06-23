const express = require("express");
const cors = require("cors");
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
require("dotenv").config();

// DB connection
const connectDB = require("./config/db");
connectDB();

// Routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const { setIO } = require("./utils/socket");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"],
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Not authorized"));
  }

  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  if (socket.user.role === "admin") {
    socket.join("admins");
  }

  socket.join(`user:${socket.user.id}`);
});

setIO(io);

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Test route
app.get("/", (req, res) => {
  res.send("E-commerce API Running");
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentRoutes);

// PORT
const PORT = process.env.PORT || 5000;

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
