import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private messageService: MessageService) {}

  success(message: string, title?: string, duration = 4000) {
    this.messageService.add({
      severity: 'success',
      summary: title || 'Sucesso',
      detail: message,
      life: duration
    });
  }

  error(message: string, title?: string, duration = 4000) {
    this.messageService.add({
      severity: 'error',
      summary: title || 'Erro',
      detail: message,
      life: duration
    });
  }

  warning(message: string, title?: string, duration = 4000) {
    this.messageService.add({
      severity: 'warn',
      summary: title || 'Atenção',
      detail: message,
      life: duration
    });
  }

  info(message: string, title?: string, duration = 3000) {
    this.messageService.add({
      severity: 'info',
      summary: title || 'Informação',
      detail: message,
      life: duration
    });
  }
}