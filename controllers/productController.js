const Product = require("../models/Product");

const getCatalogProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });

    res.json({
      message: "Catalog fetched successfully",
      products,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await Product.find({})
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 });

    res.json({
      message: "Products fetched successfully",
      products,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const {
      productId,
      name,
      category,
      description,
      price,
      discountPrice,
      stockQuantity,
      image,
    } = req.body;

    if (
      !productId ||
      !name ||
      !category ||
      !description ||
      price === undefined ||
      stockQuantity === undefined ||
      !image
    ) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const product = await Product.create({
      productId: String(productId).trim(),
      name,
      category,
      description,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : 0,
      stockQuantity: Number(stockQuantity),
      image,
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    if (error.code === 11000 && error.keyValue?.productId) {
      return res.status(400).json({ message: "Product ID already exists. Use a different Product ID." });
    }

    res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      message: "Product deleted successfully",
      productId: product._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createProduct, deleteProduct, getCatalogProducts, getProducts };
