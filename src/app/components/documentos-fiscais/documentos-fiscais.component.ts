import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { DocumentoFiscal, DocumentoFiscalFiltros } from '../../models/documento-fiscal.model';
import { Company } from '../../models/company.model';

@Component({
  selector: 'app-documentos-fiscais',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './documentos-fiscais.component.html',
  styleUrls: ['./documentos-fiscais.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentosFiscaisComponent implements OnInit {
  documentos: DocumentoFiscal[] = [];
  empresas: Company[] = [];
  loading: boolean = false;

  // Filtros
  filtros: DocumentoFiscalFiltros = {
    empresa_id: undefined,
    tipo: '',
    data_inicio: '',
    data_fim: '',
    search: '',
    page: 1,
    limit: 20
  };

  // Paginação
  page: number = 1;
  limit: number = 20;
  total: number = 0;

  // Counts para os cards
  countAtivos: number = 0;
  countPendentes: number = 0;
  countCancelados: number = 0;

  // Tipos de documentos disponíveis
  tiposDocumentos: string[] = [
    'NFSe',
    'NFe',
    'NF-e',
    'DAS',
    'PGDAS-D',
    'DEFIS',
    'DIRF',
    'EFD-REINF',
    'Folha de Pagamento',
    'ISS',
    'Outros'
  ];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadEmpresas();
    this.loadDocumentos();
  }

  loadEmpresas() {
    this.api.listCompanies(1, 100).subscribe({
      next: (data: Company[]) => {
        this.empresas = data;
      },
      error: (err) => {
        console.error('Erro ao carregar empresas:', err);
      }
    });
  }

  loadDocumentos() {
    this.loading = true;
    this.api.listDocumentosFiscais(this.filtros).subscribe({
      next: (data: any) => {
        if (Array.isArray(data)) {
          this.documentos = data;
          this.total = data.length;
        } else {
          this.documentos = data.data || [];
          this.total = data.total || 0;
          this.page = data.page || 1;
          this.limit = data.limit || 20;
        }
        this.updateCounts();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar documentos fiscais:', err);
        this.loading = false;
      }
    });
  }

  updateCounts() {
    this.countAtivos = this.documentos.filter(d => d.status === 'ATIVO' || d.status === 'EMITIDO').length;
    this.countPendentes = this.documentos.filter(d => d.status === 'PENDENTE').length;
    this.countCancelados = this.documentos.filter(d => d.status === 'CANCELADO').length;
  }

  onFilterChange() {
    this.page = 1;
    this.loadDocumentos();
  }

  onSearch() {
    this.page = 1;
    this.loadDocumentos();
  }

  clearSearch() {
    this.filtros.search = '';
    this.onSearch();
  }

  clearFilters() {
    this.filtros = {
      empresa_id: undefined,
      tipo: '',
      data_inicio: '',
      data_fim: '',
      search: '',
      page: 1,
      limit: 20
    };
    this.page = 1;
    this.loadDocumentos();
  }

  visualizarDocumento(id: number) {
    window.location.href = `/documentos-fiscais/${id}`;
  }

  editarDocumento(id: number) {
    window.location.href = `/documentos-fiscais/${id}/edit`;
  }

  removerDocumento(id: number, numero: string) {
    if (!confirm(`Excluir o documento fiscal "${numero}"? Esta ação não pode ser desfeita.`)) return;
    this.api.deleteDocumentoFiscal(id.toString()).subscribe({
      next: () => {
        this.loadDocumentos();
      },
      error: (err) => {
        console.error('Erro ao excluir documento fiscal:', err);
        alert('Erro ao excluir documento fiscal');
      }
    });
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return '';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'ATIVO':
      case 'EMITIDO':
      case 'VÁLIDO':
      case 'APROVADO':
        return 'badge-success';
      case 'PENDENTE':
      case 'EM_PROCESSAMENTO':
      case 'AGUARDANDO':
        return 'badge-processing';
      case 'CANCELADO':
      case 'REJEITADO':
      case 'EXPIRADO':
        return 'badge-failed';
      case 'RASCUNHO':
      case 'DIGITADO':
        return 'badge-queued';
      default:
        return 'badge-empty';
    }
  }

  getTipoBadgeClass(tipo: string): string {
    switch (tipo?.toUpperCase()) {
      case 'NFSE':
        return 'badge-success';
      case 'NFE':
      case 'NF-E':
        return 'badge-processing';
      case 'DAS':
      case 'PGDAS-D':
        return 'badge-queued';
      case 'DEFIS':
        return 'badge-cancelling';
      case 'DIRF':
        return 'badge-cancelled';
      case 'EFD-REINF':
        return 'badge-failed';
      default:
        return 'badge-empty';
    }
  }
}
