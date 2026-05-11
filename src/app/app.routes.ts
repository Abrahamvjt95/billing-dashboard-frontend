import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      }
    ]
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'clients',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/clients/client-list/client-list.component').then(m => m.ClientListComponent)
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./features/clients/client-form/client-form.component').then(m => m.ClientFormComponent)
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/clients/client-detail/client-detail.component').then(m => m.ClientDetailComponent)
          }
        ]
      },
      {
        path: 'invoices',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/invoices/invoice-list/invoice-list.component').then(m => m.InvoiceListComponent)
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./features/invoices/invoice-form/invoice-form.component').then(m => m.InvoiceFormComponent)
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/invoices/invoice-detail/invoice-detail.component').then(m => m.InvoiceDetailComponent)
          },
          {
            path: ':id/edit',
            loadComponent: () =>
              import('./features/invoices/invoice-form/invoice-form.component').then(m => m.InvoiceFormComponent)
          }
        ]
      }
    ]
  },

  { path: '**', redirectTo: 'dashboard' }
];
