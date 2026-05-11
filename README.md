# Billing Dashboard — Frontend

![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![SCSS](https://img.shields.io/badge/SCSS-custom_design_system-CC6699?logo=sass&logoColor=white)

SaaS billing dashboard built with Angular 21 modern APIs — standalone components, signals, OnPush change detection and a custom SCSS design system (no UI library).

**Live demo →** `https://billing-dashboard.vercel.app`  
**Demo account →** `demo@billflow.com` / `demo123`  
**Backend repo →** [billing-dashboard-api](https://github.com/Abrahamvjt95/billing-dashboard-api)

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Angular 21 (standalone components) |
| State | Angular Signals + `computed()` + `toSignal()` |
| HTTP | `HttpClient` + functional interceptor (JWT + auto-refresh) |
| Forms | Reactive Forms with real-time signal-driven validation |
| Charts | Chart.js |
| Styles | Custom SCSS design system — no Angular Material, no PrimeNG |
| Deploy | Vercel |

## Features

- **Dashboard** — revenue stats, donut chart by invoice status, quick actions
- **Clients** — paginated list, create/edit modal, detail view
- **Invoices** — filterable list (All / Draft / Sent / Paid / Overdue), form with dynamic line items, real-time totals
- **Payments** — record payments from invoice detail, partial payment support, auto-close on full payment
- **JWT auth** — login, register, silent token refresh (rotate-on-use)
- **Responsive** — mobile-first, sidebar becomes a drawer on small screens

## Angular patterns used

```typescript
// Signals for reactive state
protected loading = signal(false);
protected stats   = signal<DashboardStats | null>(null);

// toSignal() to bridge RxJS → signals
private itemValues = toSignal(
  this.items.valueChanges.pipe(startWith(this.items.value))
);

// computed() for derived state
protected subtotal = computed(() =>
  (this.itemValues() ?? []).reduce((sum, item) =>
    sum + ((+item.quantity || 0) * (+item.unitPrice || 0)), 0)
);

// Functional interceptor with refresh token rotation
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  ...
};
```

## Running locally

**Prerequisites:** Node 20+, Angular CLI 21

```bash
# 1. Clone
git clone https://github.com/Abrahamvjt95/billing-dashboard-frontend.git
cd billing-dashboard-frontend

# 2. Install
npm install

# 3. Start (requires backend running on :8080)
ng serve
```

Open `http://localhost:4200`.

To point to a different API:

```typescript
// src/environments/environment.ts
export const environment = {
  apiUrl: 'http://your-api-url/api/v1'
};
```

## Project structure

```
src/app/
├── core/
│   ├── guards/          # auth.guard, guest.guard (CanActivateFn)
│   ├── interceptors/    # auth.interceptor (JWT + refresh)
│   ├── models/          # TypeScript interfaces
│   └── services/        # AuthService, ClientService, InvoiceService…
├── features/
│   ├── auth/            # login, register
│   ├── clients/         # list, form (modal), detail
│   ├── dashboard/       # stats + Chart.js donut
│   └── invoices/        # list, form (dynamic items), detail + payments
├── layout/
│   └── shell/           # sidebar + topbar + router-outlet
└── styles.scss          # design system: tokens, card, btn, badge, table…
```

## Design system

All UI built from scratch — no component library. Key pieces in `styles.scss`:

- **CSS custom properties** — color palette, spacing scale, typography, shadows
- **`.card`** — surface with border and shadow
- **`.badge`** — status pills (draft / sent / paid / overdue)
- **`.btn`** — primary, secondary, danger, ghost variants
- **`.form-control`** — inputs with focus ring and validation states
- **`table`** — striped hover rows with horizontal scroll on mobile
- **`.modal`** — backdrop + dialog with header/body/footer
