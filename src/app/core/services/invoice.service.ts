import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { InvoiceRequest, InvoiceResponse, InvoiceStatus } from '../models/invoice.models';
import { PageResponse } from '../models/page.models';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/invoices`;

  getAll(page = 0, size = 20, status?: InvoiceStatus) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    return this.http.get<PageResponse<InvoiceResponse>>(this.base, { params });
  }

  getById(id: number) {
    return this.http.get<InvoiceResponse>(`${this.base}/${id}`);
  }

  create(body: InvoiceRequest) {
    return this.http.post<InvoiceResponse>(this.base, body);
  }

  update(id: number, body: InvoiceRequest) {
    return this.http.put<InvoiceResponse>(`${this.base}/${id}`, body);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
