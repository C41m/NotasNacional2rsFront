import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Company } from '../../models/company.model';

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './company-list.component.html',
  styleUrls: ['./company-list.component.css']
})
export class CompanyListComponent implements OnInit {
  companies: Company[] = [];
  selectedIds: number[] = [];
  search: string = '';
  page: number = 1;
  limit: number = 20;
  loading: boolean = false;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadCompanies();
  }

  // Computed stats
  get totalCompanies(): number {
    return this.companies.length;
  }

  get certCount(): number {
    return this.companies.filter(c => c.validade_cert).length;
  }

  get noCertCount(): number {
    return this.companies.filter(c => !c.validade_cert).length;
  }

  loadCompanies() {
    this.loading = true;
    this.api.listCompanies(this.page, this.limit, this.search).subscribe({
      next: (data: Company[]) => {
        this.companies = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar empresas:', err);
        this.loading = false;
      }
    });
  }

  toggleSelection(id: number) {
    const idx = this.selectedIds.indexOf(id);
    if (idx > -1) {
      this.selectedIds.splice(idx, 1);
    } else {
      this.selectedIds.push(id);
    }
  }

  selectAll() {
    if (this.selectedIds.length === this.companies.length) {
      this.selectedIds = [];
    } else {
      this.selectedIds = this.companies.map(c => c.id);
    }
  }

  editCompany(id: number) {
    window.location.href = `/companies/${id}/edit`;
  }

  deleteCompany(id: number, nome: string) {
    if (!confirm(`Excluir a empresa "${nome}"? Esta ação não pode ser desfeita.`)) return;
    this.api.deleteCompany(id.toString()).subscribe({
      next: () => {
        this.loadCompanies();
      },
      error: (err) => {
        console.error('Erro ao excluir empresa:', err);
        alert('Erro ao excluir empresa');
      }
    });
  }

  startDownload() {
    if (this.selectedIds.length === 0) {
      alert('Selecione pelo menos uma empresa');
      return;
    }
    localStorage.setItem('selectedCompanyIds', JSON.stringify(this.selectedIds));
    window.location.href = '/download';
  }

  formatCertDate(dateStr: string | null): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  onSearch() {
    this.page = 1;
    this.loadCompanies();
  }
}