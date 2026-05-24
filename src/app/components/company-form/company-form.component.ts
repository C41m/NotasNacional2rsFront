import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Company, CompanyCreate, CompanyUpdate } from '../../models/company.model';

@Component({
  selector: 'app-company-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './company-form.component.html',
  styleUrls: ['./company-form.component.css']
})
export class CompanyFormComponent implements OnInit {
  model: CompanyCreate = {
    nome: '',
    cnpj: '',
    pfx_base64: '',
    password: '',
    id_dominio: undefined
  };
  loading = false;
  error = '';
  success = false;
  isEdit = false;
  companyId: number | null = null;
  currentCertFile: string | null = null;
  showCertSection = false;

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.isEdit = true;
        this.companyId = +id;
        this.loadCompany(+id);
      } else {
        this.isEdit = false;
        this.companyId = null;
        this.resetForm();
      }
    });
  }

  loadCompany(id: number) {
    this.loading = true;
    this.api.getCompany(id.toString()).subscribe({
      next: (company: Company) => {
        this.model.nome = company.nome;
        this.model.cnpj = company.cnpj;
        this.model.id_dominio = company.id_dominio;
        this.currentCertFile = company.validade_cert || null;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar empresa';
        this.loading = false;
      }
    });
  }

  resetForm() {
    this.model = { nome: '', cnpj: '', pfx_base64: '', password: '', id_dominio: undefined };
    this.currentCertFile = null;
    this.showCertSection = false;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      this.model.pfx_base64 = (reader.result as string).split(',')[1];
    };
    reader.readAsDataURL(file);
  }

  onSubmit() {
    if (!this.model.nome || !this.model.cnpj) return;

    this.loading = true;
    this.error = '';

    if (this.isEdit && this.companyId) {
      const updateData: CompanyUpdate = {
        nome: this.model.nome,
        ...(this.model.id_dominio !== undefined && { id_dominio: this.model.id_dominio }),
        ...(this.model.pfx_base64 && { pfx_base64: this.model.pfx_base64 }),
        ...(this.model.password && { password: this.model.password })
      };

      this.api.updateCompany(this.companyId.toString(), updateData).subscribe({
        next: () => {
          this.success = true;
          this.loading = false;
          setTimeout(() => this.router.navigate(['/companies']), 2000);
        },
        error: (err) => {
          this.error = err.message || 'Erro ao atualizar empresa';
          this.loading = false;
        }
      });
    } else {
      const createData: CompanyCreate = {
        nome: this.model.nome,
        cnpj: this.model.cnpj,
        pfx_base64: this.model.pfx_base64,
        password: this.model.password
      };
      if (this.model.id_dominio !== undefined && this.model.id_dominio !== null) {
        createData.id_dominio = this.model.id_dominio;
      }

      this.api.createCompany(createData).subscribe({
        next: () => {
          this.success = true;
          this.loading = false;
          setTimeout(() => this.router.navigate(['/companies']), 2000);
        },
        error: (err) => {
          this.error = err.message || 'Erro ao cadastrar empresa';
          this.loading = false;
        }
      });
    }
  }
}
