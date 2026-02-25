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
        <span class="nav-label">Focus</span>
        <span class="nav-dot"></span>
      </a>
      <a routerLink="/incubadora" routerLinkActive="active" class="nav-item">
        <span class="nav-icon">🥚</span>
        <span class="nav-label">Eggs</span>
        <span class="nav-dot"></span>
      </a>
      <a routerLink="/aviario" routerLinkActive="active" class="nav-item">
        <span class="nav-icon">🐦</span>
        <span class="nav-label">Aviary</span>
        <span class="nav-dot"></span>
      </a>
      <a routerLink="/perfil" routerLinkActive="active" class="nav-item">
        <span class="nav-icon">👤</span>
        <span class="nav-label">Profile</span>
        <span class="nav-dot"></span>
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
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-top: 1px solid rgba(0, 0, 0, 0.06);
      padding: 6px 0 max(6px, env(safe-area-inset-bottom));
      z-index: 100;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.04);
    }

    @media (prefers-color-scheme: dark) {
      .bottom-nav {
        background: rgba(22, 40, 22, 0.85);
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
      }
    }

    .nav-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      text-decoration: none;
      color: var(--text-muted);
      transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
      padding: 4px 0;
      position: relative;
    }
    .nav-item.active {
      color: var(--primary);
    }
    .nav-icon {
      font-size: 22px;
      line-height: 1;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .nav-item.active .nav-icon {
      transform: scale(1.15) translateY(-2px);
    }
    .nav-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    .nav-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--primary);
      opacity: 0;
      transform: scale(0);
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .nav-item.active .nav-dot {
      opacity: 1;
      transform: scale(1);
    }
  `],
})
export class BottomNavComponent {}
