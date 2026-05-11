import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, LowerCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InvoiceService } from '../../../core/services/invoice.service';
import { InvoiceResponse, InvoiceStatus } from '../../../core/models/invoice.models';
import { PageResponse } from '../../../core/models/page.models';

const STATUS_FILTERS: { label: string; value: InvoiceStatus | null }[] = [
  { label: 'All',     value: null },
  { label: 'Draft',   value: 'DRAFT' },
  { label: 'Sent',    value: 'SENT' },
  { label: 'Paid',    value: 'PAID' },
  { label: 'Overdue', value: 'OVERDUE' },
];

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, LowerCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>Invoices</h1>
        <p>Track and manage all your invoices</p>
      </div>
      <a routerLink="/invoices/new" class="btn btn--primary">+ New invoice</a>
    </div>

    <!-- Status filter tabs -->
    <div class="filter-tabs mb-6">
      @for (f of filters; track f.label) {
        <button class="filter-tab"
                [class.active]="activeFilter() === f.value"
                (click)="setFilter(f.value)">
          {{ f.label }}
        </button>
      }
    </div>

    <div class="card">
      @if (loading()) {
        <div class="loading-overlay"><div class="spinner spinner--lg"></div></div>
      } @else if (page()?.content?.length === 0) {
        <div class="empty-state">
          <span class="empty-icon">🧾</span>
          <h3>No invoices found</h3>
          <p>Create your first invoice to get started.</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Number</th>
                <th>Client</th>
                <th>Issue date</th>
                <th>Due date</th>
                <th>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (inv of page()?.content; track inv.id) {
                <tr>
                  <td class="font-semibold">{{ inv.invoiceNumber }}</td>
                  <td>{{ inv.client.name }}</td>
                  <td class="text-muted">{{ inv.issueDate }}</td>
                  <td class="text-muted" [class.overdue-date]="isOverdue(inv)">{{ inv.dueDate }}</td>
                  <td class="font-semibold">{{ inv.total | currency }}</td>
                  <td><span class="badge badge--{{ inv.status | lowercase }}">{{ inv.status }}</span></td>
                  <td>
                    <a [routerLink]="['/invoices', inv.id]" class="btn btn--ghost btn--sm">View</a>
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
  `,
  styles: [`
    .filter-tabs { display: flex; gap: var(--space-2); flex-wrap: wrap; }
    .filter-tab {
      padding: 6px 14px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      background: var(--color-surface);
      transition: all var(--transition);
      &:hover { border-color: var(--color-primary); color: var(--color-primary); }
      &.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
    }
    .overdue-date { color: var(--color-danger); font-weight: 600; }
  `]
})
export class InvoiceListComponent implements OnInit {
  private invoiceService = inject(InvoiceService);

  protected filters       = STATUS_FILTERS;
  protected loading       = signal(true);
  protected page          = signal<PageResponse<InvoiceResponse> | null>(null);
  protected currentPage   = signal(0);
  protected activeFilter  = signal<InvoiceStatus | null>(null);

  protected pages() {
    return Array.from({ length: this.page()?.totalPages ?? 0 }, (_, i) => i);
  }

  ngOnInit() { this.load(); }

  private load() {
    this.loading.set(true);
    this.invoiceService.getAll(this.currentPage(), 20, this.activeFilter() ?? undefined).subscribe({
      next: p  => { this.page.set(p); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  protected setFilter(status: InvoiceStatus | null) {
    this.activeFilter.set(status);
    this.currentPage.set(0);
    this.load();
  }

  protected goTo(p: number) {
    this.currentPage.set(p);
    this.load();
  }

  protected isOverdue(inv: InvoiceResponse) {
    return inv.status === 'SENT' && new Date(inv.dueDate) < new Date();
  }
}
