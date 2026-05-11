import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PaymentRequest, PaymentResponse } from '../models/payment.models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/invoices`;

  getByInvoice(invoiceId: number) {
    return this.http.get<PaymentResponse[]>(`${this.base}/${invoiceId}/payments`);
  }

  create(invoiceId: number, body: PaymentRequest) {
    return this.http.post<PaymentResponse>(`${this.base}/${invoiceId}/payments`, body);
  }
}
