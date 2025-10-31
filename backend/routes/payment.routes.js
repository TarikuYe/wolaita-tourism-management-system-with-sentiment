const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// Initialize payment
router.post('/initialize', paymentController.initializePayment);

// Verify payment
router.get('/verify/:tx_ref', paymentController.verifyPayment);

// Webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.paymentWebhook);

// Handle Chapa payment callback
router.get('/payment/callback', paymentController.handlePaymentCallback);

// Handle Chapa payment return
router.get('/payment/return', paymentController.handlePaymentReturn);

module.exports = router;