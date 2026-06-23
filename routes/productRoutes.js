const express = require("express");
const router = express.Router();

const { createProduct, deleteProduct, getCatalogProducts, getProducts } = require("../controllers/productController");
const { protectAdmin } = require("../middleware/authMiddleware");

router.get("/catalog", getCatalogProducts);
router.get("/", protectAdmin, getProducts);
router.post("/", protectAdmin, createProduct);
router.delete("/:id", protectAdmin, deleteProduct);

module.exports = router;
