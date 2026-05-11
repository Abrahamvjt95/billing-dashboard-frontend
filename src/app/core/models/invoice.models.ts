import { ClientResponse } from './client.models';
import { PaymentResponse } from './payment.models';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';

export interface InvoiceResponse {
  id: number;
  invoiceNumber: string;
  status: InvoiceStatus;
  client: ClientResponse;
  issueDate: string;
  dueDate: string;
  notes: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  items: InvoiceItemResponse[];
  payments: PaymentResponse[];
  createdAt: string;
}

export interface InvoiceItemResponse {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceRequest {
  clientId: number;
  invoiceNumber: string;
  status?: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  notes?: string;
  taxRate: number;
  items: InvoiceItemRequest[];
}

export interface InvoiceItemRequest {
  description: string;
  quantity: number;
  unitPrice: number;
}
