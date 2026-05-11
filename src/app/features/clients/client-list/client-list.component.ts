import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ClientService } from '../../../core/services/client.service';
import { ClientResponse } from '../../../core/models/client.models';
import { PageResponse } from '../../../core/models/page.models';
import { ClientFormComponent } from '../client-form/client-form.component';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [ClientFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>Clients</h1>
        <p>Manage your client directory</p>
      </div>
      <button class="btn btn--primary" (click)="openForm()">+ New client</button>
    </div>

    <div class="card">
      @if (loading()) {
        <div class="loading-overlay"><div class="spinner spinner--lg"></div></div>
      } @else if (page()?.content?.length === 0) {
        <div class="empty-state">
          <span class="empty-icon">👤</span>
          <h3>No clients yet</h3>
          <p>Add your first client to start creating invoices.</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Tax ID</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (client of page()?.content; track client.id) {
                <tr>
                  <td class="font-semibold">{{ client.name }}</td>
                  <td class="text-muted">{{ client.email || '—' }}</td>
                  <td class="text-muted">{{ client.phone || '—' }}</td>
                  <td class="text-muted">{{ client.taxId || '—' }}</td>
                  <td>
                    <div class="row-actions">
                      <button class="btn btn--ghost btn--sm" (click)="openForm(client)">Edit</button>
                      <button class="btn btn--danger btn--sm" (click)="confirmDelete(client)">Delete</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if ((page()?.totalPages ?? 0) > 1) {
          <div class="pagination">
            <button [disabled]="currentPage() === 0" (click)="goTo(currentPage() - 1)">‹</button>
            @for (p of pages(); track p) {
              <button [class.active]="p === currentPage()" (click)="goTo(p)">{{ p + 1 }}</button>
            }
            <button [disabled]="page()?.last" (click)="goTo(currentPage() + 1)">›</button>
          </div>
        }
      }
    </div>

    @if (showForm()) {
      <app-client-form
        [client]="editingClient()"
        (saved)="onSaved()"
        (cancelled)="showForm.set(false)" />
    }
  `,
  styles: [`
    .row-actions { display: flex; gap: var(--space-2); justify-content: flex-end; }
  `]
})
export class ClientListComponent implements OnInit {
  private clientService = inject(ClientService);

  protected loading       = signal(true);
  protected page          = signal<PageResponse<ClientResponse> | null>(null);
  protected currentPage   = signal(0);
  protected showForm      = signal(false);
  protected editingClient = signal<ClientResponse | undefined>(undefined);

  protected pages() {
    const total = this.page()?.totalPages ?? 0;
    return Array.from({ length: total }, (_, i) => i);
  }

  ngOnInit() { this.load(); }

  private load() {
    this.loading.set(true);
    this.clientService.getAll(this.currentPage()).subscribe({
      next: p  => { this.page.set(p); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  protected goTo(p: number) {
    this.currentPage.set(p);
    this.load();
  }

  protected openForm(client?: ClientResponse) {
    this.editingClient.set(client);
    this.showForm.set(true);
  }

  protected onSaved() {
    this.showForm.set(false);
    this.load();
  }

  protected confirmDelete(client: ClientResponse) {
    if (!confirm(`Delete "${client.name}"?`)) return;
    this.clientService.delete(client.id).subscribe(() => this.load());
  }
}
