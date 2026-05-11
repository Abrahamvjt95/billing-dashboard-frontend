import { ChangeDetectionStrategy, Component, inject, Input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';
import { ClientResponse } from '../../../core/models/client.models';
import { ClientFormComponent } from '../client-form/client-form.component';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [RouterLink, ClientFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <a routerLink="/clients" class="back-link">← Clients</a>
        <h1>{{ client()?.name }}</h1>
      </div>
      <button class="btn btn--secondary" (click)="showForm.set(true)">Edit</button>
    </div>

    @if (loading()) {
      <div class="loading-overlay"><div class="spinner spinner--lg"></div></div>
    } @else if (client()) {
      <div class="detail-grid">
        <div class="card">
          <h3 class="section-title">Contact info</h3>
          <dl class="info-list">
            <dt>Email</dt>   <dd>{{ client()!.email || '—' }}</dd>
            <dt>Phone</dt>   <dd>{{ client()!.phone || '—' }}</dd>
            <dt>Address</dt> <dd>{{ client()!.address || '—' }}</dd>
            <dt>Tax ID</dt>  <dd>{{ client()!.taxId || '—' }}</dd>
          </dl>
        </div>

        @if (client()!.notes) {
          <div class="card">
            <h3 class="section-title">Notes</h3>
            <p class="text-muted text-sm">{{ client()!.notes }}</p>
          </div>
        }
      </div>
    }

    @if (showForm()) {
      <app-client-form
        [client]="client()!"
        (saved)="onSaved()"
        (cancelled)="showForm.set(false)" />
    }
  `,
  styles: [`
    .back-link {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      display: block;
      margin-bottom: var(--space-2);
      &:hover { color: var(--color-primary); }
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-6);
      @media (max-width: 640px) { grid-template-columns: 1fr; }
    }
    .section-title { font-size: var(--font-size-sm); font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--color-text-secondary); margin-bottom: var(--space-4); }
    .info-list {
      display: grid; grid-template-columns: 120px 1fr; gap: var(--space-2) var(--space-4);
      font-size: var(--font-size-sm);
      dt { color: var(--color-text-secondary); }
      dd { font-weight: 500; }
    }
  `]
})
export class ClientDetailComponent implements OnInit {
  @Input() id!: string;

  private service = inject(ClientService);

  protected loading  = signal(true);
  protected client   = signal<ClientResponse | null>(null);
  protected showForm = signal(false);

  ngOnInit() { this.load(); }

  private load() {
    this.loading.set(true);
    this.service.getById(Number(this.id)).subscribe({
      next: c  => { this.client.set(c); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  protected onSaved() {
    this.showForm.set(false);
    this.load();
  }
}
