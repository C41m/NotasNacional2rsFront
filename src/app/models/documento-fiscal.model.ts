// src/app/models/documento-fiscal.model.ts

export interface DocumentoFiscal {
  id: number;
  empresa_id: number;
  empresa_nome?: string;
  tipo: string;
  numero?: string;
  serie?: string;
  data_emissao: string;
  data_vencimento?: string;
  valor_total?: number;
  status: string;
  chave_acesso?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentoFiscalCreate {
  empresa_id: number;
  tipo: string;
  numero?: string;
  serie?: string;
  data_emissao: string;
  data_vencimento?: string;
  valor_total?: number;
  status: string;
  chave_acesso?: string;
}

export interface DocumentoFiscalUpdate {
  empresa_id?: number;
  tipo?: string;
  numero?: string;
  serie?: string;
  data_emissao?: string;
  data_vencimento?: string;
  valor_total?: number;
  status?: string;
  chave_acesso?: string;
}

export interface DocumentoFiscalFiltros {
  empresa_id?: number;
  tipo?: string;
  data_inicio?: string;
  data_fim?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface DocumentoFiscalListResponse {
  data: DocumentoFiscal[];
  total: number;
  page: number;
  limit: number;
}
