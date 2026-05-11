import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: '▦' },
  { path: '/clients',   label: 'Clients',   icon: '👤' },
  { path: '/invoices',  label: 'Invoices',  icon: '🧾' },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell">
      <!-- Mobile overlay backdrop -->
      @if (mobileOpen()) {
        <div class="sidebar-backdrop" (click)="mobileOpen.set(false)"></div>
      }

      <!-- Sidebar -->
      <aside class="sidebar"
             [class.collapsed]="collapsed()"
             [class.mobile-open]="mobileOpen()">
        <div class="sidebar__brand">
          <span class="sidebar__logo">◈</span>
          @if (!collapsed() || mobileOpen()) {
            <span class="sidebar__brand-name">BillFlow</span>
          }
        </div>

        <nav class="sidebar__nav">
          @for (item of navItems; track item.path) {
            <a [routerLink]="item.path"
               routerLinkActive="sidebar__link--active"
               class="sidebar__link"
               [title]="collapsed() && !mobileOpen() ? item.label : ''"
               (click)="mobileOpen.set(false)">
              <span class="sidebar__icon">{{ item.icon }}</span>
              @if (!collapsed() || mobileOpen()) { <span>{{ item.label }}</span> }
            </a>
          }
        </nav>

        <div class="sidebar__footer">
          <button class="sidebar__link" (click)="logout()">
            <span class="sidebar__icon">⇥</span>
            @if (!collapsed() || mobileOpen()) { <span>Sign out</span> }
          </button>
        </div>
      </aside>

      <!-- Main -->
      <div class="main">
        <header class="topbar">
          <button class="topbar__toggle btn btn--ghost btn--sm" (click)="toggleSidebar()">
            ☰
          </button>
          <div class="topbar__right">
            <div class="topbar__user">
              <div class="topbar__avatar">{{ userInitials() }}</div>
              @if (currentUser()) {
                <div class="topbar__user-info hide-mobile">
                  <span class="topbar__name">{{ currentUser()!.firstName }} {{ currentUser()!.lastName }}</span>
                  <span class="topbar__role">{{ currentUser()!.role }}</span>
                </div>
              }
            </div>
          </div>
        </header>

        <main class="content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    // ── Sidebar backdrop (mobile only) ────────────────────────────────────────
    .sidebar-backdrop {
      display: none;
      position: fixed; inset: 0;
      background: rgba(0,0,0,.5);
      z-index: 99;
    }

    // ── Sidebar ───────────────────────────────────────────────────────────────
    .sidebar {
      width: var(--sidebar-width);
      background: var(--color-sidebar-bg);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      transition: width var(--transition), transform var(--transition);
      overflow: hidden;
      z-index: 100;

      &.collapsed {
        width: 60px;
        .sidebar__brand-name { display: none; }
      }
    }

    .sidebar__brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 16px;
      border-bottom: 1px solid rgba(255,255,255,.07);
    }

    .sidebar__logo { font-size: 22px; color: var(--color-primary); flex-shrink: 0; }
    .sidebar__brand-name { font-size: 16px; font-weight: 700; color: #fff; white-space: nowrap; }

    .sidebar__nav {
      flex: 1;
      padding: 12px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .sidebar__link {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 10px;
      border-radius: var(--radius-md);
      color: var(--color-sidebar-text);
      font-size: 14px; font-weight: 500;
      transition: all var(--transition);
      white-space: nowrap;
      cursor: pointer; width: 100%; text-decoration: none;

      &:hover { background: rgba(255,255,255,.08); color: #fff; }
      &--active { background: var(--color-sidebar-active); color: #fff; }
    }

    .sidebar__icon { font-size: 16px; flex-shrink: 0; width: 20px; text-align: center; }
    .sidebar__footer { padding: 8px; border-top: 1px solid rgba(255,255,255,.07); }

    // ── Main area ─────────────────────────────────────────────────────────────
    .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    .topbar {
      height: var(--topbar-height);
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 var(--space-6); flex-shrink: 0;
    }

    .topbar__toggle { font-size: 18px; }
    .topbar__right  { display: flex; align-items: center; }
    .topbar__user   { display: flex; align-items: center; gap: var(--space-3); }

    .topbar__avatar {
      width: 34px; height: 34px;
      background: var(--color-primary-light); color: var(--color-primary-dark);
      border-radius: var(--radius-full);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700;
    }

    .topbar__user-info { display: flex; flex-direction: column; }
    .topbar__name  { font-size: 13px; font-weight: 600; line-height: 1.3; }
    .topbar__role  { font-size: 11px; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: .04em; }

    .content { flex: 1; overflow-y: auto; padding: var(--space-8); }

    // ── Mobile breakpoint ─────────────────────────────────────────────────────
    @media (max-width: 768px) {
      .sidebar-backdrop { display: block; }

      .sidebar {
        position: fixed;
        top: 0; left: 0; bottom: 0;
        transform: translateX(-100%);
        width: var(--sidebar-width) !important;

        // Show all labels when open on mobile
        .sidebar__brand-name { display: block !important; }

        &.mobile-open {
          transform: translateX(0);
        }
      }

      .content { padding: var(--space-4); }
    }
  `]
})
export class ShellComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  protected navItems    = NAV_ITEMS;
  protected collapsed   = signal(false);
  protected mobileOpen  = signal(false);
  protected currentUser = this.auth.currentUser;

  protected userInitials() {
    const u = this.currentUser();
    if (!u) return '?';
    return (u.firstName[0] + u.lastName[0]).toUpperCase();
  }

  protected toggleSidebar() {
    if (window.innerWidth <= 768) {
      this.mobileOpen.update(v => !v);
    } else {
      this.collapsed.update(v => !v);
    }
  }

  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth > 768) this.mobileOpen.set(false);
  }

  protected logout() {
    this.auth.logout();
  }
}
