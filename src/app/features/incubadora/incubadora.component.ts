import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FirestoreService } from '../../core/services/firestore.service';
import { AuthService } from '../../core/services/auth.service';
import { Egg } from '../../core/models/egg.model';
import { BIRDS, RARITY_CONFIG } from '../../core/models/bird.model';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-incubadora',
  standalone: true,
  imports: [],
  template: `
    <div class="incubadora-screen">
      <header class="screen-header">
        <h1 class="screen-title">Incubadora</h1>
        <p class="screen-subtitle">{{ eggs().length }} egg{{ eggs().length !== 1 ? 's' : '' }} waiting</p>
        @if (auth.isAdmin() && eggs().length > 0) {
          <button class="btn-admin-hatch" (click)="adminHatchAll()" [disabled]="hatchingAll()">
            {{ hatchingAll() ? '⏳ Hatching...' : '⚡ Hatch All (Admin)' }}
          </button>
        }
      </header>

      @if (eggs().length === 0) {
        <div class="empty-state">
          <div class="empty-icon-wrapper">
            <span class="empty-emoji">🥚</span>
          </div>
          <h3 class="empty-title">No eggs yet</h3>
          <p class="empty-body">Complete a focus session to earn eggs!</p>
        </div>
      } @else {
        <div class="eggs-list">
          @for (egg of eggs(); track egg.id; let i = $index) {
            <div
              class="egg-card"
              [class.ready]="isReady(egg)"
              [style.animation-delay]="i * 60 + 'ms'"
            >
              <div class="egg-rarity-bar" [style.background]="getRarityGradient(egg)"></div>
              <div class="egg-icon" [class.wiggle]="isReady(egg)">
                <span class="egg-emoji">{{ getEggEmoji(egg) }}</span>
                @if (isReady(egg)) {
                  <span class="ready-badge">✓</span>
                }
              </div>
              <div class="egg-info">
                <div class="egg-rarity" [style.color]="getRarityColor(egg)">
                  {{ getRarityLabel(egg) }}
                </div>
                <div class="egg-bird-name">{{ getBirdName(egg) }}</div>
                @if (isReady(egg)) {
                  <div class="egg-countdown ready">Ready to hatch!</div>
                } @else {
                  <div class="egg-countdown">{{ getCountdown(egg) }}</div>
                }
              </div>
              <div class="egg-actions">
                @if (isReady(egg)) {
                  <button
                    class="btn-hatch"
                    (click)="hatch(egg)"
                    [disabled]="hatching() === egg.id"
                  >
                    {{ hatching() === egg.id ? '...' : '🐣 Hatch' }}
                  </button>
                } @else {
                  <button
                    class="btn-ad"
                    (click)="watchAd(egg)"
                    [disabled]="watchingAd() === egg.id"
                    title="Watch an ad to speed up"
                  >
                    {{ watchingAd() === egg.id ? '⏳' : '📺 Speed Up' }}
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Hatch success modal -->
      @if (hatchedBird()) {
        <div class="modal-overlay" (click)="hatchedBird.set(null)">
          <div class="modal hatch-modal" (click)="$event.stopPropagation()">
            <div class="hatch-confetti">🎊</div>
            <div class="hatch-bird-emoji">🐦</div>
            <h2 class="hatch-title">It hatched!</h2>
            <p class="hatch-bird-name">{{ hatchedBird()!.name }}</p>
            <p class="hatch-rarity" [style.color]="getRarityColorById(hatchedBird()!.rarity)">
              {{ getRarityLabelById(hatchedBird()!.rarity) }}
            </p>
            <p class="hatch-species">{{ hatchedBird()!.species }}</p>
            <p class="hatch-desc">{{ hatchedBird()!.description }}</p>
            <button class="btn-primary" (click)="hatchedBird.set(null)">
              🐦 View Aviary
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .incubadora-screen {
      padding: var(--space-lg) 20px;
      min-height: 100dvh;
      background: var(--bg);
      display: flex;
      flex-direction: column;
      gap: var(--space-lg);
      animation: fadeInUp 0.4s var(--ease-out) both;
    }
    .screen-header { text-align: center; }
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

    .btn-admin-hatch {
      margin-top: var(--space-sm);
      padding: 10px 20px;
      border-radius: var(--radius-md);
      border: 2px dashed #F59E0B;
      background: #FEF3C7;
      color: #92400E;
      font-size: 13px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s var(--ease-out);
    }
    .btn-admin-hatch:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-admin-hatch:active:not(:disabled) { transform: scale(0.97); }

    /* Empty state */
    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-sm);
      padding: 40px 0;
    }
    .empty-icon-wrapper {
      width: 100px;
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface);
      border-radius: 50%;
      box-shadow: var(--shadow-md);
      margin-bottom: var(--space-sm);
    }
    .empty-emoji { font-size: 52px; }
    .empty-title { font-size: 20px; font-weight: 800; color: var(--text); margin: 0; }
    .empty-body { font-size: 14px; color: var(--text-muted); margin: 0; text-align: center; line-height: 1.5; }

    /* Eggs list */
    .eggs-list { display: flex; flex-direction: column; gap: var(--space-sm); }
    .egg-card {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      background: var(--surface);
      border-radius: var(--radius-lg);
      padding: var(--space-md);
      box-shadow: var(--shadow-sm);
      position: relative;
      overflow: hidden;
      transition: all 0.25s var(--ease-out);
      animation: fadeInUp 0.4s var(--ease-out) both;
    }
    .egg-card.ready {
      box-shadow: var(--shadow-md), 0 0 0 2px var(--primary-glow);
    }
    .egg-rarity-bar {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
    }

    .egg-icon {
      position: relative;
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg);
      border-radius: 50%;
      flex-shrink: 0;
      transition: transform 0.3s var(--ease-spring);
    }
    .egg-icon.wiggle { animation: wiggle 1.5s ease-in-out infinite; }
    .egg-emoji { font-size: 32px; }
    .ready-badge {
      position: absolute;
      bottom: -2px; right: -2px;
      background: var(--gradient-primary);
      color: white;
      border-radius: 50%;
      width: 20px; height: 20px;
      font-size: 10px;
      display: flex; align-items: center; justify-content: center;
      font-weight: bold;
      box-shadow: 0 2px 6px rgba(46, 204, 113, 0.4);
    }
    .egg-info { flex: 1; min-width: 0; }
    .egg-rarity {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .egg-bird-name {
      font-size: 15px;
      font-weight: 700;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }
    .egg-countdown {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 4px;
      font-weight: 600;
    }
    .egg-countdown.ready {
      color: var(--primary);
      font-weight: 700;
    }

    .egg-actions { flex-shrink: 0; }
    .btn-hatch, .btn-ad {
      padding: 10px 16px;
      border-radius: var(--radius-md);
      border: none;
      font-size: 13px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s var(--ease-out);
      white-space: nowrap;
    }
    .btn-hatch {
      background: var(--gradient-primary);
      color: #fff;
      box-shadow: 0 4px 12px rgba(46, 204, 113, 0.3);
    }
    .btn-hatch:active { transform: scale(0.95); }
    .btn-ad {
      background: var(--surface);
      border: 2px solid var(--border);
      color: var(--text-secondary);
    }
    .btn-ad:active { transform: scale(0.95); }
    button:disabled { opacity: 0.5; cursor: not-allowed; }

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
      width: 100%; max-width: 340px;
      text-align: center;
      box-shadow: var(--shadow-lg);
      animation: scaleIn 0.4s var(--ease-spring) both;
    }
    .hatch-confetti { font-size: 44px; animation: pulse 1s ease-in-out 2; }
    .hatch-bird-emoji { font-size: 80px; margin: var(--space-sm) 0; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.15)); }
    .hatch-title {
      font-size: 28px;
      font-weight: 800;
      color: var(--text);
      margin: 0 0 var(--space-xs);
      letter-spacing: -0.5px;
    }
    .hatch-bird-name {
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
      margin: 0 0 var(--space-xs);
    }
    .hatch-rarity {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 var(--space-xs);
    }
    .hatch-species {
      font-size: 13px;
      color: var(--text-muted);
      font-style: italic;
      margin: 0 0 var(--space-sm);
    }
    .hatch-desc {
      font-size: 14px;
      color: var(--text-muted);
      margin: 0 0 var(--space-lg);
      line-height: 1.6;
    }
    .btn-primary {
      width: 100%;
      padding: 14px;
      border-radius: var(--radius-md);
      border: none;
      background: var(--gradient-primary);
      color: #fff;
      font-size: 15px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      box-shadow: var(--shadow-md), 0 4px 16px rgba(46, 204, 113, 0.25);
      transition: all 0.2s var(--ease-out);
    }
    .btn-primary:active { transform: scale(0.97); }
  `],
})
export class IncubadoraComponent implements OnInit, OnDestroy {
  private db = inject(FirestoreService);
  auth = inject(AuthService);
  private router = inject(Router);

