import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { BatchStatus, CompanyProgress } from '../../models/download.model';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.css']
})
export class ProgressComponent implements OnInit {
  batchId: string = '';
  status: BatchStatus | null = null;
  loading = true;
  error: string = '';
  private intervalId: any;

  // Contador local: incrementa a cada consulta bem-sucedida ao backend
  atualizacoes = 0;

  // Controle de cancelamento
  cancelando = false;

  // Track expanded/collapsed state per company
  expandedCompanies: { [key: string]: boolean } = {};

  // Cache local de empresas para evitar recriação de objetos
  private companyCache: { [key: string]: CompanyProgress } = {};

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.batchId = this.route.snapshot.paramMap.get('batchId') || '';
    if (!this.batchId) {
      this.error = 'Batch ID não encontrado';
      this.loading = false;
      return;
    }
    this.checkStatus();
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  checkStatus() {
    // Consulta a cada 10 segundos apenas para atualizar o progresso
    // O backend retorna do cache em memória (batch_status), sem bater no banco
    this.intervalId = setInterval(() => {
      this.api.getBatchStatus(this.batchId).subscribe({
        next: (status) => {
          this.status = status;
          this.loading = false;
          this.atualizacoes++;

          // Cache de empresas para referência estável
          if (status.companies) {
            for (const cid of Object.keys(status.companies)) {
              this.companyCache[cid] = status.companies[cid];
            }
          }

          if (status.status === 'success' || status.status === 'failed' || status.status === 'cancelled') {
            clearInterval(this.intervalId);
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = 'Erro ao verificar status: ' + err.message;
          this.loading = false;
          clearInterval(this.intervalId);
          this.cdr.markForCheck();
        }
      });
    }, 10000);
  }

  getProgress(): number {
    if (!this.status) return 0;
    if (this.status.total === 0) return 0;
    return Math.round((this.status.done / this.status.total) * 100);
  }

  getCompanyProgress(company: CompanyProgress | null): number {
    if (!company || company.notas_total === 0) return 0;
    return Math.round((company.notas_done / company.notas_total) * 100);
  }

  getCompanySafe(cid: string): CompanyProgress {
    if (this.companyCache[cid]) return this.companyCache[cid];
    return {
      status: 'queued',
      notas_done: 0,
      notas_total: 0,
      cnpj: '...',
      nome: 'Carregando...'
    };
  }

  getCompanyProgressSafe(cid: string): number {
    return this.getCompanyProgress(this.getCompanySafe(cid));
  }

  toggleCompany(companyId: string): void {
    this.expandedCompanies[companyId] = !this.expandedCompanies[companyId];
  }

  isCompanyExpanded(companyId: string): boolean {
    return !!this.expandedCompanies[companyId];
  }

  getCompanyIds(): string[] {
    if (!this.status || !this.status.companies) return [];
    return Object.keys(this.status.companies);
  }

  trackById(_index: number, id: string): string {
    return id;
  }

  getTotalNotas(): number {
    if (!this.status || !this.status.companies) return 0;
    let total = 0;
    for (const cid of Object.keys(this.status.companies)) {
      total += this.companyCache[cid]?.notas_done ?? 0;
    }
    return total;
  }

  getCompany(companyId: string): CompanyProgress | null {
    if (!this.status || !this.status.companies) return null;
    return this.status.companies[companyId] || null;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'queued': 'Na fila',
      'processing': 'Processando',
      'cancelling': 'Cancelando...',
      'cancelled': 'Cancelado',
      'success': 'Concluído',
      'failed': 'Erro'
    };
    return labels[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'queued': 'badge-queued',
      'processing': 'badge-processing',
      'cancelling': 'badge-cancelling',
      'cancelled': 'badge-cancelled',
      'success': 'badge-success',
      'failed': 'badge-failed'
    };
    return classes[status] || 'badge-empty';
  }

  cancelar() {
    if (this.cancelando || !this.batchId) return;
    this.cancelando = true;
    this.api.cancelBatch(this.batchId).subscribe({
      next: () => {
        console.log('Cancelamento solicitado');
      },
      error: (err) => {
        console.error('Erro ao cancelar:', err);
        this.cancelando = false;
        this.cdr.markForCheck();
      }
    });
  }

  retry() {
    window.location.reload();
  }

  downloadFile() {
    this.api.downloadBatchFile(this.batchId);
  }

  goBack() {
    window.location.href = '/companies';
  }
}