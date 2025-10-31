const ChapaService = require('../services/chapa.service');

exports.initializePayment = async (req, res) => {
  try {
    const paymentData = {
      ...req.body,
      currency: 'ETB', // Force ETB currency
      callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
      return_url: `${process.env.FRONTEND_URL}/payment/return`
    };

    const response = await ChapaService.initializePayment(paymentData);
    res.json(response);
  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Handle Chapa payment callback
exports.handlePaymentCallback = async (req, res) => {
  try {
    const { tx_ref } = req.query; // Assuming tx_ref is in query parameters for GET
    if (!tx_ref) {
      return res.status(400).json({ error: 'Transaction reference is required' });
    }

    // Verify the payment
    const verificationResult = await ChapaService.verifyPayment(tx_ref);

    // Process the verification result (e.g., update booking status in your database)
    console.log('Payment callback received:', verificationResult);

    // Send a success response (Chapa expects a 200 OK)
    res.status(200).json({ status: 'success', data: verificationResult });

  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(500).json({ error: error.message || 'Payment callback failed' });
  }
};

// Handle Chapa payment return
exports.handlePaymentReturn = async (req, res) => {
  try {
    // You can add logic here to redirect the user to your frontend success or failure page
    // based on query parameters or session data
    console.log('Payment return received:', req.query);
    res.status(200).send('Payment process completed. You can close this page.');
  } catch (error) {
    console.error('Payment return error:', error);
    res.status(500).json({ error: error.message || 'Payment return failed' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { tx_ref } = req.params;
    const response = await ChapaService.verifyPayment(tx_ref);
    res.json(response);
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.paymentWebhook = async (req, res) => {
  try {
    // Verify the webhook signature here (Chapa provides this)
    const paymentData = req.body;
    
    // Process the payment data (save to database, etc.)
    console.log('Webhook received:', paymentData);
    
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
};