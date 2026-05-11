import {
  ChangeDetectionStrategy, Component, EventEmitter, inject,
  Input, OnInit, Output, signal
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClientService } from '../../../core/services/client.service';
import { ClientResponse } from '../../../core/models/client.models';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-backdrop" (click)="onBackdrop($event)">
      <div class="modal" role="dialog">
        <div class="modal__header">
          <h2>{{ client ? 'Edit client' : 'New client' }}</h2>
          <button class="btn btn--ghost btn--sm" (click)="cancelled.emit()">✕</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="modal__body">
            @if (error()) {
              <div class="alert alert--error">{{ error() }}</div>
            }

            <div class="form-group">
              <label>Name *</label>
              <input type="text" class="form-control"
                     [class.is-invalid]="isInvalid('name')"
                     formControlName="name" placeholder="Acme Corp" />
              @if (isInvalid('name')) { <span class="form-error">Required</span> }
            </div>

            <div class="form-row mt-4">
              <div class="form-group">
                <label>Email</label>
                <input type="email" class="form-control"
                       [class.is-invalid]="isInvalid('email')"
                       formControlName="email" placeholder="contact@acme.com" />
                @if (isInvalid('email')) { <span class="form-error">Invalid email</span> }
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input type="text" class="form-control" formControlName="phone" placeholder="+1 555 0100" />
              </div>
            </div>

            <div class="form-row mt-4">
              <div class="form-group">
                <label>Tax ID</label>
                <input type="text" class="form-control" formControlName="taxId" placeholder="RFC / EIN" />
              </div>
              <div class="form-group">
                <label>Address</label>
                <input type="text" class="form-control" formControlName="address" placeholder="123 Main St" />
              </div>
            </div>

            <div class="form-group mt-4">
              <label>Notes</label>
              <textarea class="form-control" formControlName="notes" rows="2" placeholder="Optional notes..."></textarea>
            </div>
          </div>

          <div class="modal__footer">
            <button type="button" class="btn btn--secondary" (click)="cancelled.emit()">Cancel</button>
            <button type="submit" class="btn btn--primary" [disabled]="loading()">
              @if (loading()) { <span class="spinner"></span> }
              {{ client ? 'Save changes' : 'Create client' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ClientFormComponent implements OnInit {
  @Input() client?: ClientResponse;
  @Output() saved     = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private fb      = inject(FormBuilder);
  private service = inject(ClientService);

  protected loading = signal(false);
  protected error   = signal<string | null>(null);

  protected form = this.fb.nonNullable.group({
    name:    ['', Validators.required],
    email:   ['', Validators.email],
    phone:   [''],
    taxId:   [''],
    address: [''],
    notes:   ['']
  });

  ngOnInit() {
    if (this.client) {
      this.form.patchValue(this.client);
    }
  }

  protected isInvalid(field: string) {
    const ctrl = this.form.get(field)!;
    return ctrl.invalid && ctrl.touched;
  }

  protected onBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.cancelled.emit();
    }
  }

  protected submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set(null);

    const req = this.client
      ? this.service.update(this.client.id, this.form.getRawValue())
      : this.service.create(this.form.getRawValue());

    req.subscribe({
      next: () => { this.loading.set(false); this.saved.emit(); },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.detail ?? 'An error occurred');
      }
    });
  }
}
