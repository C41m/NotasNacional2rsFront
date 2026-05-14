import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UiService } from './services/ui.service';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ApiService } from './services/api.service';
import { interval, Subject, takeUntil, tap, switchMap, timer } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = '2RSNotas';
  isDark = true;
  currentRoute = 'Empresas';

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    public ui: UiService,
    private api: ApiService
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

    // Heartbeat para manter o servidor ativo no Render
    // Usa timer recursivo com intervalo aleatório entre 4 e 7 minutos
    const sendHeartbeat = () =>
      timer(4 * 60 * 1000 + Math.random() * 3 * 60 * 1000).pipe(
        tap(() => this.api.healthCheck().subscribe()),
        takeUntil(this.destroy$)
      );

    sendHeartbeat()
      .pipe(switchMap(() => sendHeartbeat()))
      .subscribe();
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    document.body.classList.toggle('light-theme', !this.isDark);
    document.body.classList.toggle('dark-theme', this.isDark);
  }

  go(path: string) {
    this.router.navigateByUrl(path);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}