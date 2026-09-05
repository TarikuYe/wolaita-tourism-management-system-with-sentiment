const axios = require('axios');
const config = require('../config/chapa.config');

class ChapaService {
  static async initializePayment(paymentData) {
    try {
      const response = await axios.post(
        `${config.baseUrl}/transaction/initialize`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${config.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Chapa initialization error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Payment initialization failed');
    }
  }

  static async verifyPayment(txRef) {
    try {
      const response = await axios.get(
        `${config.baseUrl}/transaction/verify/${txRef}`,
        {
          headers: {
            'Authorization': `Bearer ${config.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Chapa verification error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Payment verification failed');
    }
  }

  static async processRefund(refundData) {
    // Note: Chapa API does not support automated refunds via API endpoint
    // Error from Chapa: "The POST method is not supported for route v1/transaction/refund. Supported methods: GET, HEAD."
    // This indicates Chapa refunds must be processed manually through their dashboard
    // This method throws an error with a clear message indicating manual processing is required
    
    console.log('Chapa refund requested for txRef:', refundData.txRef);
    console.log('Chapa API does not support automated refunds - manual processing required');
    
    // Create a custom error with details for manual processing
    const error = new Error('Chapa API does not support automated refunds. Please process refund manually through Chapa dashboard using transaction reference: ' + refundData.txRef);
    error.code = 'MANUAL_REFUND_REQUIRED';
    error.txRef = refundData.txRef;
    error.amount = refundData.amount;
    error.reason = refundData.reason;
    
    throw error;
  }
}

module.exports = ChapaService;