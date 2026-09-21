// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Company, CompanyCreate } from '../models/company.model';
import { BatchRequest, BatchStatus } from '../models/download.model';
import { Auditoria, AuditoriaIngestPayload, VisaoGeralResponse } from '../models/auditoria.model';
import { DocumentoFiscal, DocumentoFiscalCreate, DocumentoFiscalUpdate, DocumentoFiscalFiltros } from '../models/documento-fiscal.model';
import { environment } from '../../environments/environment';

const API_KEY = '12345678';

function apiHeaders(): { headers: HttpHeaders } {
  return { headers: new HttpHeaders({ 'X-API-Key': API_KEY }) };
}

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

  cancelBatch(batchId: string): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/nfse/batch-download/${batchId}/cancel`, {}).pipe(
      catchError(this.handleError)
    );
  }

  listActiveBatches(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/nfse/batch-download/active`).pipe(
      catchError(this.handleError)
    );
  }

  downloadBatchFile(batchId: string): void {
    // ✅ Abre em nova aba para download do arquivo
    window.open(`${this.baseUrl}/nfse/batch-download/${batchId}/file`, '_blank');
  }

  // ==================== Documentos Fiscais Endpoints ====================

  listDocumentosFiscais(filtros: DocumentoFiscalFiltros): Observable<any> {
    let params = new HttpParams();
    if (filtros.empresa_id) params = params.set('empresa_id', filtros.empresa_id.toString());
    if (filtros.tipo) params = params.set('tipo', filtros.tipo);
    if (filtros.data_inicio) params = params.set('data_inicio', filtros.data_inicio);
    if (filtros.data_fim) params = params.set('data_fim', filtros.data_fim);
    if (filtros.search) params = params.set('search', filtros.search);
    if (filtros.page) params = params.set('page', filtros.page.toString());
    if (filtros.limit) params = params.set('limit', filtros.limit.toString());
    return this.http.get<any>(`${this.baseUrl}/documentos-fiscais`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  getDocumentoFiscal(id: string): Observable<DocumentoFiscal> {
    return this.http.get<DocumentoFiscal>(`${this.baseUrl}/documentos-fiscais/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createDocumentoFiscal(doc: DocumentoFiscalCreate): Observable<DocumentoFiscal> {
    return this.http.post<DocumentoFiscal>(`${this.baseUrl}/documentos-fiscais`, doc).pipe(
      catchError(this.handleError)
    );
  }

  updateDocumentoFiscal(id: string, doc: DocumentoFiscalUpdate): Observable<DocumentoFiscal> {
    return this.http.patch<DocumentoFiscal>(`${this.baseUrl}/documentos-fiscais/${id}`, doc).pipe(
      catchError(this.handleError)
    );
  }

  deleteDocumentoFiscal(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/documentos-fiscais/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== Auditoria Endpoints ====================

  ingestAuditoria(payload: AuditoriaIngestPayload): Observable<Auditoria> {
    return this.http.post<Auditoria>(`${this.baseUrl}/auditoria/ingest`, payload, apiHeaders()).pipe(
      catchError(this.handleError)
    );
  }

  getVisaoGeral(periodo: string): Observable<VisaoGeralResponse> {
    return this.http.get<VisaoGeralResponse>(`${this.baseUrl}/auditoria/visao-geral`, {
      params: new HttpParams().set('periodo', periodo),
      ...apiHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getAuditoriaEmpresa(cnpj: string, periodo: string): Observable<Auditoria> {
    return this.http.get<Auditoria>(`${this.baseUrl}/auditoria/empresa/${cnpj}`, {
      params: new HttpParams().set('periodo', periodo),
      ...apiHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getPeriodos(): Observable<string[]> {
      return this.http.get<string[]>(`${this.baseUrl}/auditoria/periodos`, apiHeaders()).pipe(
        catchError(this.handleError)
      );
    }

  getDashboardKPIs(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/auditoria/dashboard`, apiHeaders()).pipe(
      catchError(this.handleError)
    );
  }

  getRankingFatorR(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/auditoria/dashboard/fator-r`, apiHeaders()).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== Error Handler ====================

  private handleError(error: HttpErrorResponse): Observable<never> {
    const errorDetails = {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      message: error.error?.detail || error.message || 'Erro desconhecido',
    };
    console.error('🔴 API Error:', errorDetails);
    return throwError(() => new Error(errorDetails.message));
  }
}
