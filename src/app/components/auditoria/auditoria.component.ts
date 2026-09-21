import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Auditoria, VisaoGeralResponse, AuditoriaIngestPayload, AuditoriaPendencia, AuditoriaResumo } from '../../models/auditoria.model';
import { DocumentoFiscal } from '../../models/documento-fiscal.model';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './auditoria.component.html',
  styleUrls: ['./auditoria.component.css']
})
export class AuditoriaComponent implements OnInit {
  activeTab: 'overview' | 'company' | 'ingest' = 'overview';
  periodos: string[] = [];
  selectedPeriodo: string = '';
  sortColumn: string = '';
  sortAsc: boolean = true;
  loading: boolean = false;

  // Search
  searchTerm: string = '';

  // Period filter
  periodoInicial: string = '';
  periodoFinal: string = '';

  // Flag to track if period filter was applied via search button
  periodoFilterApplied: boolean = false;

  // Tab 1 - Overview
  visaoGeral: VisaoGeralResponse | null = null;
  auditorias: Auditoria[] = [];
  visaoGeralError: boolean = false;
  dashboardKPIs: any = null;

  // Tab 2 - Company
  selectedCnpj: string = '';
  selectedRazaoSocial: string = '';
  auditoriaDetalhe: Auditoria | null = null;
  visaoGeralResponse: VisaoGeralResponse | null = null;
  auditoriaDetalheError: boolean = false;

  // Documentos Fiscais
  documentosFiscais: DocumentoFiscal[] = [];
  documentosFiscaisLoading: boolean = false;

  // Fator R Ranking
  fatorRanking: any[] = [];

  // Math para uso no template
  Math = Math;

  // Alertas de pendências críticas
  alertasCriticos: any[] = [];

  // Cálculos da folha de pagamento
  calcularFolha() {
    if (!this.auditoriaDetalhe) return;
    const folha = this.auditoriaDetalhe.folha_12m || 0;
    const proLabore = this.auditoriaDetalhe.pro_labore || 0;
    const inss = this.auditoriaDetalhe.inss || 0;
    const irrf = this.auditoriaDetalhe.irrf || 0;
    const fgts = this.auditoriaDetalhe.fgts || 0;

    // INSS esperado: 11% sobre pró-labore, limitado ao teto de R$ 8.475,55 (2026)
    const tetoINSS = 8475.55;
    const baseINSS = Math.min(proLabore, tetoINSS);
    this.auditoriaDetalhe.inss_esperado = baseINSS * 0.11;

    // IRRF esperado: tabela progressiva 2026
    // Base = pró-labore - INSS - deduções (R$ 189,59 por dependente, desconto simplificado R$ 607,20)
    const deducaoSimplificada = 607.20;
    const baseIRRF = Math.max(0, proLabore - inss - deducaoSimplificada);
    this.auditoriaDetalhe.base_calculo_irrf = baseIRRF;
    this.auditoriaDetalhe.deducoes_legais = deducaoSimplificada;

    // Tabela IRRF 2026 (Lei 15.191/2025)
    if (baseIRRF <= 2428.80) {
      this.auditoriaDetalhe.irrf_esperado = 0;
    } else if (baseIRRF <= 2826.65) {
      this.auditoriaDetalhe.irrf_esperado = baseIRRF * 0.075 - 182.16;
    } else if (baseIRRF <= 3751.05) {
      this.auditoriaDetalhe.irrf_esperado = baseIRRF * 0.15 - 394.16;
    } else if (baseIRRF <= 4664.68) {
      this.auditoriaDetalhe.irrf_esperado = baseIRRF * 0.225 - 675.49;
    } else {
      this.auditoriaDetalhe.irrf_esperado = baseIRRF * 0.275 - 908.73;
    }

    // Redução IRRF (Lei 15.270/2025) - pode zerar até ~R$ 5.000
    if (proLabore <= 5000) {
      this.auditoriaDetalhe.irrf_esperado = 0;
    }

    // FGTS esperado: 8% sobre pró-labore (se houver funcionários CLT)
    this.auditoriaDetalhe.fgts_esperado = proLabore * 0.08;

    // Líquido esperado
    this.auditoriaDetalhe.liquido_esperado = proLabore - inss - irrf;
  }

  // KPIs calculados por empresa
  kpisEmpresa: any = null;

