import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { TimerService } from '../../core/services/timer.service';
import { AuthService } from '../../core/services/auth.service';
import { FirestoreService } from '../../core/services/firestore.service';
import { FOODS, FoodType } from '../../core/models/food.model';
import { eggsFromSession } from '../../core/models/session.model';

@Component({
  selector: 'app-timer',
  standalone: true,
  template: `
    <div class="timer-screen">
      <header class="timer-header">
        <h1 class="screen-title">Hatch</h1>
        <p class="screen-subtitle">Foque e atraia pássaros raros</p>
      </header>

      <!-- Food selector -->
      @if (timer.state() === 'idle') {
        <section class="food-section">
          <h2 class="section-label">Qual alimento colocar hoje?</h2>
          <div class="food-grid">
            @for (food of foods; track food.id) {
              <button
                class="food-card"
                [class.selected]="timer.selectedFood() === food.id"
                (click)="timer.setFood(food.id)"
              >
                <span class="food-emoji">{{ food.emoji }}</span>
                <span class="food-name">{{ food.name }}</span>
                <span class="food-desc">{{ food.description }}</span>
              </button>
            }
          </div>
        </section>

        <!-- Duration selector -->
        <section class="duration-section">
          <h2 class="section-label">Quanto tempo?</h2>
          <div class="duration-presets">
            @for (preset of durationPresets; track preset) {
              <button
                class="preset-btn"
                [class.selected]="timer.targetMinutes() === preset"
                (click)="timer.setDuration(preset)"
              >
                {{ preset }}min
              </button>
            }
          </div>
          <div class="duration-custom">
            <label class="custom-label">Personalizado:</label>
            <input
              type="range"
              min="15" max="120" step="5"
              [value]="timer.targetMinutes()"
              (input)="timer.setDuration(+$any($event.target).value)"
              class="duration-slider"
            />
            <span class="custom-value">{{ timer.targetMinutes() }}min</span>
          </div>
          <div class="eggs-preview">
            <span class="eggs-icon">🥚</span>
            Esta sessão vai gerar
            <strong>{{ eggsPreview() }} ovo{{ eggsPreview() !== 1 ? 's' : '' }}</strong>
          </div>
        </section>
      }

      <!-- Timer ring -->
      <div class="timer-container" [class.active]="timer.state() !== 'idle'">
        <div class="timer-ring-wrapper">
          <svg class="timer-ring" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#2ECC71" />
                <stop offset="100%" stop-color="#27AE60" />
              </linearGradient>
            </defs>
            <circle
              class="ring-bg"
              cx="100" cy="100" r="88"
              fill="none" stroke-width="8"
            />
            <circle
              class="ring-progress"
              cx="100" cy="100" r="88"
              fill="none" stroke-width="8"
              stroke-linecap="round"
              stroke="url(#ringGrad)"
              [style.stroke-dasharray]="ringCircumference"
              [style.stroke-dashoffset]="ringOffset()"
              transform="rotate(-90 100 100)"
            />
          </svg>
          <div class="timer-center">
            @if (timer.state() !== 'idle') {
              <span class="timer-food-emoji">{{ selectedFoodEmoji() }}</span>
            }
            <span class="timer-time">{{ timer.formattedRemaining() }}</span>
            @if (timer.state() !== 'idle') {
              <span class="timer-state-label">{{ stateLabel() }}</span>
            }
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="timer-controls">
        @switch (timer.state()) {
          @case ('idle') {
            <button class="btn-start" (click)="start()">
              🌱 Começar Sessão
            </button>
          }
          @case ('running') {
            <div class="controls-row">
              <button class="btn-secondary" (click)="timer.pause()">⏸ Pausar</button>
              <button class="btn-danger" (click)="confirmAbandon()">✕ Abandonar</button>
            </div>
          }
          @case ('paused') {
            <div class="controls-row">
              <button class="btn-primary" (click)="timer.resume()">▶ Continuar</button>
              <button class="btn-danger" (click)="confirmAbandon()">✕ Abandonar</button>
            </div>
          }
          @case ('finished') {
            <div class="finished-message">
              <p class="finished-emoji">🎉</p>
              <p class="finished-text">Sessão concluída!</p>
              <p class="finished-sub">{{ eggsPreview() }} ovo{{ eggsPreview() !== 1 ? 's' : '' }} adicionado{{ eggsPreview() !== 1 ? 's' : '' }} à incubadora</p>
            </div>
            <button class="btn-primary" (click)="finishSession()">
              🥚 Ver Incubadora
            </button>
          }
        }
      </div>

      <!-- Abandon confirm modal -->
      @if (showAbandonModal()) {
        <div class="modal-overlay" (click)="showAbandonModal.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <p class="modal-emoji">🐣</p>
            <h3 class="modal-title">Abandonar sessão?</h3>
            <p class="modal-body">Os pássaros vão embora e você não receberá ovos.</p>
            <div class="modal-actions">
              <button class="btn-secondary" (click)="showAbandonModal.set(false)">Continuar</button>
              <button class="btn-danger" (click)="abandon()">Abandonar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .timer-screen {
      padding: var(--space-lg) 20px;
      min-height: 100dvh;
      background: var(--bg);
      display: flex;
      flex-direction: column;
      gap: var(--space-lg);
      animation: fadeInUp 0.4s var(--ease-out) both;
    }
    .timer-header { text-align: center; }
    .screen-title {
      font-size: 28px;
      font-weight: 800;
      color: var(--text);
      margin: 0;
      letter-spacing: -0.5px;
    }
    .screen-subtitle {
      font-size: 14px;
      color: var(--text-muted);
      margin: var(--space-xs) 0 0;
      font-weight: 600;
    }

    .section-label {
      font-size: 12px;
      font-weight: 800;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 var(--space-sm);
    }

    /* Food grid */
    .food-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .food-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-xs);
      padding: 14px 8px;
      background: var(--surface);
      border: 2px solid transparent;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.25s var(--ease-out);
      box-shadow: var(--shadow-sm);
    }
    .food-card:active { transform: scale(0.96); }
    .food-card.selected {
      border-color: var(--primary);
      background: var(--primary-light);
      box-shadow: var(--shadow-md), 0 0 0 3px var(--primary-glow);
      transform: translateY(-2px);
    }
    .food-emoji { font-size: 32px; transition: transform 0.25s var(--ease-spring); }
    .food-card.selected .food-emoji { transform: scale(1.15); }
    .food-name { font-size: 12px; font-weight: 700; color: var(--text); }
    .food-desc { font-size: 10px; color: var(--text-muted); text-align: center; line-height: 1.3; }

    /* Duration */
    .duration-section { display: flex; flex-direction: column; gap: var(--space-sm); }
    .duration-presets { display: flex; gap: var(--space-sm); flex-wrap: wrap; }
    .preset-btn {
      padding: 8px 16px;
      border-radius: var(--radius-full);
      border: 2px solid var(--border);
      background: var(--surface);
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s var(--ease-out);
      box-shadow: var(--shadow-sm);
    }
    .preset-btn:active { transform: scale(0.95); }
    .preset-btn.selected {
      border-color: var(--primary);
      background: var(--primary-light);
      color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-glow);
    }
    .duration-custom { display: flex; align-items: center; gap: 10px; }
    .custom-label { font-size: 12px; color: var(--text-muted); white-space: nowrap; font-weight: 600; }
    .duration-slider { flex: 1; accent-color: var(--primary); height: 6px; }
    .custom-value {
      font-size: 14px;
      font-weight: 800;
      color: var(--primary);
      min-width: 48px;
      text-align: right;
    }
    .eggs-preview {
      text-align: center;
      font-size: 14px;
      color: var(--text-muted);
      margin: 0;
      padding: var(--space-sm) var(--space-md);
      background: var(--surface);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-sm);
      font-weight: 600;
    }
    .eggs-preview strong { color: var(--primary); }
    .eggs-icon { font-size: 20px; }

    /* Timer */
    .timer-container {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .timer-ring-wrapper {
      position: relative;
      width: 230px;
      height: 230px;
      filter: drop-shadow(0 4px 20px rgba(46, 204, 113, 0.15));
    }
    .timer-container.active .timer-ring-wrapper {
      filter: drop-shadow(0 4px 30px rgba(46, 204, 113, 0.25));
    }
    .timer-ring { width: 100%; height: 100%; }
    .ring-bg { stroke: var(--border); opacity: 0.5; }
    .ring-progress {
      transition: stroke-dashoffset 1s linear;
      filter: drop-shadow(0 0 6px rgba(46, 204, 113, 0.4));
    }
    .timer-center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-xs);
    }
    .timer-food-emoji { font-size: 28px; }
    .timer-time {
      font-size: 48px;
      font-weight: 800;
      color: var(--text);
      font-variant-numeric: tabular-nums;
      line-height: 1;
      letter-spacing: -1px;
    }
    .timer-state-label {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 700;
    }

    /* Controls */
    .timer-controls { display: flex; flex-direction: column; align-items: center; gap: var(--space-sm); }
    .controls-row { display: flex; gap: var(--space-sm); width: 100%; }
    .controls-row > * { flex: 1; }

    .btn-primary, .btn-secondary, .btn-danger, .btn-start {
      padding: 14px 20px;
      border-radius: var(--radius-md);
      border: none;
      font-size: 15px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s var(--ease-out);
      width: 100%;
    }
    .btn-primary {
      background: var(--gradient-primary);
      color: #fff;
      box-shadow: var(--shadow-md), 0 4px 16px rgba(46, 204, 113, 0.25);
    }
    .btn-primary:active { transform: scale(0.97); }
    .btn-secondary {
      background: var(--surface);
      color: var(--text);
      border: 2px solid var(--border);
      box-shadow: var(--shadow-sm);
    }
    .btn-danger {
      background: #FEE2E2;
      color: #DC2626;
      box-shadow: var(--shadow-sm);
    }
    .btn-start {
      font-size: 17px;
      padding: 18px;
      background: var(--gradient-primary);
      color: #fff;
      box-shadow: var(--shadow-lg), 0 4px 20px rgba(46, 204, 113, 0.3);
      animation: pulse 2.5s ease-in-out infinite;
    }
    .btn-start:active { transform: scale(0.97); animation: none; }
    button:active { transform: scale(0.97); }

    /* Finished */
    .finished-message { text-align: center; animation: scaleIn 0.4s var(--ease-spring) both; }
    .finished-emoji { font-size: 56px; margin: 0; }
    .finished-text { font-size: 24px; font-weight: 800; color: var(--text); margin: var(--space-xs) 0; }
    .finished-sub { font-size: 15px; color: var(--text-muted); margin: 0 0 var(--space-sm); }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      z-index: 200; padding: var(--space-lg);
      animation: fadeIn 0.2s ease;
    }
    .modal {
      background: var(--surface);
      border-radius: var(--radius-xl);
      padding: var(--space-xl) var(--space-lg);
      width: 100%;
      max-width: 320px;
      text-align: center;
      box-shadow: var(--shadow-lg);
      animation: scaleIn 0.3s var(--ease-spring) both;
    }
    .modal-emoji { font-size: 44px; margin: 0 0 var(--space-sm); }
    .modal-title { font-size: 20px; font-weight: 800; color: var(--text); margin: 0 0 var(--space-sm); }
    .modal-body { font-size: 14px; color: var(--text-muted); margin: 0 0 var(--space-lg); line-height: 1.5; }
    .modal-actions { display: flex; gap: 10px; }
    .modal-actions > * { flex: 1; }
  `],
})
export class TimerComponent implements OnDestroy {
  timer = inject(TimerService);
  private auth = inject(AuthService);
  private db = inject(FirestoreService);
  private router = inject(Router);

