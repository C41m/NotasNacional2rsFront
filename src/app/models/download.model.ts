export interface BatchRequest {
  company_ids: number[];
  datainicio: string;
  datafim: string;
  download_type?: 'xml' | 'pdf' | 'both';
}

export interface CompanyProgress {
  status: string;
  notas_done: number;
  notas_total: number;
  cnpj: string;
  nome: string;
}

export interface BatchStatus {
  total: number;
  done: number;
  status: string;
  zip_path?: string;
  error?: string;
  companies?: { [companyId: string]: CompanyProgress };
}
