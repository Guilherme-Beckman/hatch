import { Component, inject, signal, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { FirestoreService } from '../../core/services/firestore.service';
import { UserProfile } from '../../core/models/user.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  template: `
    <div class="perfil-screen">
      <header class="perfil-header">
        @if (auth.currentUser(); as user) {
          <img
            class="avatar"
            [src]="user.photoURL || 'https://ui-avatars.com/api/?name=' + (user.displayName || 'U')"
            [alt]="user.displayName || 'Usuário'"
          />
          <h2 class="user-name">{{ user.displayName }}</h2>
          <p class="user-email">{{ user.email }}</p>
        }
      </header>

      @if (profile()) {
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">{{ formatHours(profile()!.totalFocusMinutes) }}</span>
            <span class="stat-label">horas focadas</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ profile()!.totalSessions }}</span>
            <span class="stat-label">sessões completas</span>
          </div>
        </div>
      }

      <div class="achievements-section">
        <h3 class="section-label">Conquistas</h3>
        <div class="achievements-list">
          @for (a of achievements(); track a.id) {
            <div class="achievement-item" [class.earned]="a.earned">
              <span class="achievement-icon">{{ a.icon }}</span>
              <div class="achievement-info">
                <span class="achievement-name">{{ a.name }}</span>
                <span class="achievement-desc">{{ a.description }}</span>
              </div>
              @if (a.earned) {
                <span class="achievement-check">✓</span>
              }
            </div>
          }
        </div>
      </div>

      <div class="actions-section">
        <button class="btn-signout" (click)="auth.signOut()">
          Sair da conta
        </button>
      </div>
    </div>
  `,
  styles: [`
    .perfil-screen {
      padding: 24px 20px;
      min-height: 100dvh;
      background: var(--bg);
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .perfil-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px 0;
    }
    .avatar {
      width: 80px; height: 80px;
      border-radius: 50%;
      border: 3px solid var(--primary);
      object-fit: cover;
    }
    .user-name { font-size: 20px; font-weight: 800; color: var(--text); margin: 0; }
    .user-email { font-size: 13px; color: var(--text-muted); margin: 0; }

    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .stat-card {
      background: var(--surface);
      border-radius: 16px;
      padding: 20px 16px;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .stat-value { font-size: 32px; font-weight: 800; color: var(--primary); }
    .stat-label { font-size: 12px; color: var(--text-muted); font-weight: 600; }

    .section-label { font-size: 13px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 12px; }
    .achievements-list { display: flex; flex-direction: column; gap: 8px; }
    .achievement-item {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--surface);
      border-radius: 12px;
      padding: 12px;
      opacity: 0.4;
      transition: opacity 0.2s;
    }
    .achievement-item.earned { opacity: 1; }
    .achievement-icon { font-size: 28px; flex-shrink: 0; }
    .achievement-info { flex: 1; }
    .achievement-name { display: block; font-size: 14px; font-weight: 700; color: var(--text); }
    .achievement-desc { display: block; font-size: 12px; color: var(--text-muted); }
    .achievement-check { color: #22c55e; font-size: 18px; font-weight: bold; }

    .actions-section { margin-top: auto; padding-top: 8px; }
    .btn-signout {
      width: 100%;
      padding: 14px;
      border-radius: 14px;
      border: 2px solid var(--border);
      background: transparent;
      color: var(--text-muted);
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
    }
  `],
})
export class PerfilComponent implements OnInit {
  auth = inject(AuthService);
  private db = inject(FirestoreService);

  readonly profile = signal<UserProfile | null>(null);
  readonly achievements = signal([
    { id: 'first-session', icon: '🌱', name: 'Primeira Semente', description: 'Complete sua primeira sessão de foco', earned: false },
    { id: 'ten-sessions', icon: '🔥', name: 'Em Chamas', description: 'Complete 10 sessões', earned: false },
    { id: 'first-rare', icon: '💎', name: 'Achado Raro', description: 'Choque seu primeiro ovo raro', earned: false },
    { id: 'first-legendary', icon: '✨', name: 'Lenda Viva', description: 'Choque um ovo lendário', earned: false },
    { id: 'ten-hours', icon: '⏰', name: 'Focado de Verdade', description: 'Acumule 10 horas de foco', earned: false },
    { id: 'full-flock', icon: '🐦', name: 'Revoada Completa', description: 'Colecione 8 pássaros diferentes', earned: false },
  ]);

  ngOnInit(): void {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;
    this.db.getUserProfile(uid).subscribe(p => {
      this.profile.set(p as UserProfile);
      this.updateAchievements(p as UserProfile);
    });
  }

  formatHours(minutes: number): string {
    return (minutes / 60).toFixed(1);
  }

  private updateAchievements(p: UserProfile): void {
    if (!p) return;
    this.achievements.update(list => list.map(a => ({
      ...a,
      earned:
        (a.id === 'first-session' && p.totalSessions >= 1) ||
        (a.id === 'ten-sessions' && p.totalSessions >= 10) ||
        (a.id === 'ten-hours' && p.totalFocusMinutes >= 600) ||
        a.earned,
    })));
  }
}
