import axios from 'axios';

// Contact API configuration
const CONTACT_API_URL = '/api/contact'; // Proxied to your backend

// Create axios instance for Contact API
const contactAPI = axios.create({
  baseURL: CONTACT_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
  error?: string;
  details?: string;
}

export const contactService = {
  async sendMessage(data: ContactFormData): Promise<ContactResponse> {
    try {
      const response = await contactAPI.post<ContactResponse>('', data);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send message';
      const errorDetails = error.response?.data?.details;
      throw {
        message: errorMessage,
        details: errorDetails,
        status: error.response?.status || 500,
      };
    }
  },
};

