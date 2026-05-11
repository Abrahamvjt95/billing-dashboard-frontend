import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ClientRequest, ClientResponse } from '../models/client.models';
import { PageResponse } from '../models/page.models';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/clients`;

  getAll(page = 0, size = 20) {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<ClientResponse>>(this.base, { params });
  }

  getById(id: number) {
    return this.http.get<ClientResponse>(`${this.base}/${id}`);
  }

  create(body: ClientRequest) {
    return this.http.post<ClientResponse>(this.base, body);
  }

  update(id: number, body: ClientRequest) {
    return this.http.put<ClientResponse>(`${this.base}/${id}`, body);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