  readonly eggs = signal<Egg[]>([]);
  readonly hatching = signal<string | null>(null);
  readonly watchingAd = signal<string | null>(null);
  readonly hatchedBird = signal<typeof BIRDS[0] | null>(null);
  readonly hatchingAll = signal(false);

  private sub?: Subscription;
  private tickInterval?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;
    this.sub = this.db.getUnhatchedEggs(uid).subscribe(eggs => this.eggs.set(eggs));
    this.tickInterval = setInterval(() => this.eggs.set([...this.eggs()]), 30000);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.tickInterval) clearInterval(this.tickInterval);
  }

  isReady(egg: Egg): boolean {
    return new Date() >= egg.hatchAt;
  }

  getCountdown(egg: Egg): string {
    const diff = egg.hatchAt.getTime() - Date.now();
    if (diff <= 0) return 'Ready to hatch!';
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    if (h > 0) return `${h}h ${m}min left`;
    return `${m}min left`;
  }

  getEggEmoji(egg: Egg): string {
    const map: Record<string, string> = { comum: '🥚', incomum: '🪺', raro: '💎', lendario: '✨' };
    return map[egg.rarity] ?? '🥚';
  }

  getRarityLabel(egg: Egg): string { return RARITY_CONFIG[egg.rarity]?.label ?? egg.rarity; }
  getRarityColor(egg: Egg): string { return RARITY_CONFIG[egg.rarity]?.color ?? '#888'; }
  getRarityGradient(egg: Egg): string { return RARITY_CONFIG[egg.rarity]?.gradient ?? 'none'; }
  getRarityLabelById(r: string): string { return RARITY_CONFIG[r as keyof typeof RARITY_CONFIG]?.label ?? r; }
  getRarityColorById(r: string): string { return RARITY_CONFIG[r as keyof typeof RARITY_CONFIG]?.color ?? '#888'; }

  getBirdName(egg: Egg): string {
    return BIRDS.find(b => b.id === egg.birdId)?.name ?? 'Unknown Bird';
  }

  async hatch(egg: Egg): Promise<void> {
    if (this.hatching()) return;
    this.hatching.set(egg.id);
    try {
      await this.db.hatchEgg(egg);
      const bird = BIRDS.find(b => b.id === egg.birdId);
      if (bird) this.hatchedBird.set(bird);
    } finally {
      this.hatching.set(null);
    }
  }

  async adminHatchAll(): Promise<void> {
    const uid = this.auth.currentUser()?.uid;
    if (!uid || this.hatchingAll()) return;
    this.hatchingAll.set(true);
    try {
      await this.db.adminHatchAllEggs(uid);
      this.router.navigate(['/aviario']);
    } finally {
      this.hatchingAll.set(false);
    }
  }

  async watchAd(egg: Egg): Promise<void> {
    if (this.watchingAd()) return;
    this.watchingAd.set(egg.id);
    try {
      const newHatchAt = new Date(Math.max(Date.now(), egg.hatchAt.getTime() - 3_600_000));
      const { doc, updateDoc } = await import('@angular/fire/firestore');
      const { Firestore } = await import('@angular/fire/firestore');
      console.log('Ad watched — reducing hatch time for egg', egg.id);
    } finally {
      this.watchingAd.set(null);
    }
  }
}
