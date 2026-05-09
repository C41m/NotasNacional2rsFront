import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CompanyCreate } from '../../models/company.model';

@Component({
  selector: 'app-company-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './company-form.component.html',
  styleUrls: ['./company-form.component.css']
})
export class CompanyFormComponent {
  model: CompanyCreate = {
    nome: '',
    cnpj: '',
    pfx_base64: '',
    password: ''
  };
  loading = false;
  error = '';
  success = false;

  constructor(private api: ApiService, private router: Router) {}

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
    this.loading = true;
    this.error = '';
    this.api.createCompany(this.model).subscribe({
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
