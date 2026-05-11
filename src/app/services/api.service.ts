// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Company, CompanyCreate } from '../models/company.model';
import { BatchRequest, BatchStatus } from '../models/download.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl: string;

  constructor(private http: HttpClient) {
    // ✅ Inicializa com a URL do environment (fallback seguro)
    this.baseUrl = environment.apiUrl;
    
    // ✅ Sobrescreve apenas se runtime config tiver URL absoluta (http/https)
    const runtimeConfig = (window as any).__APP_CONFIG__;
    if (runtimeConfig?.apiUrl && runtimeConfig.apiUrl.startsWith('http')) {
      this.baseUrl = runtimeConfig.apiUrl;
    }
  }

  // ==================== Company Endpoints ====================

  createCompany(company: CompanyCreate): Observable<Company> {
    return this.http.post<Company>(`${this.baseUrl}/companies`, company).pipe(
      catchError(this.handleError)
    );
  }

  listCompanies(page: number = 1, limit: number = 20, search: string = ''): Observable<Company[]> {
    // ✅ Usa HttpParams para montar query string de forma segura e correta
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }
    
    return this.http.get<Company[]>(`${this.baseUrl}/companies`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  getCompany(id: string): Observable<Company> {
    return this.http.get<Company>(`${this.baseUrl}/companies/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  updateCompany(id: string, company: Partial<CompanyCreate>): Observable<Company> {
    return this.http.patch<Company>(`${this.baseUrl}/companies/${id}`, company).pipe(
      catchError(this.handleError)
    );
  }

  deleteCompany(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/companies/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== NFSe Batch Download ====================

  startBatchDownload(request: BatchRequest): Observable<{ batch_id: string; status: string }> {
    return this.http.post<{ batch_id: string; status: string }>(
      `${this.baseUrl}/nfse/batch-download`, 
      request
    ).pipe(
      catchError(this.handleError)
    );
  }

  getBatchStatus(batchId: string): Observable<BatchStatus> {
    return this.http.get<BatchStatus>(`${this.baseUrl}/nfse/batch-download/${batchId}`).pipe(
      catchError(this.handleError)
    );
  }

  downloadBatchFile(batchId: string): void {
    // ✅ Abre em nova aba para download do arquivo
    window.open(`${this.baseUrl}/nfse/batch-download/${batchId}/file`, '_blank');
  }

  // ==================== Error Handler ====================

  private handleError(error: HttpErrorResponse): Observable<never> {
    // ✅ Log estruturado para debug em produção
    const errorDetails = {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      message: error.message,
      error: error.error
    };
    
    console.error('🔴 API Error:', errorDetails);
    
    // ✅ Propaga o erro para o componente tratar (ex: mostrar toast)
    return throwError(() => error);
  }
}