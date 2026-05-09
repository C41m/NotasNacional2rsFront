import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Company, CompanyCreate } from '../models/company.model';
import { BatchRequest, BatchStatus } from '../models/download.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    // Override with runtime config if available
    const runtimeConfig = (window as any).__APP_CONFIG__;
    if (runtimeConfig?.apiUrl) {
      this.baseUrl = runtimeConfig.apiUrl;
    }
  }

  // Company endpoints
  createCompany(company: CompanyCreate): Observable<Company> {
    return this.http.post<Company>(`${this.baseUrl}/companies/`, company).pipe(
      catchError(this.handleError)
    );
  }

  listCompanies(page: number = 1, limit: number = 20, search: string = ''): Observable<Company[]> {
    let params = `?page=${page}&limit=${limit}`;
    if (search) params += `&search=${search}`;
    return this.http.get<Company[]>(`${this.baseUrl}/companies/${params}`).pipe(
      catchError(this.handleError)
    );
  }

  // NFSe batch download
  startBatchDownload(request: BatchRequest): Observable<{batch_id: string, status: string}> {
    return this.http.post<{batch_id: string, status: string}>(`${this.baseUrl}/nfse/batch-download`, request).pipe(
      catchError(this.handleError)
    );
  }

  getBatchStatus(batchId: string): Observable<BatchStatus> {
    return this.http.get<BatchStatus>(`${this.baseUrl}/nfse/batch-download/${batchId}`).pipe(
      catchError(this.handleError)
    );
  }

  downloadBatchFile(batchId: string): void {
    window.open(`${this.baseUrl}/nfse/batch-download/${batchId}/file`, '_blank');
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    return throwError(() => error);
  }
}
