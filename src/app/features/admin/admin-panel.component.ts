import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { FirestoreService } from '../../core/services/firestore.service';
import { TimerService } from '../../core/services/timer.service';
import { FOODS, FoodType } from '../../core/models/food.model';
import { Rarity } from '../../core/models/bird.model';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="admin-screen">
      <header class="admin-header">
        <button class="btn-back" (click)="router.navigate(['/perfil'])">← Back</button>
        <h1 class="admin-title">⚡ Admin Panel</h1>
        <p class="admin-sub">{{ auth.currentUser()?.email }}</p>
      </header>

      @if (!auth.isAdmin()) {
        <div class="no-access">
          <p>Access denied.</p>
        </div>
      } @else {

        <!-- Timer -->
        <section class="admin-section">
          <h2 class="section-title">⏱️ Timer</h2>
          <div class="action-row">
            <div class="action-info">
              <span class="action-label">Current state</span>
              <span class="action-desc">{{ timerState() }}</span>
            </div>
            <button class="btn-action" (click)="skipTimer()" [disabled]="timerState() === 'idle' || timerState() === 'finished'">
              ⚡ Skip
            </button>
          </div>
        </section>

        <!-- Gerar Ovos -->
        <section class="admin-section">
          <h2 class="section-title">🥚 Generate Eggs</h2>
          <div class="form-group">
            <label class="form-label">Quantity</label>
            <div class="count-row">
              @for (n of [1,2,3,5]; track n) {
                <button class="btn-chip" [class.selected]="eggCount() === n" (click)="eggCount.set(n)">{{ n }}</button>
              }
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Rarity</label>
            <div class="rarity-row">
              @for (r of rarities; track r.id) {
                <button class="btn-chip" [class.selected]="selectedRarity() === r.id" (click)="selectedRarity.set(r.id)" [style.border-color]="r.color">
                  {{ r.label }}
                </button>
              }
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Food</label>
            <div class="food-row">
              @for (f of foods; track f.id) {
                <button class="btn-chip" [class.selected]="selectedFood() === f.id" (click)="selectedFood.set(f.id)">
                  {{ f.emoji }} {{ f.name }}
                </button>
              }
            </div>
          </div>
          <button class="btn-primary" (click)="generateEggs()" [disabled]="generating()">
            {{ generating() ? '⏳ Generating...' : '🥚 Generate ' + eggCount() + ' egg(s)' }}
          </button>
          @if (generateMsg()) {
            <p class="success-msg">{{ generateMsg() }}</p>
          }
        </section>

        <!-- Chocar Ovos -->
        <section class="admin-section">
          <h2 class="section-title">🐣 Hatch Eggs</h2>
          <p class="section-desc">Hatches all pending eggs and sends them to the aviary.</p>
          <button class="btn-warning" (click)="hatchAll()" [disabled]="hatchingAll()">
            {{ hatchingAll() ? '⏳ Hatching...' : '🐣 Hatch All' }}
          </button>
          @if (hatchMsg()) {
            <p class="success-msg">{{ hatchMsg() }}</p>
          }
        </section>

        <!-- Reset -->
        <section class="admin-section danger-section">
          <h2 class="section-title">🗑️ Reset Stats</h2>
          <p class="section-desc">Resets totalSessions and totalFocusMinutes on the profile.</p>
          <button class="btn-danger" (click)="resetStats()" [disabled]="resetting()">
            {{ resetting() ? '⏳ Resetting...' : '🗑️ Reset Stats' }}
          </button>
          @if (resetMsg()) {
            <p class="success-msg">{{ resetMsg() }}</p>
          }
        </section>

      }
    </div>
  `,
  styles: [`
    .admin-screen {
      padding: var(--space-lg) 20px;
      min-height: 100dvh;
      background: var(--bg);
      display: flex;
      flex-direction: column;
      gap: var(--space-lg);
      animation: fadeInUp 0.4s var(--ease-out) both;
    }

    .admin-header { display: flex; flex-direction: column; gap: var(--space-xs); }
    .btn-back {
      align-self: flex-start;
      background: none;
      border: none;
      color: var(--primary);
      font-size: 15px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      padding: 4px 0;
    }
    .admin-title {
      font-size: 26px;
      font-weight: 800;
      color: var(--text);
      margin: 0;
    }
    .admin-sub { font-size: 13px; color: var(--text-muted); margin: 0; font-weight: 600; }

    .no-access { text-align: center; color: var(--text-muted); padding: 40px 0; }

    .admin-section {
      background: var(--surface);
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
      box-shadow: var(--shadow-sm);
      border: 2px dashed #F59E0B;
    }
    .danger-section { border-color: #EF4444; }

    .section-title {
      font-size: 15px;
      font-weight: 800;
      color: var(--text);
      margin: 0;
    }
    .section-desc { font-size: 13px; color: var(--text-muted); margin: 0; line-height: 1.5; }

    .action-row { display: flex; align-items: center; justify-content: space-between; gap: var(--space-md); }
    .action-info { display: flex; flex-direction: column; gap: 2px; }
    .action-label { font-size: 12px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .action-desc { font-size: 15px; font-weight: 700; color: var(--text); text-transform: capitalize; }

    .form-group { display: flex; flex-direction: column; gap: var(--space-xs); }
    .form-label { font-size: 12px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

    .count-row, .rarity-row, .food-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn-chip {
      padding: 8px 14px;
      border-radius: var(--radius-full);
      border: 2px solid var(--border);
      background: var(--bg);
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s var(--ease-out);
    }
    .btn-chip.selected {
      border-color: var(--primary);
      background: var(--primary-light);
      color: var(--primary);
    }
    .btn-chip:active { transform: scale(0.95); }

    .btn-primary, .btn-warning, .btn-danger, .btn-action {
      padding: 12px 20px;
      border-radius: var(--radius-md);
      border: none;
      font-size: 14px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s var(--ease-out);
      width: 100%;
    }
    .btn-primary {
      background: var(--gradient-primary);
      color: #fff;
      box-shadow: var(--shadow-md);
    }
    .btn-warning {
      background: #FEF3C7;
      color: #92400E;
      border: 2px solid #F59E0B;
    }
    .btn-danger {
      background: #FEE2E2;
      color: #DC2626;
    }
    .btn-action {
      width: auto;
      background: #FEF3C7;
      color: #92400E;
      border: 2px solid #F59E0B;
      padding: 10px 18px;
    }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    button:active:not(:disabled) { transform: scale(0.97); }

    .success-msg {
      font-size: 13px;
      font-weight: 700;
      color: var(--primary);
      margin: 0;
      text-align: center;
      animation: fadeInUp 0.3s var(--ease-out) both;
    }
  `],
})
export class AdminPanelComponent {
  auth = inject(AuthService);
  router = inject(Router);
  private db = inject(FirestoreService);
  private timer = inject(TimerService);

  readonly foods = FOODS;
  readonly rarities: { id: Rarity; label: string; color: string }[] = [
    { id: 'comum', label: 'Common', color: '#888' },
    { id: 'incomum', label: 'Uncommon', color: '#3B82F6' },
    { id: 'raro', label: 'Rare', color: '#8B5CF6' },
    { id: 'lendario', label: 'Legendary', color: '#F59E0B' },
  ];

  readonly eggCount = signal(1);
  readonly selectedRarity = signal<Rarity>('comum');
  readonly selectedFood = signal<FoodType>('semente');

  readonly generating = signal(false);
  readonly hatchingAll = signal(false);
  readonly resetting = signal(false);

  readonly generateMsg = signal('');
  readonly hatchMsg = signal('');
  readonly resetMsg = signal('');

  readonly timerState = this.timer.state;

  skipTimer(): void {
    this.timer.skipToEnd();
  }

  async generateEggs(): Promise<void> {
    const uid = this.auth.currentUser()?.uid;
    if (!uid || this.generating()) return;
    this.generating.set(true);
    this.generateMsg.set('');
    try {
      await this.db.adminGenerateEggs(uid, this.eggCount(), this.selectedFood(), this.selectedRarity());
      this.generateMsg.set(`✓ ${this.eggCount()} egg(s) added to incubator!`);
      setTimeout(() => this.generateMsg.set(''), 3000);
    } finally {
      this.generating.set(false);
    }
  }

  async hatchAll(): Promise<void> {
    const uid = this.auth.currentUser()?.uid;
    if (!uid || this.hatchingAll()) return;
    this.hatchingAll.set(true);
    this.hatchMsg.set('');
    try {
      await this.db.adminHatchAllEggs(uid);
      this.hatchMsg.set('✓ All eggs hatched! Check the aviary.');
      setTimeout(() => this.hatchMsg.set(''), 3000);
    } finally {
      this.hatchingAll.set(false);
    }
  }

  async resetStats(): Promise<void> {
    const uid = this.auth.currentUser()?.uid;
    if (!uid || this.resetting()) return;
    this.resetting.set(true);
    this.resetMsg.set('');
    try {
      await this.db.adminResetStats(uid);
      this.resetMsg.set('✓ Stats reset!');
      setTimeout(() => this.resetMsg.set(''), 3000);
    } finally {
      this.resetting.set(false);
    }
  }
}
