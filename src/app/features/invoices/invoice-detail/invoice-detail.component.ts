import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input, OnInit, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe, LowerCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith } from 'rxjs';
import { InvoiceService } from '../../../core/services/invoice.service';
import { PaymentService } from '../../../core/services/payment.service';
import { InvoiceResponse } from '../../../core/models/invoice.models';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CurrencyPipe, LowerCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <a routerLink="/invoices" class="back-link">← Invoices</a>
        <h1>{{ invoice()?.invoiceNumber }}</h1>
      </div>
      <div class="flex gap-3">
        @if (invoice()?.status !== 'PAID') {
          <a [routerLink]="['/invoices', id, 'edit']" class="btn btn--secondary">Edit</a>
        }
        @if (invoice()?.status === 'SENT' || invoice()?.status === 'OVERDUE') {
          <button class="btn btn--primary" (click)="showPayment.set(true)">Record payment</button>
        }
      </div>
    </div>

    @if (loading()) {
      <div class="loading-overlay"><div class="spinner spinner--lg"></div></div>
    } @else if (invoice()) {
      <div class="detail-grid">
        <!-- Left column -->
        <div>
          <div class="card mb-6">
            <div class="inv-meta">
              <div>
                <span class="meta-label">Status</span>
                <span class="badge badge--{{ invoice()!.status | lowercase }}">{{ invoice()!.status }}</span>
              </div>
              <div>
                <span class="meta-label">Client</span>
                <a [routerLink]="['/clients', invoice()!.client.id]" class="client-link">
                  {{ invoice()!.client.name }}
                </a>
              </div>
              <div>
                <span class="meta-label">Issue date</span>
                <span>{{ invoice()!.issueDate }}</span>
              </div>
              <div>
                <span class="meta-label">Due date</span>
                <span [class.overdue]="isOverdue()">{{ invoice()!.dueDate }}</span>
              </div>
            </div>
          </div>

          <div class="card">
            <h3 class="section-title">Line items</h3>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align:right">Qty</th>
                  <th style="text-align:right">Unit price</th>
                  <th style="text-align:right">Amount</th>
                </tr>
              </thead>
              <tbody>
                @for (item of invoice()!.items; track item.id) {
                  <tr>
                    <td>{{ item.description }}</td>
                    <td style="text-align:right">{{ item.quantity }}</td>
                    <td style="text-align:right">{{ item.unitPrice | currency }}</td>
                    <td style="text-align:right" class="font-semibold">{{ item.amount | currency }}</td>
                  </tr>
                }
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row"><span>Subtotal</span><span>{{ invoice()!.subtotal | currency }}</span></div>
              <div class="total-row"><span>Tax ({{ invoice()!.taxRate }}%)</span><span>{{ invoice()!.taxAmount | currency }}</span></div>
              <div class="total-row total-row--grand"><span>Total</span><span>{{ invoice()!.total | currency }}</span></div>
            </div>
          </div>
        </div>

        <!-- Right column: payments -->
        <div>
          <div class="card">
            <h3 class="section-title">Payments</h3>

            <div class="balance-bar">
              <div class="balance-fill" [style.width.%]="paidPercent()"></div>
            </div>
            <div class="balance-labels">
              <span class="text-sm text-muted">Paid: {{ totalPaid() | currency }}</span>
              <span class="text-sm text-muted">Remaining: {{ remaining() | currency }}</span>
            </div>

            @if (invoice()!.payments.length === 0) {
              <p class="text-muted text-sm mt-4">No payments recorded yet.</p>
            } @else {
              <div class="payment-list mt-4">
                @for (p of invoice()!.payments; track p.id) {
                  <div class="payment-item">
                    <div>
                      <span class="font-semibold">{{ p.amount | currency }}</span>
                      <span class="text-muted text-sm"> · {{ p.paymentDate }}</span>
                    </div>
                    <span class="badge badge--paid">{{ p.method }}</span>
                  </div>
                }
              </div>
            }
          </div>

          @if (invoice()!.notes) {
            <div class="card mt-6">
              <h3 class="section-title">Notes</h3>
              <p class="text-muted text-sm">{{ invoice()!.notes }}</p>
            </div>
          }
        </div>
      </div>
    }

    <!-- Payment modal -->
    @if (showPayment()) {
      <div class="modal-backdrop" (click)="onBackdrop($event)">
        <div class="modal" role="dialog">
          <div class="modal__header">
            <h2>Record payment</h2>
            <button class="btn btn--ghost btn--sm" (click)="closePaymentModal()">✕</button>
          </div>

          <form [formGroup]="paymentForm" (ngSubmit)="submitPayment()">
            <div class="modal__body">
              <div class="form-row">
                <div class="form-group">
                  <label class="amount-label">
                    Amount *
                    <span class="balance-hint">Balance: {{ remaining() | currency }}</span>
                  </label>
                  <input type="number" class="form-control"
                         [class.is-invalid]="amountError()"
                         formControlName="amount"
                         step="0.01" placeholder="0.00" />
                  @if (amountError()) {
                    <span class="form-error">{{ amountError() }}</span>
                  }
                </div>
                <div class="form-group">
                  <label>Date *</label>
                  <input type="date" class="form-control" formControlName="paymentDate" />
                </div>
              </div>
              <div class="form-group mt-4">
                <label>Method *</label>
                <select class="form-control" formControlName="method">
                  <option value="BANK_TRANSFER">Bank transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CREDIT_CARD">Credit card</option>
                  <option value="CHECK">Check</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div class="form-group mt-4">
                <label>Reference</label>
                <input type="text" class="form-control" formControlName="reference" placeholder="TXN-12345" />
              </div>
            </div>
            <div class="modal__footer">
              <button type="button" class="btn btn--secondary" (click)="closePaymentModal()">Cancel</button>
              <button type="submit" class="btn btn--primary"
                      [disabled]="paymentLoading() || !!amountError()"
                      [title]="amountError() ?? ''">
                @if (paymentLoading()) { <span class="spinner"></span> }
                Save payment
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .back-link { font-size: var(--font-size-sm); color: var(--color-text-secondary); display: block; margin-bottom: var(--space-2); &:hover { color: var(--color-primary); } }
    .detail-grid {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: var(--space-6);
      @media (max-width: 900px) { grid-template-columns: 1fr; }
    }
    .section-title { font-size: var(--font-size-xs); font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--color-text-secondary); margin-bottom: var(--space-4); }

    .inv-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
      @media (max-width: 480px) { grid-template-columns: 1fr; }
    }
    .meta-label { display: block; font-size: var(--font-size-xs); text-transform: uppercase; letter-spacing: .04em; color: var(--color-text-muted); margin-bottom: 4px; }
    .client-link { color: var(--color-primary); font-weight: 600; &:hover { text-decoration: underline; } }
    .overdue { color: var(--color-danger); font-weight: 600; }

    .totals { display: flex; flex-direction: column; align-items: flex-end; gap: var(--space-2); margin-top: var(--space-4); }
    .total-row { display: flex; gap: var(--space-8); font-size: var(--font-size-sm); color: var(--color-text-secondary); min-width: 220px; justify-content: space-between; }
    .total-row--grand { font-size: var(--font-size-md); font-weight: 700; color: var(--color-text); padding-top: var(--space-2); border-top: 2px solid var(--color-border); }

    .balance-bar { height: 8px; background: var(--color-border); border-radius: var(--radius-full); overflow: hidden; margin-bottom: var(--space-2); }
    .balance-fill { height: 100%; background: var(--color-success); border-radius: var(--radius-full); transition: width .4s ease; }
    .balance-labels { display: flex; justify-content: space-between; }

    .payment-list { display: flex; flex-direction: column; gap: var(--space-3); }
    .payment-item { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3); background: var(--color-bg); border-radius: var(--radius-md); }
    .amount-label { display: flex; justify-content: space-between; align-items: baseline; width: 100%; }
    .balance-hint { color: var(--color-text-secondary); font-size: var(--font-size-xs); font-weight: 400; }
  `]
})
export class InvoiceDetailComponent implements OnInit {
  @Input() id!: string;

  private invoiceService = inject(InvoiceService);
  private paymentService = inject(PaymentService);
  private fb  = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  protected loading       = signal(true);
  protected invoice       = signal<InvoiceResponse | null>(null);
  protected showPayment   = signal(false);
  protected paymentLoading = signal(false);
  protected paymentError  = signal<string | null>(null);

  protected totalPaid = computed(() =>
    (this.invoice()?.payments ?? []).reduce((s, p) => s + p.amount, 0)
  );
  protected remaining = computed(() =>
    (this.invoice()?.total ?? 0) - this.totalPaid()
  );
  protected paidPercent = computed(() => {
    const total = this.invoice()?.total ?? 0;
    return total === 0 ? 0 : Math.min(100, (this.totalPaid() / total) * 100);
  });
  protected isOverdue = computed(() => {
    const inv = this.invoice();
    return inv?.status === 'SENT' && new Date(inv.dueDate) < new Date();
  });

  protected paymentForm = this.fb.nonNullable.group({
    amount:      [null as unknown as number, [Validators.required, Validators.min(0.01)]],
    paymentDate: [new Date().toISOString().split('T')[0], Validators.required],
    method:      ['BANK_TRANSFER', Validators.required],
    reference:   [''],
    notes:       ['']
  });

  private amountValue = toSignal(
    this.paymentForm.get('amount')!.valueChanges.pipe(startWith(null))
  );

  protected amountError = computed<string | null>(() => {
    const val = Number(this.amountValue());
    if (!val || val <= 0)          return 'Enter a valid amount';
    if (val > this.remaining())    return `Exceeds remaining balance of ${this.remaining().toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`;
    return null;
  });

  ngOnInit() { this.load(); }

  private load() {
    this.loading.set(true);
    this.invoiceService.getById(Number(this.id)).subscribe({
      next: inv => { this.invoice.set(inv); this.loading.set(false); },
      error: ()  => this.loading.set(false)
    });
  }

  protected closePaymentModal() {
    this.showPayment.set(false);
    this.paymentError.set(null);
    this.paymentForm.reset({ paymentDate: new Date().toISOString().split('T')[0], method: 'BANK_TRANSFER' });
  }

  protected onBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closePaymentModal();
    }
  }

  protected submitPayment() {
    if (this.amountError()) return;
    this.paymentLoading.set(true);

    const v = this.paymentForm.getRawValue();
    this.paymentService.create(Number(this.id), {
      ...v,
      amount: Number(v.amount),
      method: v.method as import('../../../core/models/payment.models').PaymentMethod
    }).subscribe({
      next: () => {
        this.paymentLoading.set(false);
        this.closePaymentModal();
        this.load();
      },
      error: (err) => {
        this.paymentLoading.set(false);
        this.paymentError.set(err.error?.detail ?? err.message ?? 'Payment failed');
        this.cdr.markForCheck();
      }
    });
  }
}
