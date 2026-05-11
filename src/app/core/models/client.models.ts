export interface ClientResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  notes: string;
  createdAt: string;
}

export interface ClientRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  notes?: string;
}