  // Ingest form
  ingestPayload: AuditoriaIngestPayload = {
    cnpj: '',
    razao_social: '',
    periodo: '',
    status_geral: 'CONFORME',
    conformidade_pct: 0,
    observacao_geral: '',
    documentos_esperados: 0,
    documentos_encontrados: 0,
    fator_r: 0,
    aliquota_efetiva: 0,
    receita_pa: 0,
    rbt12: 0,
    folha_12m: 0,
    classificacao_anexo: '',
    analise_completa: '',
    pendencias: []
  };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadPeriodos();
    this.loadDashboardKPIs();
    this.loadFatorRanking();
    this.initPeriodoFilter();
  }

  initPeriodoFilter() {
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = now.getFullYear();
    const currentPeriod = `${currentMonth}/${currentYear}`;

    // Set both to current month by default (MM/AAAA format)
    this.periodoInicial = currentPeriod;
    this.periodoFinal = currentPeriod;
    this.periodoFilterApplied = true; // Apply filter on init with current month
  }

  formatPeriodoInput(event: any, field: 'inicial' | 'final') {
    const input = event.target;
    let value = input.value.replace(/\D/g, ''); // Remove non-digits

    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 6);
    }

    // Limit to MM/AAAA (7 chars)
    if (value.length > 7) {
      value = value.substring(0, 7);
    }

    input.value = value;
    if (field === 'inicial') {
      this.periodoInicial = value;
    } else {
      this.periodoFinal = value;
    }
  }

  // Convert MM/AAAA to YYYY-MM for API
  private toApiPeriodo(periodo: string): string {
    if (!periodo || periodo.length !== 7) return '';
    const [mm, yyyy] = periodo.split('/');
    return `${yyyy}-${mm}`;
  }

  loadPeriodos() {
    this.api.getPeriodos().subscribe({
      next: (periodos) => {
        this.periodos = periodos;
        if (periodos.length > 0 && !this.selectedPeriodo) {
          this.selectedPeriodo = periodos[0];
        }
        // If period filter already applied (on init), load with current month
        if (this.periodoFilterApplied) {
          this.loadVisaoGeral();
        }
      },
      error: (err) => console.error('Erro ao carregar períodos', err)
    });
  }

  loadVisaoGeral() {
    if (!this.selectedPeriodo && !this.periodoInicial && !this.periodoFinal) return;
    this.loading = true;
    this.visaoGeralError = false;

    // If period filter is applied via search button, fetch range
    if (this.periodoFilterApplied && (this.periodoInicial || this.periodoFinal)) {
      this.loadVisaoGeralMultiPeriodo();
      return;
    }

    // Single period (original behavior - when no filter applied)
    if (this.selectedPeriodo) {
      this.api.getVisaoGeral(this.selectedPeriodo).subscribe({
        next: (data) => {
          this.visaoGeral = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Erro ao carregar visão geral', err);
          this.loading = false;
          this.visaoGeralError = true;
        }
      });
    }
  }

  loadVisaoGeralMultiPeriodo() {
    // Generate list of periods in range
    const periodos = this.getPeriodosInRange(this.periodoInicial, this.periodoFinal);
    if (periodos.length === 0) {
      this.visaoGeral = { kpis: { total_empresas: 0, conformes: 0, criticas: 0, total_documentos_faltantes: 0 }, empresas: [] };
      this.loading = false;
      return;
    }

    // Fetch all periods in parallel and combine
    const requests = periodos.map(p => this.api.getVisaoGeral(p).toPromise());
    Promise.all(requests)
      .then(results => {
        // Combine all results
        let allEmpresas: any[] = [];
        let totalKpis = { total_empresas: 0, conformes: 0, criticas: 0, total_documentos_faltantes: 0 };

        results.forEach(r => {
          if (r) {
            allEmpresas = allEmpresas.concat(r.empresas || []);
            totalKpis.total_empresas += r.kpis?.total_empresas || 0;
            totalKpis.conformes += r.kpis?.conformes || 0;
            totalKpis.criticas += r.kpis?.criticas || 0;
            totalKpis.total_documentos_faltantes += r.kpis?.total_documentos_faltantes || 0;
          }
        });

        // Sort by pendencias_criticas_count desc
        allEmpresas.sort((a, b) => (b.pendencias_criticas_count || 0) - (a.pendencias_criticas_count || 0));

        this.visaoGeral = {
          kpis: totalKpis,
          empresas: allEmpresas
        };
        this.loading = false;
      })
      .catch(err => {
        console.error('Erro ao carregar visão geral multi-período', err);
        this.loading = false;
        this.visaoGeralError = true;
      });
  }

  getPeriodosInRange(inicial: string, final: string): string[] {
    const periodos: string[] = [];
    const allPeriodos = this.periodos; // already loaded from API (YYYY-MM format)

    // Convert display format (MM/AAAA) to API format (YYYY-MM)
    const apiInicial = this.toApiPeriodo(inicial);
    const apiFinal = this.toApiPeriodo(final);

    if (!apiInicial && !apiFinal) return allPeriodos;
    if (!apiInicial) {
      // Use earliest available period
      const sorted = [...allPeriodos].sort();
      return [sorted[0]];
    }
    if (!apiFinal) {
      // Use latest available period
      const sorted = [...allPeriodos].sort().reverse();
      return [sorted[0]];
    }

    for (const p of allPeriodos) {
      if (p >= apiInicial && p <= apiFinal) {
        periodos.push(p);
      }
    }
    return periodos;
  }

  onPeriodoSearch() {
      // Validate: swap if initial > final
      const apiInicial = this.toApiPeriodo(this.periodoInicial);
      const apiFinal = this.toApiPeriodo(this.periodoFinal);
      if (apiInicial && apiFinal && apiInicial > apiFinal) {
        // Swap them
        const temp = this.periodoInicial;
        this.periodoInicial = this.periodoFinal;
        this.periodoFinal = temp;
      }
      this.periodoFilterApplied = true;
      this.loadVisaoGeral();
    }

  clearPeriodoFilter() {
      this.periodoInicial = '';
      this.periodoFinal = '';
      this.periodoFilterApplied = false;
      // Fall back to single period selection
      if (this.selectedPeriodo) {
        this.loadVisaoGeral();
      }
    }

    // Format YYYY-MM to MM/AAAA for display
    formatPeriodoDisplay(periodo: string): string {
      if (!periodo || periodo.length !== 7) return periodo;
      const [yyyy, mm] = periodo.split('-');
      return `${mm}/${yyyy}`;
    }

    loadAuditoriaEmpresa(cnpj: string, periodo?: string) {
        if (!cnpj) return;
        const apiPeriodo = periodo || this.selectedPeriodo;
        if (!apiPeriodo) return;
        this.loading = true;
        this.auditoriaDetalheError = false;
        this.api.getAuditoriaEmpresa(cnpj, apiPeriodo).subscribe({
        next: (data) => {
          this.auditoriaDetalhe = data;
          this.selectedCnpj = data.cnpj;
          this.selectedRazaoSocial = data.razao_social;
          this.activeTab = 'company';
          this.loading = false;
          // Carregar documentos fiscais, calcular KPIs e verificar folha
          this.loadDocumentosFiscais(data.id);
          this.calcularKPIsEmpresa(data);
          this.calcularFolha();
          this.verificarAlertasCriticos(data);
        },
        error: (err) => {
          console.error('Erro ao carregar auditoria', err);
          this.loading = false;
          this.auditoriaDetalheError = true;
        }
      });
    }

    loadDocumentosFiscais(empresaId: number) {
      this.documentosFiscaisLoading = true;
      this.api.listDocumentosFiscais({ empresa_id: empresaId, limit: 100 }).subscribe({
        next: (response: any) => {
          this.documentosFiscais = response.data || response || [];
          this.documentosFiscaisLoading = false;
        },
        error: (err) => {
          console.error('Erro ao carregar documentos fiscais', err);
          this.documentosFiscaisLoading = false;
        }
      });
    }

    calcularKPIsEmpresa(auditoria: Auditoria) {
      const rbt12 = auditoria.rbt12 || 0;
      const receitaPA = auditoria.receita_pa || 0;
      const fatorR = auditoria.fator_r || 0;
      const aliquotaEfetiva = auditoria.aliquota_efetiva || 0;
      const folha12m = auditoria.folha_12m || 0;

      // Limite RBT12 para Simples Nacional (R$ 4.800.000)
      const limiteRBT12 = 4800000;
      const rbt12Percentual = rbt12 > 0 ? (rbt12 / limiteRBT12) * 100 : 0;

      // Fator R vs 28% (limite para enquadramento)
      const fatorRLimite = 28;
      const fatorRStatus = fatorR > fatorRLimite ? 'ACIMA' : 'ABAIXO';

      // Carga tributária estimada
      const cargaTributaria = receitaPA > 0 ? (aliquotaEfetiva / 100) * receitaPA : 0;

      // DAS estimado (alíquota efetiva sobre receita)
      const dasEstimado = cargaTributaria;

      this.kpisEmpresa = {
        rbt12,
        receitaPA,
        fatorR,
        aliquotaEfetiva,
        folha12m,
        limiteRBT12,
        rbt12Percentual,
        fatorRLimite,
        fatorRStatus,
        cargaTributaria,
        dasEstimado,
        proLabore: auditoria.pro_labore || 0,
        inss: auditoria.inss || 0,
        irrf: auditoria.irrf || 0,
        numFuncionarios: auditoria.num_funcionarios || 0,
        mediaMensalFolha: auditoria.media_mensal_folha || (folha12m > 0 ? folha12m / 12 : 0)
      };
    }

    verificarAlertasCriticos(auditoria: Auditoria) {
      const alertas: any[] = [];

      // Alerta: RBT12 próximo do limite
      if (this.kpisEmpresa?.rbt12Percentual > 80) {
        alertas.push({
          tipo: 'RBT12',
          severidade: this.kpisEmpresa.rbt12Percentual > 95 ? 'CRITICO' : 'ATENCAO',
          mensagem: `RBT12 em ${this.kpisEmpresa.rbt12Percentual.toFixed(1)}% do limite (R$ ${this.kpisEmpresa.rbt12.toLocaleString('pt-BR')})`
        });
      }

      // Alerta: Fator R acima de 28%
      if (this.kpisEmpresa?.fatorR > 28) {
        alertas.push({
          tipo: 'FATOR_R',
          severidade: 'CRITICO',
          mensagem: `Fator R em ${this.kpisEmpresa.fatorR.toFixed(2)}% (acima de 28%)`
        });
      }

      // Alerta: Documentos faltantes
      const faltantes = auditoria.documentos_esperados - auditoria.documentos_encontrados;
      if (faltantes > 0) {
        alertas.push({
          tipo: 'DOCUMENTOS',
          severidade: faltantes > 3 ? 'CRITICO' : 'ATENCAO',
          mensagem: `${faltantes} documento(s) faltante(s)`
        });
      }

      // Alerta: Conformidade baixa
      if (auditoria.conformidade_pct < 70) {
        alertas.push({
          tipo: 'CONFORMIDADE',
          severidade: auditoria.conformidade_pct < 50 ? 'CRITICO' : 'ATENCAO',
          mensagem: `Conformidade em ${auditoria.conformidade_pct}%`
        });
      }

      this.alertasCriticos = alertas;
    }

  submitIngest() {
    this.loading = true;
    this.api.ingestAuditoria(this.ingestPayload).subscribe({
      next: (data) => {
        this.auditoriaDetalhe = data;
        this.activeTab = 'company';
        this.selectedCnpj = data.cnpj;
        this.selectedRazaoSocial = data.razao_social;
        this.loadPeriodos();
        this.loadVisaoGeral();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao enviar ingest', err);
        this.loading = false;
      }
    });
  }

  loadDashboardKPIs() {
    if (!this.selectedPeriodo) return;
    this.api.getDashboardKPIs().subscribe({
      next: (data) => {
        this.dashboardKPIs = data;
      },
      error: (err) => console.error('Erro ao carregar KPIs', err)
    });
  }

  loadFatorRanking() {
    this.api.getRankingFatorR().subscribe({
      next: (data) => {
        this.fatorRanking = data;
      },
      error: (err) => console.error('Erro ao carregar ranking Fator R', err)
    });
  }

  setSort(column: string) {
    if (this.sortColumn === column) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortColumn = column;
      this.sortAsc = true;
    }
  }

  // Search methods
  clearSearch() {
    this.searchTerm = '';
  }

  get filteredEmpresas() {
    if (!this.visaoGeral?.empresas) return [];
    const term = this.searchTerm.toLowerCase().trim();
    let empresas = this.visaoGeral.empresas.filter(emp =>
      emp.cnpj.toLowerCase().includes(term) ||
      emp.razao_social.toLowerCase().includes(term)
    );
    if (this.sortColumn) {
      const reverse = this.sortAsc ? 1 : -1;
      empresas = empresas.sort((a, b) => {
        let valA: any, valB: any;
        switch (this.sortColumn) {
          case 'cnpj':
            valA = a.cnpj;
            valB = b.cnpj;
            break;
          case 'razao_social':
            valA = a.razao_social;
            valB = b.razao_social;
            break;
          case 'status_geral':
            valA = a.status_geral;
            valB = b.status_geral;
            break;
          case 'conformidade_pct':
            valA = a.conformidade_pct;
            valB = b.conformidade_pct;
            break;
          default:
            valA = 0;
            valB = 0;
        }
        if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }
        return (valA > valB ? 1 : valA < valB ? -1 : 0) * reverse;
      });
    }
    return empresas;
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      'CONFORME': 'badge-success',
      'ATENCAO': 'badge-warning',
      'CRITICO': 'badge-failed'
    };
    return map[status] || 'badge-processing';
  }

  getGravidadeBadge(gravidade: string): string {
    const map: Record<string, string> = {
      'ALTA': 'badge-failed',
      'MÉDIA': 'badge-warning',
      'BAIXA': 'badge-processing'
    };
    return map[gravidade] || 'badge-processing';
  }

  getStatusPendenciaBadge(status: string): string {
    const map: Record<string, string> = {
      'FALTANTE': 'badge-failed',
      'INCONSISTENTE': 'badge-warning',
      'CONFORME': 'badge-success'
    };
    return map[status] || 'badge-processing';
  }

  isTab(tab: string): boolean {
    return this.activeTab === tab;
  }
}