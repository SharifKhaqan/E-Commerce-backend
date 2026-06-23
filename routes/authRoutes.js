const express = require("express");
const router = express.Router();

const { deleteUser, registerUser, loginUser, getUsers } = require("../controllers/authController");
const { protectAdmin } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/users", protectAdmin, getUsers);
router.delete("/users/:id", protectAdmin, deleteUser);

module.exports = router;
