import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  template: `
    <div class="auth-screen">
      <!-- Decorative particles -->
      <div class="particles">
        @for (i of [1,2,3,4,5,6,7,8]; track i) {
          <span class="particle" [style.--delay]="i * 0.7 + 's'" [style.--x]="(i * 37 % 100) + '%'"></span>
        }
      </div>

      <div class="auth-content">
        <div class="auth-hero">
          <div class="auth-logo">
            <span class="logo-emoji">🐦</span>
            <span class="logo-ring"></span>
          </div>
          <h1 class="auth-title">Hatch</h1>
          <p class="auth-subtitle">Foque. Plante. Veja pássaros raros nascerem.</p>
        </div>

        <div class="auth-birds-preview">
          <span class="preview-bird" style="animation-delay: 0s">🦜</span>
          <span class="preview-bird" style="animation-delay: 0.3s">🦚</span>
          <span class="preview-bird" style="animation-delay: 0.6s">🦅</span>
          <span class="preview-bird" style="animation-delay: 0.9s">🐦</span>
          <span class="preview-bird" style="animation-delay: 1.2s">🦉</span>
        </div>

        <div class="auth-actions">
          <p class="auth-description">
            Complete sessões de foco para chocar ovos e descobrir pássaros raros do Brasil.
          </p>

          <button
            class="btn-google"
            (click)="signIn()"
            [disabled]="loading()"
          >
            @if (loading()) {
              <span class="spinner"></span> Entrando...
            } @else {
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Entrar com Google
            }
          </button>

          @if (error()) {
            <p class="auth-error">{{ error() }}</p>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-screen {
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-xl) var(--space-lg);
      background: linear-gradient(160deg, #0B1D25 0%, #153243 40%, #1A4A3A 70%, #0D2818 100%);
      position: relative;
      overflow: hidden;
    }

    /* Particles */
    .particles {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .particle {
      position: absolute;
      width: 4px;
      height: 4px;
      background: rgba(74, 222, 128, 0.4);
      border-radius: 50%;
      left: var(--x);
      bottom: -10px;
      animation: particleRise 8s var(--delay) ease-in infinite;
    }
    @keyframes particleRise {
      0% { bottom: -10px; opacity: 0; transform: scale(0); }
      10% { opacity: 1; transform: scale(1); }
      90% { opacity: 0.6; }
      100% { bottom: 110%; opacity: 0; transform: scale(0.3); }
    }

    /* Content */
    .auth-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-xl);
      position: relative;
      z-index: 1;
      animation: fadeInUp 0.8s var(--ease-out) both;
    }

    .auth-hero { text-align: center; }
    .auth-logo {
      position: relative;
      display: inline-block;
      margin-bottom: var(--space-md);
    }
    .logo-emoji {
      font-size: 80px;
      line-height: 1;
      display: block;
      filter: drop-shadow(0 0 24px rgba(74, 222, 128, 0.35));
      animation: float 3s ease-in-out infinite alternate;
    }
    .logo-ring {
      position: absolute;
      inset: -12px;
      border: 2px solid rgba(74, 222, 128, 0.2);
      border-radius: 50%;
      animation: spin 12s linear infinite;
    }

    .auth-title {
      font-size: 48px;
      font-weight: 800;
      color: #fff;
      margin: 0 0 var(--space-sm);
      letter-spacing: -1.5px;
      text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
    }
    .auth-subtitle {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.6);
      margin: 0;
      font-weight: 600;
    }

    /* Bird preview */
    .auth-birds-preview {
      display: flex;
      gap: var(--space-md);
      font-size: 36px;
    }
    .preview-bird {
      animation: float 2.4s ease-in-out infinite alternate;
      display: inline-block;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
      transition: transform 0.2s var(--ease-spring);
    }

    /* Actions */
    .auth-actions {
      width: 100%;
      max-width: 340px;
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
      align-items: center;
    }
    .auth-description {
      text-align: center;
      color: rgba(255, 255, 255, 0.5);
      font-size: 14px;
      line-height: 1.6;
      margin: 0;
    }
    .btn-google {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 16px 24px;
      background: #fff;
      color: #3c4043;
      border: none;
      border-radius: var(--radius-md);
      font-size: 15px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s var(--ease-out);
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25), 0 0 0 0 rgba(255, 255, 255, 0);
    }
    .btn-google:hover {
      box-shadow: 0 6px 32px rgba(0, 0, 0, 0.3), 0 0 0 3px rgba(255, 255, 255, 0.1);
      transform: translateY(-1px);
    }
    .btn-google:active { transform: scale(0.97) translateY(0); }
    .btn-google:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    .spinner {
      width: 18px; height: 18px;
      border: 2.5px solid #ddd;
      border-top-color: #333;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }

    .auth-error {
      color: #FF6B6B;
      font-size: 13px;
      text-align: center;
      margin: 0;
      padding: var(--space-sm) var(--space-md);
      background: rgba(255, 107, 107, 0.1);
      border-radius: var(--radius-sm);
      animation: fadeIn 0.3s ease;
    }
  `],
})
export class AuthComponent {
  private authService = inject(AuthService);
  loading = signal(false);
  error = signal('');

  async signIn(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      await this.authService.signInWithGoogle();
    } catch (e: any) {
      this.error.set('Erro ao entrar. Tente novamente.');
    } finally {
      this.loading.set(false);
    }
  }
}
