import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UiService } from '../../services/ui.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  constructor(public ui: UiService) {}

  navItems: Array<{ label: string; path: string; icon: string; badge?: string }> = [
    {
      label: 'Empresas',
      path: '/companies',
      icon: 'business'
    },
    {
      label: 'Download NFSe',
      path: '/download',
      icon: 'download'
    },
    {
      label: 'Downloads Ativos',
      path: '/batches',
      icon: 'task_alt'
    }
  ];

  isActive(path: string): boolean {
    return window.location.pathname === path || window.location.pathname.startsWith(path + '/');
  }
}