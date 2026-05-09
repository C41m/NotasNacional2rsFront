export interface BatchRequest {
  company_ids: number[];
  datainicio: string;
  datafim: string;
}

export interface CompanyProgress {
  status: string;
  notas_done: number;
  notas_total: number;
}

export interface BatchStatus {
  total: number;
  done: number;
  status: string;
  zip_path?: string;
  error?: string;
  companies?: { [companyId: string]: CompanyProgress };
}
