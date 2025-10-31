// types/chapa.ts
export interface ChapaPaymentRequest {
  amount: number;
  currency: 'ETB' | 'USD';
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
  description: string;
  payment_options?: string[];
  meta?: Record<string, any>;
}

export interface ChapaPaymentResponse {
  message: string;
  status: string;
  data: {
    checkout_url: string;
  };
}

export interface ChapaVerificationResponse {
  message: string;
  status: string;
  data: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    currency: string;
    amount: number;
    charge: number;
    mode: string;
    method: string;
    type: string;
    status: string;
    reference: string;
    tx_ref: string;
    customization: any;
    meta: any;
    created_at: string;
    updated_at: string;
  };
}
export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;  // Now contains image paths
  type: string;
}