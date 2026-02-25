import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FirestoreService } from '../../core/services/firestore.service';
import { AuthService } from '../../core/services/auth.service';
import { UserBird, BIRDS, RARITY_CONFIG, Bird, BirdStage } from '../../core/models/bird.model';
import { Subscription } from 'rxjs';

type AviarioTab = 'album' | 'cena';

@Component({
  selector: 'app-aviario',
  standalone: true,
  template: `
    <div class="aviario-screen">
      <header class="screen-header">
        <h1 class="screen-title">Aviary</h1>
        <p class="screen-subtitle">{{ userBirds().length }} bird{{ userBirds().length !== 1 ? 's' : '' }} collected</p>
      </header>

      <!-- Tab selector -->
      <div class="tab-row">
        <button class="tab-btn" [class.active]="activeTab() === 'album'" (click)="activeTab.set('album')">
          📚 Album
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'cena'" (click)="activeTab.set('cena')">
          🌳 Scene
        </button>
        <div class="tab-indicator" [class.right]="activeTab() === 'cena'"></div>
      </div>

      @if (activeTab() === 'album') {
        @if (userBirds().length === 0) {
          <div class="empty-state">
            <div class="empty-icon-wrapper">
              <span class="empty-emoji">🪺</span>
            </div>
            <h3 class="empty-title">Your aviary is empty</h3>
            <p class="empty-body">Hatch eggs in the incubator to bring birds here!</p>
          </div>
        } @else {
          <div class="filter-row">
            <button class="filter-btn" [class.active]="rarityFilter() === null" (click)="rarityFilter.set(null)">All</button>
            <button class="filter-btn" [class.active]="rarityFilter() === 'comum'" (click)="rarityFilter.set('comum')">Common</button>
            <button class="filter-btn" [class.active]="rarityFilter() === 'incomum'" (click)="rarityFilter.set('incomum')">Uncommon</button>
            <button class="filter-btn" [class.active]="rarityFilter() === 'raro'" (click)="rarityFilter.set('raro')">Rare</button>
            <button class="filter-btn" [class.active]="rarityFilter() === 'lendario'" (click)="rarityFilter.set('lendario')">Legendary</button>
          </div>

          <div class="birds-grid">
            @for (ub of filteredBirds(); track ub.id; let i = $index) {
              <div
                class="bird-card"
                [style.--rarity-color]="getBirdData(ub)?.rarity ? RARITY_CONFIG[getBirdData(ub)!.rarity].color : '#888'"
                [style.animation-delay]="i * 50 + 'ms'"
                (click)="selectedBird.set(ub)"
              >
                <div class="bird-stage-badge">{{ stageEmoji(ub.stage) }}</div>
                <div class="bird-avatar">
                  <img class="bird-sprite" [src]="getBirdSpriteUrl(ub)" [alt]="getBirdData(ub)?.name" (error)="onSpriteError($event)" />
                </div>
                <div class="bird-card-name">{{ getBirdData(ub)?.name ?? '???' }}</div>
                <div class="bird-card-rarity" [style.color]="RARITY_CONFIG[getBirdData(ub)?.rarity ?? 'comum'].color">
                  {{ RARITY_CONFIG[getBirdData(ub)?.rarity ?? 'comum'].label }}
                </div>
                <div class="bird-progress-bar">
                  <div class="bird-progress-fill" [style.width.%]="getStageProgress(ub)"></div>
                </div>
              </div>
            }
          </div>
        }
      }

      @if (activeTab() === 'cena') {
        <div class="scene-container">
          <div class="scene-sky">
            <div class="scene-sun">☀️</div>
            <div class="scene-clouds">
              <span class="cloud">☁️</span>
              <span class="cloud c2">☁️</span>
              <span class="cloud c3">☁️</span>
            </div>
          </div>
          <div class="scene-tree">
            <div class="scene-branches">
              @for (ub of scenebirds(); track ub.id; let i = $index) {
                <div class="branch-bird" [style.left.%]="branchPositions[i % branchPositions.length]" [style.top.%]="branchTops[i % branchTops.length]">
                  <span class="scene-bird-emoji" [title]="getBirdData(ub)?.name">
                    {{ getBirdEmoji(ub) }}
                  </span>
                </div>
              }
              @if (userBirds().length === 0) {
                <div class="scene-empty-hint">Hatch eggs to see birds here!</div>
              }
            </div>
            <div class="scene-trunk">🌳</div>
          </div>
          <div class="scene-ground">
            <div class="scene-grass">🌿🌿🌿🌿🌿🌿🌿🌿</div>
          </div>
        </div>
      }

      <!-- Bird detail modal -->
      @if (selectedBird()) {
        <div class="modal-overlay" (click)="selectedBird.set(null)">
          <div class="modal" (click)="$event.stopPropagation()">
            @if (getBirdData(selectedBird()!); as bird) {
              <div class="detail-avatar">
              <img class="detail-sprite" [src]="getBirdSpriteUrl(selectedBird()!)" [alt]="getBirdData(selectedBird()!)?.name" (error)="onSpriteError($event)" />
            </div>
              <div class="detail-stage-badge" [style.background]="RARITY_CONFIG[bird.rarity].gradient">
                {{ stageLabel(selectedBird()!.stage) }}
              </div>
              <h2 class="detail-name">{{ bird.name }}</h2>
              <p class="detail-species">{{ bird.species }}</p>
              <div class="detail-rarity" [style.color]="RARITY_CONFIG[bird.rarity].color">
                {{ RARITY_CONFIG[bird.rarity].label }}
              </div>
              <p class="detail-desc">{{ bird.description }}</p>
              <div class="detail-habitat">🌿 {{ bird.habitat }}</div>
              <div class="detail-sessions">
                {{ selectedBird()!.sessionsWithBird }} session{{ selectedBird()!.sessionsWithBird !== 1 ? 's' : '' }} together
              </div>
              <div class="detail-next-stage">
                @if (selectedBird()!.stage !== 'adulto') {
                  Next stage in {{ sessionsToNextStage(selectedBird()!) }} session{{ sessionsToNextStage(selectedBird()!) !== 1 ? 's' : '' }}
                } @else {
                  Fully grown! 🎉
                }
              </div>
            }
            <button class="btn-close" (click)="selectedBird.set(null)">Close</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .aviario-screen {
      padding: var(--space-lg) 20px;
      min-height: 100dvh;
      background: var(--bg);
      display: flex;
      flex-direction: column;
      gap: var(--space-lg);
      animation: fadeInUp 0.4s var(--ease-out) both;
    }
    .screen-header { text-align: center; }
    .screen-title { font-size: 28px; font-weight: 800; color: var(--text); margin: 0; letter-spacing: -0.5px; }
    .screen-subtitle { font-size: 14px; color: var(--text-muted); margin: var(--space-xs) 0 0; font-weight: 600; }

    /* Tabs */
    .tab-row {
      display: flex;
      gap: 0;
      background: var(--surface);
      border-radius: var(--radius-md);
      padding: 4px;
      position: relative;
      box-shadow: var(--shadow-sm);
    }
    .tab-btn {
      flex: 1; padding: 10px; border-radius: 10px; border: none;
      background: transparent; color: var(--text-muted);
      font-size: 14px; font-weight: 700; font-family: inherit;
      cursor: pointer; transition: color 0.3s var(--ease-out);
      z-index: 1;
    }
    .tab-btn.active { color: var(--primary); }
    .tab-indicator {
      position: absolute;
      left: 4px; top: 4px; bottom: 4px;
      width: calc(50% - 4px);
      background: var(--bg);
      border-radius: 10px;
      box-shadow: var(--shadow-sm);
      transition: transform 0.3s var(--ease-out);
    }
    .tab-indicator.right { transform: translateX(100%); }

    /* Empty state */
    .empty-state {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: var(--space-sm); padding: 40px 0;
    }
    .empty-icon-wrapper {
      width: 100px; height: 100px;
      display: flex; align-items: center; justify-content: center;
      background: var(--surface); border-radius: 50%;
      box-shadow: var(--shadow-md); margin-bottom: var(--space-sm);
    }
    .empty-emoji { font-size: 52px; }
    .empty-title { font-size: 20px; font-weight: 800; color: var(--text); margin: 0; }
    .empty-body { font-size: 14px; color: var(--text-muted); margin: 0; text-align: center; line-height: 1.5; }

    /* Filter */
    .filter-row { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; }
    .filter-btn {
      padding: 6px 14px; border-radius: var(--radius-full);
      border: 2px solid var(--border); background: var(--surface);
      font-size: 12px; font-weight: 700; font-family: inherit;
      cursor: pointer; white-space: nowrap;
      color: var(--text-muted); transition: all 0.2s var(--ease-out);
    }
    .filter-btn:active { transform: scale(0.95); }
    .filter-btn.active {
      border-color: var(--primary);
      color: var(--primary);
      background: var(--primary-light);
      box-shadow: 0 0 0 3px var(--primary-glow);
    }

    /* Birds grid */
    .birds-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .bird-card {
      background: var(--surface);
      border-radius: var(--radius-md);
      padding: 14px 8px 10px;
      text-align: center;
      position: relative;
      cursor: pointer;
      border-top: 3px solid var(--rarity-color);
      transition: all 0.2s var(--ease-out);
      box-shadow: var(--shadow-sm);
      animation: fadeInUp 0.4s var(--ease-out) both;
    }
    .bird-card:active { transform: scale(0.95); }
    .bird-stage-badge {
      position: absolute; top: 6px; right: 6px;
      font-size: 12px; background: var(--bg); border-radius: 50%;
      width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;
      box-shadow: var(--shadow-sm);
    }
    .bird-avatar { width: 52px; height: 52px; margin: 0 auto; display: flex; align-items: center; justify-content: center; }
    .bird-sprite { width: 100%; height: 100%; object-fit: contain; border-radius: 8px; }
    .bird-card-name {
      font-size: 11px; font-weight: 800; color: var(--text);
      margin-top: var(--space-xs);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .bird-card-rarity {
      font-size: 10px; font-weight: 700;
      text-transform: uppercase; margin-top: 2px;
      letter-spacing: 0.5px;
    }
    .bird-progress-bar {
      height: 4px; background: var(--border);
      border-radius: var(--radius-full);
      margin-top: var(--space-sm); overflow: hidden;
    }
    .bird-progress-fill {
      height: 100%;
      background: var(--gradient-primary);
      border-radius: var(--radius-full);
      transition: width 0.4s var(--ease-out);
    }

    /* Scene */
    .scene-container {
      border-radius: var(--radius-xl);
      overflow: hidden;
      background: linear-gradient(180deg, #87CEEB 0%, #B8E6F0 55%, #4CAF50 55%, #388E3C 100%);
      min-height: 380px;
      position: relative;
      box-shadow: var(--shadow-lg);
    }
    .scene-sky { position: relative; height: 60%; }
    .scene-sun {
      position: absolute; top: 16px; right: 24px;
      font-size: 44px;
      animation: spin 25s linear infinite;
      filter: drop-shadow(0 0 12px rgba(255, 200, 0, 0.5));
    }
    .scene-clouds { position: absolute; top: 30px; left: 0; right: 0; }
    .cloud { font-size: 36px; position: absolute; animation: drift 18s linear infinite; opacity: 0.7; }
    .cloud.c2 { top: 12px; left: 30%; animation-duration: 24s; animation-delay: -8s; font-size: 28px; }
    .cloud.c3 { top: 50px; left: 60%; animation-duration: 30s; animation-delay: -15s; font-size: 22px; opacity: 0.4; }
    @keyframes drift { from { left: -15%; } to { left: 115%; } }

    .scene-tree { position: absolute; bottom: 40%; left: 50%; transform: translateX(-50%); }
    .scene-trunk { font-size: 88px; display: block; text-align: center; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15)); }
    .scene-branches { position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); width: 220px; height: 160px; }
    .branch-bird { position: absolute; }
    .scene-bird-emoji {
      font-size: 28px; cursor: pointer; display: inline-block;
      animation: bob 3s ease-in-out infinite alternate;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
      transition: transform 0.2s var(--ease-spring);
    }
    @keyframes bob { from { transform: translateY(0); } to { transform: translateY(-10px); } }
    .scene-empty-hint {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      font-size: 13px; color: rgba(0,0,0,0.4); white-space: nowrap; text-align: center; font-weight: 600;
    }
    .scene-ground { position: absolute; bottom: 0; width: 100%; padding: 8px; }
    .scene-grass { font-size: 22px; text-align: center; }

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
      animation: scaleIn 0.3s var(--ease-spring) both;
    }
    .detail-avatar { width: 120px; height: 120px; margin: 0 auto; display: flex; align-items: center; justify-content: center; }
    .detail-sprite { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.15)); border-radius: 12px; }
    .detail-stage-badge {
      display: inline-block;
      padding: 4px 14px;
      border-radius: var(--radius-full);
      color: #fff;
      font-size: 12px;
      font-weight: 800;
      margin: var(--space-sm) 0;
      letter-spacing: 0.5px;
    }
    .detail-name { font-size: 24px; font-weight: 800; color: var(--text); margin: 0 0 var(--space-xs); letter-spacing: -0.5px; }
    .detail-species { font-size: 13px; color: var(--text-muted); font-style: italic; margin: 0 0 var(--space-sm); }
    .detail-rarity { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: var(--space-sm); }
    .detail-desc { font-size: 14px; color: var(--text-muted); line-height: 1.6; margin: 0 0 var(--space-sm); }
    .detail-habitat { font-size: 13px; color: var(--text-muted); margin-bottom: var(--space-xs); }
    .detail-sessions { font-size: 14px; font-weight: 700; color: var(--primary); margin-bottom: var(--space-xs); }
    .detail-next-stage { font-size: 12px; color: var(--text-muted); margin-bottom: var(--space-lg); font-weight: 600; }
    .btn-close {
      width: 100%; padding: 12px;
      border-radius: var(--radius-md);
      border: 2px solid var(--border);
      background: var(--bg);
      color: var(--text);
      font-size: 14px; font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s var(--ease-out);
    }
    .btn-close:active { transform: scale(0.97); }
  `],
})
export class AviarioComponent implements OnInit, OnDestroy {
  private db = inject(FirestoreService);
  private auth = inject(AuthService);