  readonly foods = FOODS;
  readonly durationPresets = [15, 25, 45, 60, 90];
  readonly ringCircumference = 2 * Math.PI * 88;
  readonly showAbandonModal = signal(false);

  readonly eggsPreview = computed(() => eggsFromSession(this.timer.targetMinutes()));

  readonly selectedFoodEmoji = computed(() =>
    FOODS.find(f => f.id === this.timer.selectedFood())?.emoji ?? '🌾'
  );

  readonly ringOffset = computed(() => {
    const progress = this.timer.progressPercent() / 100;
    return this.ringCircumference * (1 - progress);
  });

  readonly stateLabel = computed(() => {
    const s = this.timer.state();
    if (s === 'running') return 'Focando...';
    if (s === 'paused') return 'Pausado';
    return '';
  });

  start(): void {
    this.timer.abandon();
    this.timer.start();
  }

  confirmAbandon(): void {
    this.showAbandonModal.set(true);
  }

  abandon(): void {
    this.showAbandonModal.set(false);
    this.timer.abandon();
  }

  async finishSession(): Promise<void> {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;

    const minutes = this.timer.targetMinutes();
    const food = this.timer.selectedFood() as FoodType;

    const sessionId = await this.db.saveSession(uid, minutes, food);
    await this.db.generateEggs(uid, sessionId, minutes, food);
    await this.db.growBirdsAfterSession(uid);

    this.timer.abandon();
    this.router.navigate(['/incubadora']);
  }

  ngOnDestroy(): void {
    // Timer keeps running in background (service is singleton)
  }
}
