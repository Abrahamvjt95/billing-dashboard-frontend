import {
  AfterViewInit, ChangeDetectionStrategy, Component,
  ElementRef, inject, OnInit, signal, ViewChild
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardStats } from '../../core/models/dashboard.models';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1>Dashboard</h1>
        <p>Overview of your billing activity</p>
      </div>
      <a routerLink="/invoices/new" class="btn btn--primary">+ New invoice</a>
    </div>

    @if (loading()) {
      <div class="loading-overlay"><div class="spinner spinner--lg"></div></div>
    } @else if (stats()) {
      <!-- Stat cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-icon stat-icon--indigo">💰</span>
          <div>
            <div class="stat-value">{{ stats()!.totalRevenue | currency }}</div>
            <div class="stat-label">Total revenue</div>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon stat-icon--green">✔</span>
          <div>
            <div class="stat-value">{{ stats()!.collectedRevenue | currency }}</div>
            <div class="stat-label">Collected</div>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon stat-icon--amber">⏳</span>
          <div>
            <div class="stat-value">{{ stats()!.pendingRevenue | currency }}</div>
            <div class="stat-label">Pending</div>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon stat-icon--slate">👤</span>
          <div>
            <div class="stat-value">{{ stats()!.totalClients }}</div>
            <div class="stat-label">Clients</div>
          </div>
        </div>
      </div>

      <!-- Second row -->
      <div class="dashboard-grid mt-6">
        <!-- Donut chart -->
        <div class="card">
          <h3 class="section-title">Invoices by status</h3>
          <div class="chart-wrap">
            <canvas #donutChart></canvas>
          </div>
          <div class="legend">
            <div class="legend-item">
              <span class="legend-dot legend-dot--draft"></span>
              <span>Draft</span>
              <strong>{{ stats()!.draftInvoices }}</strong>
            </div>
            <div class="legend-item">
              <span class="legend-dot legend-dot--sent"></span>
              <span>Sent</span>
              <strong>{{ stats()!.sentInvoices }}</strong>
            </div>
            <div class="legend-item">
              <span class="legend-dot legend-dot--paid"></span>
              <span>Paid</span>
              <strong>{{ stats()!.paidInvoices }}</strong>
            </div>
            <div class="legend-item">
              <span class="legend-dot legend-dot--overdue"></span>
              <span>Overdue</span>
              <strong>{{ stats()!.overdueInvoices }}</strong>
            </div>
          </div>
        </div>

        <!-- Quick actions -->
        <div class="card">
          <h3 class="section-title">Quick actions</h3>
          <div class="quick-actions">
            <a routerLink="/invoices/new" class="quick-action">
              <span class="qa-icon">🧾</span>
              <div>
                <div class="font-semibold">New invoice</div>
                <div class="text-muted text-sm">Create and send an invoice</div>
              </div>
            </a>
            <a routerLink="/clients/new" class="quick-action">
              <span class="qa-icon">👤</span>
              <div>
                <div class="font-semibold">Add client</div>
                <div class="text-muted text-sm">Register a new client</div>
              </div>
            </a>
            <a routerLink="/invoices" [queryParams]="{status: 'OVERDUE'}" class="quick-action quick-action--danger">
              <span class="qa-icon">⚠️</span>
              <div>
                <div class="font-semibold">Overdue invoices</div>
                <div class="text-muted text-sm">{{ stats()!.overdueInvoices }} need attention</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-4);
      @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
      @media (max-width: 480px) { grid-template-columns: 1fr; }
    }
    .stat-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
      display: flex;
      align-items: center;
      gap: var(--space-4);
      box-shadow: var(--shadow-sm);
    }
    .stat-icon {
      width: 44px; height: 44px;
      border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
      &--indigo { background: var(--color-primary-light); }
      &--green  { background: var(--color-success-light); }
      &--amber  { background: var(--color-warning-light); }
      &--slate  { background: var(--color-border); }
    }
    .stat-value { font-size: var(--font-size-xl); font-weight: 700; line-height: 1.2; }
    .stat-label { font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-top: 2px; }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-6);
      @media (max-width: 768px) { grid-template-columns: 1fr; }
    }
    .section-title { font-size: var(--font-size-xs); font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--color-text-secondary); margin-bottom: var(--space-5); }

    .chart-wrap { height: 180px; display: flex; align-items: center; justify-content: center; }

    .legend { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-top: var(--space-4); }
    .legend-item { display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-sm); strong { margin-left: auto; } }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
      &--draft   { background: #cbd5e1; }
      &--sent    { background: var(--color-info); }
      &--paid    { background: var(--color-success); }
      &--overdue { background: var(--color-danger); }
    }

    .quick-actions { display: flex; flex-direction: column; gap: var(--space-3); }
    .quick-action {
      display: flex; align-items: center; gap: var(--space-4);
      padding: var(--space-4);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      transition: all var(--transition);
      &:hover { border-color: var(--color-primary); background: var(--color-primary-light); }
      &--danger:hover { border-color: var(--color-danger); background: var(--color-danger-light); }
    }
    .qa-icon { font-size: 22px; }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('donutChart') donutRef!: ElementRef<HTMLCanvasElement>;

  private dashboardService = inject(DashboardService);

  protected loading = signal(true);
  protected stats   = signal<DashboardStats | null>(null);

  private chartData: number[] = [];

  ngOnInit() {
    this.dashboardService.getStats().subscribe({
      next: s => {
        this.stats.set(s);
        this.loading.set(false);
        this.chartData = [s.draftInvoices, s.sentInvoices, s.paidInvoices, s.overdueInvoices];
      },
      error: () => this.loading.set(false)
    });
  }

  ngAfterViewInit() {
    if (!this.donutRef) return;
    this.renderChart();
  }

  private renderChart() {
    const total = this.chartData.reduce((a, b) => a + b, 0);

    new Chart(this.donutRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Draft', 'Sent', 'Paid', 'Overdue'],
        datasets: [{
          data: total > 0 ? this.chartData : [1],
          backgroundColor: total > 0
            ? ['#cbd5e1', '#3b82f6', '#22c55e', '#ef4444']
            : ['#e2e8f0'],
          borderWidth: 0,
          hoverOffset: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: total > 0 }
        }
      }
    });
  }
}
