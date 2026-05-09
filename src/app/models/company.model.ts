export interface Company {
  id: number;
  nome: string;
  cnpj: string;
  created_at: string;
  updated_at: string;
  validade_cert?: string | null;
}

export interface CompanyCreate {
  nome: string;
  cnpj: string;
  pfx_base64: string;
  password: string;
}

export interface CompanyUpdate {
  nome?: string;
  pfx_base64?: string;
  password?: string;
}
