const express = require("express");
const router = express.Router();

const { createCheckoutSession, createPaymentIntent } = require("../controllers/paymentController");

router.post("/create-checkout-session", createCheckoutSession);
router.post("/create-payment-intent", createPaymentIntent);

module.exports = router;
