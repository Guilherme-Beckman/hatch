import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  template: `
    <div class="auth-screen">
      <div class="auth-hero">
        <div class="auth-logo">🐦</div>
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
  `,
  styles: [`
    .auth-screen {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 24px;
      background: linear-gradient(160deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
      gap: 32px;
    }
    .auth-hero { text-align: center; }
    .auth-logo { font-size: 72px; line-height: 1; margin-bottom: 12px; filter: drop-shadow(0 0 20px rgba(255,255,255,0.3)); }
    .auth-title { font-size: 42px; font-weight: 800; color: #fff; margin: 0 0 8px; letter-spacing: -1px; }
    .auth-subtitle { font-size: 16px; color: rgba(255,255,255,0.7); margin: 0; }

    .auth-birds-preview {
      display: flex;
      gap: 16px;
      font-size: 32px;
    }
    .preview-bird {
      animation: float 2s ease-in-out infinite alternate;
      display: inline-block;
    }
    @keyframes float {
      from { transform: translateY(0px); }
      to { transform: translateY(-10px); }
    }

    .auth-actions {
      width: 100%;
      max-width: 320px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      align-items: center;
    }
    .auth-description {
      text-align: center;
      color: rgba(255,255,255,0.6);
      font-size: 14px;
      line-height: 1.5;
      margin: 0;
    }
    .btn-google {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 14px 20px;
      background: #fff;
      color: #3c4043;
      border: none;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
      box-shadow: 0 4px 24px rgba(0,0,0,0.3);
    }
    .btn-google:active { transform: scale(0.97); }
    .btn-google:disabled { opacity: 0.6; cursor: not-allowed; }
    .spinner {
      width: 16px; height: 16px;
      border: 2px solid #ccc;
      border-top-color: #333;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .auth-error { color: #ff6b6b; font-size: 13px; text-align: center; margin: 0; }
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