  readonly RARITY_CONFIG = RARITY_CONFIG;
  readonly activeTab = signal<AviarioTab>('album');
  readonly rarityFilter = signal<string | null>(null);
  readonly userBirds = signal<UserBird[]>([]);
  readonly selectedBird = signal<UserBird | null>(null);
  readonly branchPositions = [20, 45, 70, 30, 60, 15, 80];
  readonly branchTops = [10, 35, 60, 20, 50, 70, 40];

  private sub?: Subscription;

  ngOnInit(): void {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;
    this.sub = this.db.getUserBirds(uid).subscribe(birds => this.userBirds.set(birds));
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  filteredBirds(): UserBird[] {
    const f = this.rarityFilter();
    if (!f) return this.userBirds();
    return this.userBirds().filter(ub => this.getBirdData(ub)?.rarity === f);
  }

  scenebirds(): UserBird[] {
    return this.userBirds().slice(0, 7);
  }

  getBirdData(ub: UserBird): Bird | undefined {
    return BIRDS.find(b => b.id === ub.birdId);
  }

  getBirdSpriteUrl(ub: UserBird): string {
    const bird = this.getBirdData(ub);
    if (!bird) return '';
    return bird.stages[ub.stage];
  }

  onSpriteError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  getBirdEmoji(ub: UserBird): string {
    const bird = this.getBirdData(ub);
    if (!bird) return '🐦';
    const map: Record<string, string> = {
      'bem-te-vi': '🐦', 'pintassilgo': '🦜', 'beija-flor': '🌸',
      'uirapuru': '✨', 'sabia': '🎵', 'tucano': '🦜',
      'arara-azul': '💙', 'harpia': '🦅', 'periquito': '🟢',
      'papagaio': '🦜', 'cacatua': '🤍', 'ararinha-azul': '💎',
    };
    return map[bird.id] ?? '🐦';
  }

  stageEmoji(stage: BirdStage): string {
    return { filhote: '🥚', jovem: '🌱', adulto: '⭐' }[stage];
  }

  stageLabel(stage: BirdStage): string {
    return { filhote: 'Hatchling', jovem: 'Juvenile', adulto: 'Adult' }[stage];
  }

  getStageProgress(ub: UserBird): number {
    if (ub.stage === 'filhote') return Math.min(100, (ub.sessionsWithBird / 5) * 100);
    if (ub.stage === 'jovem') return Math.min(100, ((ub.sessionsWithBird - 5) / 10) * 100);
    return 100;
  }

  sessionsToNextStage(ub: UserBird): number {
    if (ub.stage === 'filhote') return Math.max(0, 5 - ub.sessionsWithBird);
    if (ub.stage === 'jovem') return Math.max(0, 15 - ub.sessionsWithBird);
    return 0;
  }
}
