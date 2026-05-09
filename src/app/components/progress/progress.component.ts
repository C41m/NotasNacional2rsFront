import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { BatchStatus, CompanyProgress } from '../../models/download.model';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.css']
})
export class ProgressComponent implements OnInit {
  batchId: string = '';
  status: BatchStatus | null = null;
  loading = true;
  error: string = '';
  private intervalId: any;

  // Track expanded/collapsed state per company
  expandedCompanies: { [key: string]: boolean } = {};

  constructor(private route: ActivatedRoute, private api: ApiService) {}

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
    this.intervalId = setInterval(() => {
      this.api.getBatchStatus(this.batchId).subscribe({
        next: (status) => {
          this.status = status;
          this.loading = false;
          if (status.status === 'success' || status.status === 'failed') {
            clearInterval(this.intervalId);
          }
        },
        error: (err) => {
          this.error = 'Erro ao verificar status: ' + err.message;
          this.loading = false;
          clearInterval(this.intervalId);
        }
      });
    }, 2000);
  }

  getProgress(): number {
    if (!this.status) return 0;
    if (this.status.total === 0) return 0;
    return Math.round((this.status.done / this.status.total) * 100);
  }

  getCompanyProgress(company: CompanyProgress): number {
    if (!company || company.notas_total === 0) return 0;
    return Math.round((company.notas_done / company.notas_total) * 100);
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

  getCompany(companyId: string): CompanyProgress | null {
    if (!this.status || !this.status.companies) return null;
    return this.status.companies[companyId] || null;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'queued': 'Na fila',
      'processing': 'Processando',
      'success': 'Concluído',
      'failed': 'Erro'
    };
    return labels[status] || status;
  }

  downloadFile() {
    this.api.downloadBatchFile(this.batchId);
  }

  goBack() {
    window.location.href = '/companies';
  }
}
