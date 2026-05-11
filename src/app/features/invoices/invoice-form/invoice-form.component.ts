import {
  ChangeDetectionStrategy, Component, inject, Input, OnInit, signal, computed
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith } from 'rxjs';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { InvoiceService } from '../../../core/services/invoice.service';
import { ClientService } from '../../../core/services/client.service';
import { InvoiceResponse, InvoiceStatus } from '../../../core/models/invoice.models';
import { ClientResponse } from '../../../core/models/client.models';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <a [routerLink]="invoice ? ['/invoices', invoice.id] : '/invoices'" class="back-link">
          ← {{ invoice ? 'Invoice detail' : 'Invoices' }}
        </a>
        <h1>{{ (invoice || id) ? 'Edit invoice' : 'New invoice' }}</h1>
      </div>
    </div>

    @if (loading()) {
      <div class="loading-overlay"><div class="spinner spinner--lg"></div></div>
    }

    @if (error()) {
      <div class="alert alert--error">{{ error() }}</div>
    }

    <form [formGroup]="form" (ngSubmit)="submit()">
      <div class="form-layout">
        <!-- Left: main fields -->
        <div class="form-main">
          <div class="card mb-6">
            <h3 class="section-title">Invoice details</h3>

            <div class="form-row">
              <div class="form-group">
                <label>Invoice number *</label>
                <input type="text" class="form-control"
                       [class.is-invalid]="isInvalid('invoiceNumber')"
                       formControlName="invoiceNumber" placeholder="INV-001" />
                @if (isInvalid('invoiceNumber')) { <span class="form-error">Required</span> }
              </div>
              <div class="form-group">
                <label>Status</label>
                <select class="form-control" formControlName="status">
                  <option value="DRAFT">Draft</option>
                  <option value="SENT">Sent</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>
            </div>

            <div class="form-group mt-4">
              <label>Client *</label>
              <select class="form-control"
                      [class.is-invalid]="isInvalid('clientId')"
                      formControlName="clientId">
                <option value="">Select a client…</option>
                @for (c of clients(); track c.id) {
                  <option [value]="c.id">{{ c.name }}</option>
                }
              </select>
              @if (isInvalid('clientId')) { <span class="form-error">Required</span> }
            </div>

            <div class="form-row mt-4">
              <div class="form-group">
                <label>Issue date *</label>
                <input type="date" class="form-control" formControlName="issueDate" />
              </div>
              <div class="form-group">
                <label>Due date *</label>
                <input type="date" class="form-control" formControlName="dueDate" />
              </div>
            </div>

            <div class="form-row mt-4">
              <div class="form-group">
                <label>Tax rate (%)</label>
                <input type="number" class="form-control" formControlName="taxRate"
                       min="0" max="100" step="0.5" placeholder="0" />
              </div>
            </div>

            <div class="form-group mt-4">
              <label>Notes</label>
              <textarea class="form-control" formControlName="notes" rows="2"></textarea>
            </div>
          </div>

          <!-- Line items -->
          <div class="card">
            <div class="section-header">
              <h3 class="section-title">Line items</h3>
              <button type="button" class="btn btn--secondary btn--sm" (click)="addItem()">+ Add item</button>
            </div>

            <div class="items-header">
              <span>Description</span><span>Qty</span><span>Unit price</span><span>Amount</span><span></span>
            </div>

            @for (item of items.controls; track $index; let i = $index) {
              <div class="item-row" [formGroup]="getItemGroup(i)">
                <div class="item-field">
                  <input type="text" class="form-control"
                         [class.is-invalid]="isItemInvalid(i, 'description')"
                         formControlName="description" placeholder="Service or product…" />
                  @if (isItemInvalid(i, 'description')) {
                    <span class="form-error">Required</span>
                  }
                </div>
                <div class="item-field">
                  <input type="number" class="form-control"
                         [class.is-invalid]="isItemInvalid(i, 'quantity')"
                         formControlName="quantity" step="0.01" placeholder="1" />
                  @if (isItemInvalid(i, 'quantity')) {
                    <span class="form-error">&gt; 0</span>
                  }
                </div>
                <div class="item-field">
                  <input type="number" class="form-control"
                         [class.is-invalid]="isItemInvalid(i, 'unitPrice')"
                         formControlName="unitPrice" step="0.01" placeholder="0.00" />
                  @if (isItemInvalid(i, 'unitPrice')) {
                    <span class="form-error">&gt; 0</span>
                  }
                </div>
                <span class="item-amount">{{ itemAmount(i) | currency }}</span>
                <button type="button" class="btn btn--ghost btn--sm" (click)="removeItem(i)"
                        [disabled]="items.length === 1">✕</button>
              </div>
            }

            <div class="totals">
              <div class="total-row">
                <span>Subtotal</span>
                <span>{{ subtotal() | currency }}</span>
              </div>
              <div class="total-row">
                <span>Tax ({{ form.get('taxRate')?.value || 0 }}%)</span>
                <span>{{ taxAmount() | currency }}</span>
              </div>
              <div class="total-row total-row--grand">
                <span>Total</span>
                <span>{{ total() | currency }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions mt-6">
        <a [routerLink]="invoice ? ['/invoices', invoice.id] : '/invoices'"
           class="btn btn--secondary">Cancel</a>
        <div class="submit-wrap">
          @if (formInvalid() && submitAttempted()) {
            <span class="submit-hint">Fix the errors above to continue</span>
          }
          <button type="submit" class="btn btn--primary btn--lg"
                  [disabled]="loading()"
                  [class.btn--disabled-look]="formInvalid()">
            @if (loading()) { <span class="spinner"></span> }
            {{ invoice ? 'Save changes' : 'Create invoice' }}
          </button>
        </div>
      </div>
    </form>
  `,
  styles: [`
    .back-link { font-size: var(--font-size-sm); color: var(--color-text-secondary); display: block; margin-bottom: var(--space-2); &:hover { color: var(--color-primary); } }
    .form-layout { display: grid; }
    .section-title { font-size: var(--font-size-sm); font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--color-text-secondary); margin-bottom: var(--space-5); }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }

    .items-header {
      display: grid; grid-template-columns: 1fr 80px 110px 100px 36px;
      gap: var(--space-3); padding: 0 0 var(--space-2);
      font-size: var(--font-size-xs); font-weight: 600; text-transform: uppercase;
      letter-spacing: .04em; color: var(--color-text-secondary);
      border-bottom: 1px solid var(--color-border);
      @media (max-width: 640px) { display: none; }
    }
    .item-row {
      display: grid; grid-template-columns: 1fr 80px 110px 100px 36px;
      gap: var(--space-3); align-items: start; padding: var(--space-3) 0;
      border-bottom: 1px solid var(--color-border);
      &:last-of-type { border-bottom: none; }

      @media (max-width: 640px) {
        grid-template-columns: 1fr 1fr;
        grid-template-rows: auto auto;
        .item-field:first-child { grid-column: 1 / -1; }
        .item-amount { align-self: end; font-size: var(--font-size-md); padding-top: 0; }
      }
    }
    .item-field { display: flex; flex-direction: column; gap: 2px; }
    .item-amount { font-size: var(--font-size-sm); font-weight: 600; text-align: right; padding-top: 9px; }

    .submit-wrap { display: flex; flex-direction: column; align-items: flex-end; gap: var(--space-2); }
    .submit-hint { font-size: var(--font-size-xs); color: var(--color-danger); }
    .btn--disabled-look { opacity: .6; }

    .totals { display: flex; flex-direction: column; align-items: flex-end; gap: var(--space-2); margin-top: var(--space-4); }
    .total-row { display: flex; gap: var(--space-8); font-size: var(--font-size-sm); color: var(--color-text-secondary); min-width: 220px; justify-content: space-between; }
    .total-row--grand { font-size: var(--font-size-md); font-weight: 700; color: var(--color-text); padding-top: var(--space-2); border-top: 2px solid var(--color-border); }

    .form-actions {
      display: flex; justify-content: flex-end; gap: var(--space-3);
      @media (max-width: 480px) { flex-direction: column; .btn { width: 100%; justify-content: center; } }
    }
  `]
})
export class InvoiceFormComponent implements OnInit {
  @Input() invoice?: InvoiceResponse;
  @Input() id?: string;

  private fb             = inject(FormBuilder);
  private invoiceService = inject(InvoiceService);
  private clientService  = inject(ClientService);
  private router         = inject(Router);

  protected loading         = signal(false);
  protected error           = signal<string | null>(null);
  protected clients         = signal<ClientResponse[]>([]);
  protected submitAttempted = signal(false);

  protected form = this.fb.nonNullable.group({
    invoiceNumber: ['', Validators.required],
    status:        ['DRAFT' as InvoiceStatus],
    clientId:      ['', Validators.required],
    issueDate:     [this.today(), Validators.required],
    dueDate:       [this.daysFromNow(30), Validators.required],
    notes:         [''],
    taxRate:       [0],
    items: this.fb.array([this.newItemGroup()])
  });

  get items() { return this.form.get('items') as FormArray; }

  private itemValues$  = toSignal(this.items.valueChanges.pipe(startWith(this.items.value)));
  private taxRateValue$ = toSignal(
    this.form.get('taxRate')!.valueChanges.pipe(startWith(0))
  );
  private formStatus$ = toSignal(
    this.form.statusChanges.pipe(startWith(this.form.status))
  );
  protected formInvalid = computed(() => this.formStatus$() !== 'VALID');

  protected subtotal = computed(() => {
    return (this.itemValues$() ?? []).reduce((sum: number, item: any) =>
      sum + ((+item.quantity || 0) * (+item.unitPrice || 0)), 0);
  });

  protected taxAmount = computed(() => {
    return this.subtotal() * (+(this.taxRateValue$() ?? 0)) / 100;
  });

  protected total = computed(() => this.subtotal() + this.taxAmount());

  protected itemAmount(i: number): number {
    const item = this.itemValues$()?.[i];
    return item ? ((+item.quantity || 0) * (+item.unitPrice || 0)) : 0;
  }

  ngOnInit() {
    this.clientService.getAll(0, 100).subscribe(p => this.clients.set(p.content));

    if (this.invoice) {
      this.patchForm(this.invoice);
    } else if (this.id) {
      this.loading.set(true);
      this.invoiceService.getById(Number(this.id)).subscribe({
        next: inv => { this.invoice = inv; this.patchForm(inv); this.loading.set(false); },
        error: ()  => this.loading.set(false)
      });
    }
  }

  private patchForm(inv: InvoiceResponse) {
    this.form.patchValue({
      invoiceNumber: inv.invoiceNumber,
      status:        inv.status,
      clientId:      String(inv.client.id),
      issueDate:     inv.issueDate,
      dueDate:       inv.dueDate,
      notes:         inv.notes,
      taxRate:       inv.taxRate,
    });
    this.items.clear();
    inv.items.forEach(item => {
      this.items.push(this.fb.nonNullable.group({
        description: [item.description, Validators.required],
        quantity:    [item.quantity,    [Validators.required, Validators.min(0.01)]],
        unitPrice:   [item.unitPrice,   [Validators.required, Validators.min(0.01)]],
      }));
    });
  }

  protected getItemGroup(i: number) {
    return this.items.at(i) as ReturnType<typeof this.newItemGroup>;
  }

  protected isInvalid(field: string) {
    const ctrl = this.form.get(field)!;
    return ctrl.invalid && ctrl.touched;
  }

  protected isItemInvalid(i: number, field: string) {
    const ctrl = this.items.at(i).get(field)!;
    return ctrl.invalid && ctrl.touched;
  }

  protected addItem() {
    this.items.push(this.newItemGroup());
  }

  protected removeItem(i: number) {
    if (this.items.length > 1) this.items.removeAt(i);
  }

  protected submit() {
    this.submitAttempted.set(true);
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set(null);

    const v = this.form.getRawValue();
    const body = {
      ...v,
      clientId: Number(v.clientId),
      taxRate: Number(v.taxRate),
    };

    const req = this.invoice
      ? this.invoiceService.update(this.invoice.id, body)
      : this.invoiceService.create(body);

    req.subscribe({
      next: inv => this.router.navigate(['/invoices', inv.id]),
      error: err => {
        this.loading.set(false);
        this.error.set(err.error?.detail ?? 'An error occurred');
      }
    });
  }

  private newItemGroup() {
    return this.fb.nonNullable.group({
      description: ['', Validators.required],
      quantity:    [1,  [Validators.required, Validators.min(0.01)]],
      unitPrice:   [0,  [Validators.required, Validators.min(0.01)]],
    });
  }

  private today() { return new Date().toISOString().split('T')[0]; }
  private daysFromNow(d: number) {
    const dt = new Date();
    dt.setDate(dt.getDate() + d);
    return dt.toISOString().split('T')[0];
  }
}
