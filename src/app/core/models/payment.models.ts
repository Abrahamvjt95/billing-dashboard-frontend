export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CHECK' | 'OTHER';

export interface PaymentResponse {
  id: number;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  reference: string;
  notes: string;
  createdAt: string;
}

export interface PaymentRequest {
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}
