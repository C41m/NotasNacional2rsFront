import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UiService } from './services/ui.service';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = '2RSNotas';
  isDark = true;
  currentRoute = 'Empresas';

  constructor(
    private router: Router,
    public ui: UiService
  ) {}

  private routeLabels: { [key: string]: string } = {
    '/companies': 'Empresas',
    '/companies/new': 'Nova Empresa',
    '/download': 'Download NFSe',
    '/batches': 'Downloads Ativos'
  };

  ngOnInit() {
    this.router.events.subscribe(() => {
      const url = this.router.url;
      this.currentRoute = this.routeLabels[url] || 'Página Inicial';
      this.ui.closeSidebar();
    });
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    document.body.classList.toggle('light-theme', !this.isDark);
    document.body.classList.toggle('dark-theme', this.isDark);
  }

  go(path: string) {
    this.router.navigateByUrl(path);
  }
}