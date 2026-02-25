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
          <div class="avatar-wrapper">
            <img
              class="avatar"
              [src]="user.photoURL || 'https://ui-avatars.com/api/?name=' + (user.displayName || 'U')"
              [alt]="user.displayName || 'Usuário'"
            />
            <div class="avatar-ring"></div>
          </div>
          <h2 class="user-name">{{ user.displayName }}</h2>
          <p class="user-email">{{ user.email }}</p>
        }
      </header>

      @if (profile()) {
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-icon">⏱️</span>
            <span class="stat-value">{{ formatHours(profile()!.totalFocusMinutes) }}</span>
            <span class="stat-label">horas focadas</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">🔥</span>
            <span class="stat-value">{{ profile()!.totalSessions }}</span>
            <span class="stat-label">sessões completas</span>
          </div>
        </div>
      }

      <div class="achievements-section">
        <h3 class="section-label">Conquistas</h3>
        <div class="achievements-list">
          @for (a of achievements(); track a.id; let i = $index) {
            <div
              class="achievement-item"
              [class.earned]="a.earned"
              [style.animation-delay]="i * 50 + 'ms'"
            >
              <div class="achievement-icon-wrapper" [class.glow]="a.earned">
                <span class="achievement-icon">{{ a.icon }}</span>
              </div>
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
      padding: var(--space-lg) 20px;
      min-height: 100dvh;
      background: var(--bg);
      display: flex;
      flex-direction: column;
      gap: var(--space-lg);
      animation: fadeInUp 0.4s var(--ease-out) both;
    }

    /* Header */
    .perfil-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-md) 0;
    }
    .avatar-wrapper {
      position: relative;
      width: 88px;
      height: 88px;
    }
    .avatar {
      width: 88px; height: 88px;
      border-radius: 50%;
      object-fit: cover;
      position: relative;
      z-index: 1;
      box-shadow: var(--shadow-md);
    }
    .avatar-ring {
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      background: var(--gradient-primary);
      z-index: 0;
      animation: spin 6s linear infinite;
    }
    .user-name {
      font-size: 22px;
      font-weight: 800;
      color: var(--text);
      margin: 0;
      letter-spacing: -0.3px;
    }
    .user-email {
      font-size: 13px;
      color: var(--text-muted);
      margin: 0;
      font-weight: 600;
    }

    /* Stats */
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-sm); }
    .stat-card {
      background: var(--surface);
      border-radius: var(--radius-lg);
      padding: var(--space-lg) var(--space-md);
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-xs);
      box-shadow: var(--shadow-sm);
    }
    .stat-icon { font-size: 28px; }
    .stat-value {
      font-size: 36px;
      font-weight: 800;
      color: var(--primary);
      line-height: 1;
      letter-spacing: -1px;
    }
    .stat-label {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Achievements */
    .section-label {
      font-size: 12px;
      font-weight: 800;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 var(--space-sm);
    }
    .achievements-list { display: flex; flex-direction: column; gap: var(--space-sm); }
    .achievement-item {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      background: var(--surface);
      border-radius: var(--radius-md);
      padding: var(--space-sm) var(--space-md);
      opacity: 0.4;
      transition: all 0.3s var(--ease-out);
      box-shadow: var(--shadow-sm);
      animation: fadeInUp 0.4s var(--ease-out) both;
    }
    .achievement-item.earned {
      opacity: 1;
      box-shadow: var(--shadow-md);
    }
    .achievement-icon-wrapper {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg);
      border-radius: 50%;
      flex-shrink: 0;
      transition: all 0.3s var(--ease-out);
    }
    .achievement-icon-wrapper.glow {
      animation: glow 3s ease-in-out infinite;
    }
    .achievement-icon { font-size: 24px; }
    .achievement-info { flex: 1; }
    .achievement-name {
      display: block;
      font-size: 14px;
      font-weight: 800;
      color: var(--text);
    }
    .achievement-desc {
      display: block;
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 600;
      line-height: 1.4;
    }
    .achievement-check {
      color: var(--primary);
      font-size: 20px;
      font-weight: bold;
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--primary-light);
      border-radius: 50%;
    }

    /* Actions */
    .actions-section { margin-top: auto; padding-top: var(--space-sm); }
    .btn-signout {
      width: 100%;
      padding: 14px;
      border-radius: var(--radius-md);
      border: 2px solid var(--border);
      background: transparent;
      color: var(--text-muted);
      font-size: 15px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s var(--ease-out);
    }
    .btn-signout:active { transform: scale(0.97); background: var(--surface); }
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
