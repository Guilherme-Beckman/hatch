import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bottom-nav">
      <a routerLink="/timer" routerLinkActive="active" class="nav-item">
        <span class="nav-icon">⏱️</span>
        <span class="nav-label">Focar</span>
      </a>
      <a routerLink="/incubadora" routerLinkActive="active" class="nav-item">
        <span class="nav-icon">🥚</span>
        <span class="nav-label">Ovos</span>
      </a>
      <a routerLink="/aviario" routerLinkActive="active" class="nav-item">
        <span class="nav-icon">🐦</span>
        <span class="nav-label">Aviário</span>
      </a>
      <a routerLink="/perfil" routerLinkActive="active" class="nav-item">
        <span class="nav-icon">👤</span>
        <span class="nav-label">Perfil</span>
      </a>
    </nav>
  `,
  styles: [`
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      background: var(--surface);
      border-top: 1px solid var(--border);
      padding: 8px 0 max(8px, env(safe-area-inset-bottom));
      z-index: 100;
    }
    .nav-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      text-decoration: none;
      color: var(--text-muted);
      transition: color 0.2s;
      padding: 4px 0;
    }
    .nav-item.active {
      color: var(--primary);
    }
    .nav-icon { font-size: 22px; line-height: 1; }
    .nav-label { font-size: 10px; font-weight: 600; letter-spacing: 0.3px; }
  `],
})
export class BottomNavComponent {}
