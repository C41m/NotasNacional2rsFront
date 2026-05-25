import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { BatchRequest, BatchStatus } from '../../models/download.model';

@Component({
  selector: 'app-download-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './download-form.component.html',
  styleUrls: ['./download-form.component.css']
})
export class DownloadFormComponent implements OnInit {
  companyIds: number[] = [];
  datainicio: string = '';
  datafim: string = '';
  downloadType: 'xml' | 'pdf' | 'both' = 'xml';
  loading = false;
  batchId: string | null = null;

  constructor(private api: ApiService) {}

  ngOnInit() {
    const ids = localStorage.getItem('selectedCompanyIds');
    if (ids) {
      this.companyIds = JSON.parse(ids);
      localStorage.removeItem('selectedCompanyIds');
    }
    if (this.companyIds.length === 0) {
      alert('Nenhuma empresa selecionada');
      window.location.href = '/companies';
    }
  }

  onSubmit() {
    if (!this.datainicio || !this.datafim) {
      alert('Preencha as datas');
      return;
    }
    this.loading = true;
    // Converter formato DD/MM/AAAA para DD/MM/AAAA (frontend usa input type="date" que retorna YYYY-MM-DD)
    const formatDate = (date: string) => {
      const [year, month, day] = date.split('-');
      const formatedDate = `${day}/${month}/${year}`;
      return formatedDate;
    };
    const request: BatchRequest = {
      company_ids: this.companyIds,
      datainicio: formatDate(this.datainicio),
      datafim: formatDate(this.datafim),
      download_type: this.downloadType
    };
    this.api.startBatchDownload(request).subscribe({
      next: (response) => {
        this.batchId = response.batch_id;
        this.loading = false;
        window.location.href = `/download/${this.batchId}`;
      },
      error: (err) => {
        console.error('Erro ao iniciar download:', err);
        alert('Erro ao iniciar download');
        this.loading = false;
      }
    });
  }
}
