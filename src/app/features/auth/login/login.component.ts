import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <span class="auth-logo">◈</span>
          <h1>Welcome back</h1>
          <p>Sign in to your BillFlow account</p>
        </div>

        @if (error()) {
          <div class="alert alert--error">{{ error() }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" class="form-control"
                   [class.is-invalid]="isInvalid('email')"
                   formControlName="email"
                   placeholder="you@company.com" />
            @if (isInvalid('email')) {
              <span class="form-error">Valid email required</span>
            }
          </div>

          <div class="form-group mt-4">
            <label for="password">Password</label>
            <input id="password" type="password" class="form-control"
                   [class.is-invalid]="isInvalid('password')"
                   formControlName="password"
                   placeholder="••••••••" />
            @if (isInvalid('password')) {
              <span class="form-error">Password required</span>
            }
          </div>

          <button type="submit" class="btn btn--primary btn--lg w-full mt-6" [disabled]="loading()">
            @if (loading()) { <span class="spinner"></span> }
            Sign in
          </button>
        </form>

        <p class="auth-footer">
          Don't have an account? <a routerLink="/auth/register">Create one</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      background: var(--color-bg);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-4);
    }
    .auth-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: var(--space-10);
      width: 100%;
      max-width: 400px;
      box-shadow: var(--shadow-lg);
      @media (max-width: 480px) {
        padding: var(--space-6);
        border-radius: var(--radius-lg);
        border: none;
        box-shadow: none;
      }
    }
    .auth-header {
      text-align: center;
      margin-bottom: var(--space-8);
      h1 { font-size: var(--font-size-2xl); font-weight: 700; margin: var(--space-3) 0 var(--space-2); }
      p  { color: var(--color-text-secondary); font-size: var(--font-size-sm); }
    }
    .auth-logo { font-size: 36px; color: var(--color-primary); display: block; }
    .auth-footer {
      text-align: center;
      margin-top: var(--space-6);
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      a { color: var(--color-primary); font-weight: 600; }
    }
  `]
})
export class LoginComponent {
  private fb   = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  protected loading = signal(false);
  protected error   = signal<string | null>(null);

  protected form = this.fb.nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  protected isInvalid(field: string) {
    const ctrl = this.form.get(field)!;
    return ctrl.invalid && ctrl.touched;
  }

  protected submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.detail ?? 'Invalid credentials');
      }
    });
  }
}
