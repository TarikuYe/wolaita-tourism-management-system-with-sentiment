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
}

module.exports = ChapaService;