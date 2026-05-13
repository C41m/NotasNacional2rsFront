import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { interval, takeWhile, Subject } from 'rxjs';

interface BatchItem {
  batchId: string;
  total: number;
  done: number;
  status: string;
  datainicio: string;
  datafim: string;
  createdAt: string;
  companyCount: number;
}

@Component({
  selector: 'app-batch-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './batch-list.component.html',
  styleUrls: ['./batch-list.component.css']
})
export class BatchListComponent implements OnInit, OnDestroy {
  batches: BatchItem[] = [];
  loading = true;
  error = '';
  cancelingId: string | null = null;

  private hasActiveBatches = true;
  private refreshSub: any;

  // Computed stats
  get processingCount(): number {
    return this.batches.filter(b => b.status === 'processing').length;
  }

  get queuedCount(): number {
    return this.batches.filter(b => b.status === 'queued').length;
  }

  get completedCount(): number {
    return this.batches.filter(b => b.status !== 'processing' && b.status !== 'queued').length;
  }

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadBatches();
  }

  loadBatches() {
    this.loading = true;
    this.error = '';

    this.api.listActiveBatches().subscribe({
      next: (data: any) => {
        const items: BatchItem[] = [];
        for (const bid in data) {
          if (data.hasOwnProperty(bid)) {
            const b = data[bid];
            items.push({
              batchId: bid,
              total: b.total || 0,
              done: b.done || 0,
              status: b.status || 'unknown',
              datainicio: b.datainicio || '',
              datafim: b.datafim || '',
              createdAt: b.created_at || '',
              companyCount: Object.keys(b.companies || {}).length,
            });
          }
        }
        // Mostrar mais recentes primeiro
        items.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
        this.batches = items;
        this.loading = false;

        // Ativar auto-refresh se houver batches em andamento
        const activeBatches = this.batches.filter(b =>
          b.status === 'processing' || b.status === 'queued'
        );
        this.hasActiveBatches = activeBatches.length > 0;

        if (this.hasActiveBatches) {
          this.startAutoRefresh();
        } else {
          this.stopAutoRefresh();
        }
      },
      error: (err: any) => {
        this.error = 'Erro ao carregar batches';
        this.loading = false;
        console.error(err);
      }
    });
  }

  private startAutoRefresh() {
    if (this.refreshSub) return;

    this.refreshSub = interval(10000).subscribe(() => {
      this.api.listActiveBatches().subscribe({
        next: (data: any) => {
          const items: BatchItem[] = [];
          for (const bid in data) {
            if (data.hasOwnProperty(bid)) {
              const b = data[bid];
              items.push({
                batchId: bid,
                total: b.total || 0,
                done: b.done || 0,
                status: b.status || 'unknown',
                datainicio: b.datainicio || '',
                datafim: b.datafim || '',
                createdAt: b.created_at || '',
                companyCount: Object.keys(b.companies || {}).length,
              });
            }
          }
          items.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
          this.batches = items;

          const activeBatches = this.batches.filter(b =>
            b.status === 'processing' || b.status === 'queued'
          );
          this.hasActiveBatches = activeBatches.length > 0;

          if (!this.hasActiveBatches) {
            this.stopAutoRefresh();
          }
        },
        error: (err: any) => {
          console.error('Auto-refresh error:', err);
        }
      });
    });
  }

  private stopAutoRefresh() {
    if (this.refreshSub) {
      this.refreshSub.unsubscribe();
      this.refreshSub = null;
    }
  }

  ngOnDestroy() {
    this.stopAutoRefresh();
  }

  getProgress(batch: BatchItem): number {
    if (!batch.total) return 0;
    return Math.round((batch.done / batch.total) * 100);
  }

  getLabel(status: string): string {
    const labels: Record<string, string> = {
      'processing': 'Processando',
      'queued': 'Na fila',
      'cancelling': 'Cancelando...',
      'cancelled': 'Cancelado',
      'success': 'Concluído',
      'failed': 'Erro',
    };
    return labels[status] || (status || 'Desconhecido');
  }

  getBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'processing': 'badge-processing',
      'queued': 'badge-queued',
      'cancelling': 'badge-cancelling',
      'cancelled': 'badge-cancelled',
      'success': 'badge-success',
      'failed': 'badge-failed',
    };
    return classes[status] || 'badge-empty';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  cancelBatch(batchId: string): void {
    if (this.cancelingId) return;
    this.cancelingId = batchId;
    this.api.cancelBatch(batchId).subscribe({
      next: () => {
        this.cancelingId = null;
        this.loadBatches();
      },
      error: (err: any) => {
        this.cancelingId = null;
        console.error(err);
      }
    });
  }

  openBatch(batchId: string): void {
    window.location.href = '/download/' + batchId;
  }
}