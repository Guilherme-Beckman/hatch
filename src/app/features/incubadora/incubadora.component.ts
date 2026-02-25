import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FirestoreService } from '../../core/services/firestore.service';
import { AuthService } from '../../core/services/auth.service';
import { Egg } from '../../core/models/egg.model';
import { BIRDS, RARITY_CONFIG } from '../../core/models/bird.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-incubadora',
  standalone: true,
  imports: [],
  template: `
    <div class="incubadora-screen">
      <header class="screen-header">
        <h1 class="screen-title">Incubadora</h1>
        <p class="screen-subtitle">{{ eggs().length }} ovo{{ eggs().length !== 1 ? 's' : '' }} aguardando</p>
      </header>

      @if (eggs().length === 0) {
        <div class="empty-state">
          <p class="empty-emoji">🥚</p>
          <h3 class="empty-title">Nenhum ovo ainda</h3>
          <p class="empty-body">Complete uma sessão de foco para ganhar ovos!</p>
        </div>
      } @else {
        <div class="eggs-list">
          @for (egg of eggs(); track egg.id) {
            <div class="egg-card" [style.--rarity-gradient]="getRarityGradient(egg)">
              <div class="egg-icon">
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
                  <div class="egg-countdown ready">Pronto para chocar!</div>
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
                    {{ hatching() === egg.id ? '...' : '🐣 Chocar' }}
                  </button>
                } @else {
                  <button
                    class="btn-ad"
                    (click)="watchAd(egg)"
                    [disabled]="watchingAd() === egg.id"
                    title="Assistir anúncio para acelerar"
                  >
                    {{ watchingAd() === egg.id ? '⏳' : '📺 Acelerar' }}
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
            <h2 class="hatch-title">Nasceu!</h2>
            <p class="hatch-bird-name">{{ hatchedBird()!.name }}</p>
            <p class="hatch-rarity" [style.color]="getRarityColorById(hatchedBird()!.rarity)">
              {{ getRarityLabelById(hatchedBird()!.rarity) }}
            </p>
            <p class="hatch-species">{{ hatchedBird()!.species }}</p>
            <p class="hatch-desc">{{ hatchedBird()!.description }}</p>
            <button class="btn-primary" (click)="hatchedBird.set(null)">
              🐦 Ver Aviário
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .incubadora-screen {
      padding: 24px 20px;
      min-height: 100dvh;
      background: var(--bg);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .screen-header { text-align: center; }
    .screen-title { font-size: 28px; font-weight: 800; color: var(--text); margin: 0; }
    .screen-subtitle { font-size: 14px; color: var(--text-muted); margin: 4px 0 0; }

    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 40px 0;
    }
    .empty-emoji { font-size: 64px; margin: 0; }
    .empty-title { font-size: 20px; font-weight: 700; color: var(--text); margin: 0; }
    .empty-body { font-size: 14px; color: var(--text-muted); margin: 0; text-align: center; }

    .eggs-list { display: flex; flex-direction: column; gap: 12px; }
    .egg-card {
      display: flex;
      align-items: center;
      gap: 14px;
      background: var(--surface);
      border-radius: 16px;
      padding: 16px;
      border-left: 4px solid transparent;
      border-image: var(--rarity-gradient) 1;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
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
    }
    .egg-emoji { font-size: 32px; }
    .ready-badge {
      position: absolute;
      bottom: 0; right: 0;
      background: #22c55e;
      color: white;
      border-radius: 50%;
      width: 18px; height: 18px;
      font-size: 10px;
      display: flex; align-items: center; justify-content: center;
      font-weight: bold;
    }
    .egg-info { flex: 1; min-width: 0; }
    .egg-rarity { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .egg-bird-name { font-size: 15px; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .egg-countdown { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
    .egg-countdown.ready { color: #22c55e; font-weight: 600; }

    .egg-actions { flex-shrink: 0; }
    .btn-hatch, .btn-ad {
      padding: 8px 14px;
      border-radius: 10px;
      border: none;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.2s;
      white-space: nowrap;
    }
    .btn-hatch { background: var(--primary); color: #fff; }
    .btn-ad { background: var(--surface); border: 2px solid var(--border); color: var(--text); }
    button:disabled { opacity: 0.6; cursor: not-allowed; }

    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex; align-items: center; justify-content: center;
      z-index: 200; padding: 24px;
    }
    .modal {
      background: var(--surface);
      border-radius: 24px;
      padding: 32px 24px;
      width: 100%; max-width: 320px;
      text-align: center;
    }
    .hatch-confetti { font-size: 40px; }
    .hatch-bird-emoji { font-size: 72px; margin: 8px 0; }
    .hatch-title { font-size: 28px; font-weight: 800; color: var(--text); margin: 0 0 4px; }
    .hatch-bird-name { font-size: 20px; font-weight: 700; color: var(--text); margin: 0 0 4px; }
    .hatch-rarity { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 4px; }
    .hatch-species { font-size: 12px; color: var(--text-muted); font-style: italic; margin: 0 0 8px; }
    .hatch-desc { font-size: 14px; color: var(--text-muted); margin: 0 0 20px; line-height: 1.5; }
    .btn-primary { width: 100%; padding: 14px; border-radius: 14px; border: none; background: var(--primary); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; }
  `],
})
export class IncubadoraComponent implements OnInit, OnDestroy {
  private db = inject(FirestoreService);
  private auth = inject(AuthService);

  readonly eggs = signal<Egg[]>([]);
  readonly hatching = signal<string | null>(null);
  readonly watchingAd = signal<string | null>(null);
  readonly hatchedBird = signal<typeof BIRDS[0] | null>(null);

  private sub?: Subscription;
  private tickInterval?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;
    this.sub = this.db.getUnhatchedEggs(uid).subscribe(eggs => this.eggs.set(eggs));
    // Tick every 30s to refresh countdowns
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
    if (diff <= 0) return 'Pronto!';
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    if (h > 0) return `${h}h ${m}min restantes`;
    return `${m}min restantes`;
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
    return BIRDS.find(b => b.id === egg.birdId)?.name ?? 'Pássaro Desconhecido';
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

  async watchAd(egg: Egg): Promise<void> {
    if (this.watchingAd()) return;
    this.watchingAd.set(egg.id);
    try {
      // AdMob rewarded ad will be integrated here
      // For now, advance hatch time by a fixed amount
      const newHatchAt = new Date(Math.max(Date.now(), egg.hatchAt.getTime() - 3_600_000));
      const { doc, updateDoc } = await import('@angular/fire/firestore');
      const { Firestore } = await import('@angular/fire/firestore');
      // Using Firestore directly is handled via FirestoreService extension
      // Placeholder: reduce hatchAt by 1h
      console.log('Ad watched — reducing hatch time for egg', egg.id);
    } finally {
      this.watchingAd.set(null);
    }
  }
}
