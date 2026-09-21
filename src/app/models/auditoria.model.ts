// src/app/models/auditoria.model.ts

// AuditoriaPendenciaIngest — corresponde a AuditoriaPendenciaIngest
export interface AuditoriaPendenciaIngest {
  tipo_documento: string;
  gravidade: string;
  status: string;
  observacao: string;
  crf?: number;
  crt?: string;
  base_calculo?: number;
  receita_declarada?: number;
}

// AuditoriaIngestPayload — corresponde a AuditoriaIngestRequest
export interface AuditoriaIngestPayload {
  cnpj: string;
  razao_social: string;
  periodo: string;
  status_geral: string;
  conformidade_pct: number;
  observacao_geral: string;
  documentos_esperados: number;
  documentos_encontrados: number;
  // Novos campos para análise IA
  fator_r: number;
  aliquota_efetiva: number;
  receita_pa: number;
  rbt12: number;
  folha_12m: number;
  classificacao_anexo?: string;
  analise_completa?: string;
  pendencias: AuditoriaPendenciaIngest[];
}

// Auditoria — corresponde a AuditoriaOut
export interface Auditoria {
  id: number;
  cnpj: string;
  razao_social: string;
  periodo: string;
  status_geral: string;
  conformidade_pct: number;
  observacao_geral: string;
  documentos_esperados: number;
  documentos_encontrados: number;
  // Novos campos para análise IA
  fator_r: number;
  aliquota_efetiva: number;
  receita_pa: number;
  rbt12: number;
  folha_12m: number;
  pro_labore?: number;
  inss?: number;
  irrf?: number;
  fgts?: number;
  num_funcionarios?: number;
  media_mensal_folha?: number;
  // Verificações da folha
  inss_esperado?: number;
  irrf_esperado?: number;
  fgts_esperado?: number;
  base_calculo_irrf?: number;
  deducoes_legais?: number;
  liquido_esperado?: number;
  classificacao_anexo?: string;
  analise_completa?: string;
  created_at: string;
  updated_at: string;
  pendencias: AuditoriaPendencia[];
}

// AuditoriaPendencia — corresponde a AuditoriaPendenciaOut
export interface AuditoriaPendencia {
  id: number;
  auditoria_id: number;
  tipo_documento: string;
  gravidade: string;
  status: string;
  observacao: string;
  crf?: number;
  crt?: string;
  base_calculo?: number;
  receita_declarada?: number;
}

// AuditoriaResumo — subset para ranking
export interface AuditoriaResumo {
  id: number;
  cnpj: string;
  razao_social: string;
  periodo: string;
  status_geral: string;
  conformidade_pct: number;
  fator_r: number;
  aliquota_efetiva: number;
  classificacao_anexo?: string;
  pendencias_criticas_count: number;
}

// VisaoGeralResponse — KPIs + empresas[]
export interface VisaoGeralResponse {
  kpis: {
    total_empresas: number;
    conformes: number;
    criticas: number;
    total_documentos_faltantes: number;
  };
  empresas: AuditoriaResumo[];
}
