import axios from 'axios';
import { ChapaPaymentRequest, ChapaPaymentResponse, ChapaVerificationResponse } from '../types/chapa';

// Chapa API configuration
const CHAPA_BASE_URL = '/api/chapa'; // Proxied to your backend
const CHAPA_PUBLIC_KEY = import.meta.env.VITE_CHAPA_PUBLIC_KEY;

// Create axios instance for Chapa API
const chapaAPI = axios.create({
  baseURL: CHAPA_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 60000,
});

// Interceptors for debugging
chapaAPI.interceptors.request.use(
  (config) => {
    console.log('Chapa API Request:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
    });
    return config;
  },
  (error) => {
    console.error('Chapa API Request Error:', error);
    return Promise.reject(error);
  }
);

chapaAPI.interceptors.response.use(
  (response) => {
    console.log('Chapa API Response:', {
      status: response.status,
      data: response.data,
      url: response.config.url,
    });
    return response;
  },
  (error) => {
    console.error('Chapa API Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url,
    });
    return Promise.reject(error);
  }
);

export class ChapaService {
  static isConfigured(): boolean {
    return !!CHAPA_PUBLIC_KEY;
  }

  static validateApiKeys(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!CHAPA_PUBLIC_KEY) {
      errors.push('VITE_CHAPA_PUBLIC_KEY is not set');
    } else if (!CHAPA_PUBLIC_KEY.startsWith('CHAPUBK_')) {
      errors.push('Public key should start with CHAPUBK_');
    }
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static async initializePayment(paymentData: ChapaPaymentRequest): Promise<ChapaPaymentResponse> {
    try {
      const response = await chapaAPI.post('/initialize', paymentData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message);
    }
  }

  static async verifyPayment(txRef: string): Promise<ChapaVerificationResponse> {
    try {
      const response = await chapaAPI.get(`/verify/${txRef}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message);
    }
  }

  static testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      return Promise.resolve(false);
    }

    const validation = this.validateApiKeys();
    if (!validation.isValid) {
      return Promise.resolve(false);
    }

    // No real test API for Chapa; assume OK if configured
    return Promise.resolve(true);
  }

  static async getConnectionStatus() {
    const errors: string[] = [];
    const configured = this.isConfigured();
    if (!configured) errors.push('API keys not configured');

    const validation = this.validateApiKeys();
    if (!validation.isValid) errors.push(...validation.errors);

    const connected = await this.testConnection();
    if (!connected) errors.push('Connection test failed');

    return {
      configured,
      keysValid: validation.isValid,
      connected,
      errors,
    };
  }

  static generateTxRef(prefix = 'WOLAITA'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  static convertUSDToETB(usdAmount: number): number {
    const exchangeRate = 55;
    return Math.round(usdAmount * exchangeRate * 100) / 100;
  }

  static formatAmount(amount: number, currency: 'ETB' | 'USD'): number {
    return currency === 'ETB' ? Math.round(amount) : Math.round(amount * 100) / 100;
  }

  static validatePaymentData(data: ChapaPaymentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.amount || data.amount <= 0) errors.push('Amount must be greater than 0');
    if (data.amount > 1000000) errors.push('Amount is too large');
    if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) errors.push('Valid email is required');
    if (!data.first_name || data.first_name.trim().length < 1) errors.push('First name is required');
    if (!data.last_name || data.last_name.trim().length < 1) errors.push('Last name is required');
    if (!data.tx_ref || data.tx_ref.trim().length < 5) errors.push('Transaction reference is required');
    if (!data.callback_url || !data.return_url) errors.push('Callback and return URLs are required');

    try {
      new URL(data.callback_url);
      new URL(data.return_url);
    } catch {
      errors.push('Invalid callback or return URL format');
    }

    if (data.phone_number) {
      const phoneRegex = /^(\+251|0)?[9][0-9]{8}$/;
      if (!phoneRegex.test(data.phone_number.replace(/\s/g, ''))) {
        errors.push('Phone number must be a valid Ethiopian number');
      }
    }

    if (!['ETB', 'USD'].includes(data.currency)) {
      errors.push('Currency must be ETB or USD');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static formatPhoneNumber(phone: string): string | undefined {
    if (!phone) return undefined;
    let cleaned = phone.replace(/[^\d+]/g, '');

    if (cleaned.startsWith('0')) {
      cleaned = '+251' + cleaned.substring(1);
    } else if (cleaned.startsWith('251')) {
      cleaned = '+' + cleaned;
    } else if (!cleaned.startsWith('+251')) {
      cleaned = '+251' + cleaned;
    }

    return /^\+251[9][0-9]{8}$/.test(cleaned) ? cleaned : undefined;
  }

  static getPublicKey(): string {
    return CHAPA_PUBLIC_KEY || '';
  }

  static openPaymentPopup(checkoutUrl: string): Window | null {
    const popup = window.open(
      checkoutUrl,
      'chapa-payment',
      `width=800,height=700,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no,left=${window.screen.width / 2 - 400},top=${window.screen.height / 2 - 350}`
    );

    if (!popup) {
      window.location.href = checkoutUrl;
      return null;
    }

    return popup;
  }

  static getPaymentMethods() {
    return [
      { id: 'telebirr', name: 'Telebirr', description: 'Pay with Telebirr mobile wallet', icon: '/images/payment/telebirr.png', type: 'mobile_money' },
      { id: 'cbebirr', name: 'CBE Birr', description: 'Commercial Bank of Ethiopia mobile banking', icon: '/images/payment/cbebirr.png', type: 'mobile_money' },
      { id: 'ebirr', name: 'eBirr', description: 'National Bank of Ethiopia mobile wallet', icon: '/images/payment/ebirr.png', type: 'mobile_money' },
      { id: 'amolebirr', name: 'Amole', description: 'Dashen Bank mobile wallet', icon: '/images/payment/amole.png', type: 'mobile_money' },
      { id: 'awashbirr', name: 'Awash Birr', description: 'Awash Bank mobile wallet', icon: '/images/payment/awashbirr.png', type: 'mobile_money' },
      { id: 'mpesa', name: 'M-Pesa', description: 'Safaricom mobile money', icon: '/images/payment/mpesa.png', type: 'mobile_money' },
      { id: 'visa', name: 'Visa Card', description: 'Pay with Visa debit/credit card', icon: '/images/payment/visa.png', type: 'card' },
      { id: 'mastercard', name: 'Mastercard', description: 'Pay with Mastercard debit/credit card', icon: '/images/payment/mastercard.png', type: 'card' },
    ];
  }
}
