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
        <h1 class="screen-title">Aviário</h1>
        <p class="screen-subtitle">{{ userBirds().length }} pássaro{{ userBirds().length !== 1 ? 's' : '' }} coletado{{ userBirds().length !== 1 ? 's' : '' }}</p>
      </header>

      <!-- Tab selector -->
      <div class="tab-row">
        <button class="tab-btn" [class.active]="activeTab() === 'album'" (click)="activeTab.set('album')">
          📚 Álbum
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'cena'" (click)="activeTab.set('cena')">
          🌳 Cena
        </button>
      </div>

      @if (activeTab() === 'album') {
        <!-- Album view -->
        @if (userBirds().length === 0) {
          <div class="empty-state">
            <p class="empty-emoji">🪺</p>
            <h3 class="empty-title">Seu aviário está vazio</h3>
            <p class="empty-body">Choque ovos na incubadora para trazer pássaros aqui!</p>
          </div>
        } @else {
          <!-- Rarity filter -->
          <div class="filter-row">
            <button class="filter-btn" [class.active]="rarityFilter() === null" (click)="rarityFilter.set(null)">Todos</button>
            <button class="filter-btn comum" [class.active]="rarityFilter() === 'comum'" (click)="rarityFilter.set('comum')">Comum</button>
            <button class="filter-btn incomum" [class.active]="rarityFilter() === 'incomum'" (click)="rarityFilter.set('incomum')">Incomum</button>
            <button class="filter-btn raro" [class.active]="rarityFilter() === 'raro'" (click)="rarityFilter.set('raro')">Raro</button>
            <button class="filter-btn lendario" [class.active]="rarityFilter() === 'lendario'" (click)="rarityFilter.set('lendario')">Lendário</button>
          </div>

          <div class="birds-grid">
            @for (ub of filteredBirds(); track ub.id) {
              <div
                class="bird-card"
                [style.--rarity-color]="getBirdData(ub)?.rarity ? RARITY_CONFIG[getBirdData(ub)!.rarity].color : '#888'"
                (click)="selectedBird.set(ub)"
              >
                <div class="bird-stage-badge">{{ stageEmoji(ub.stage) }}</div>
                <div class="bird-avatar">{{ getBirdEmoji(ub) }}</div>
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
        <!-- Scene view -->
        <div class="scene-container">
          <div class="scene-sky">
            <div class="scene-sun">☀️</div>
            <div class="scene-clouds">
              <span class="cloud">☁️</span>
              <span class="cloud c2">☁️</span>
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
                <div class="scene-empty-hint">Choque ovos para ver pássaros aqui!</div>
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
              <div class="detail-avatar">{{ getBirdEmoji(selectedBird()!) }}</div>
              <div class="detail-stage">{{ stageLabel(selectedBird()!.stage) }}</div>
              <h2 class="detail-name">{{ bird.name }}</h2>
              <p class="detail-species">{{ bird.species }}</p>
              <div class="detail-rarity" [style.background]="RARITY_CONFIG[bird.rarity].gradient">
                {{ RARITY_CONFIG[bird.rarity].label }}
              </div>
              <p class="detail-desc">{{ bird.description }}</p>
              <div class="detail-habitat">🌿 {{ bird.habitat }}</div>
              <div class="detail-sessions">
                {{ selectedBird()!.sessionsWithBird }} sessão(ões) juntos
              </div>
              <div class="detail-next-stage">
                @if (selectedBird()!.stage !== 'adulto') {
                  Próximo estágio em {{ sessionsToNextStage(selectedBird()!) }} sessões
                } @else {
                  Pássaro adulto! 🎉
                }
              </div>
            }
            <button class="btn-close" (click)="selectedBird.set(null)">Fechar</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .aviario-screen {
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

    .tab-row { display: flex; gap: 8px; background: var(--surface); border-radius: 12px; padding: 4px; }
    .tab-btn {
      flex: 1; padding: 10px; border-radius: 9px; border: none;
      background: transparent; color: var(--text-muted);
      font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .tab-btn.active { background: var(--bg); color: var(--primary); box-shadow: 0 1px 4px rgba(0,0,0,0.1); }

    .empty-state {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 8px; padding: 40px 0;
    }
    .empty-emoji { font-size: 64px; margin: 0; }
    .empty-title { font-size: 20px; font-weight: 700; color: var(--text); margin: 0; }
    .empty-body { font-size: 14px; color: var(--text-muted); margin: 0; text-align: center; }

    .filter-row { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; }
    .filter-btn {
      padding: 6px 12px; border-radius: 20px;
      border: 2px solid var(--border); background: var(--surface);
      font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap;
      color: var(--text-muted); transition: all 0.15s;
    }
    .filter-btn.active { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }

    .birds-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .bird-card {
      background: var(--surface);
      border-radius: 14px;
      padding: 12px 8px;
      text-align: center;
      position: relative;
      cursor: pointer;
      border-top: 3px solid var(--rarity-color);
      transition: transform 0.15s;
    }
    .bird-card:active { transform: scale(0.95); }
    .bird-stage-badge {
      position: absolute; top: 6px; right: 6px;
      font-size: 12px; background: var(--bg); border-radius: 50%;
      width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
    }
    .bird-avatar { font-size: 36px; line-height: 1.2; }
    .bird-card-name { font-size: 11px; font-weight: 700; color: var(--text); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bird-card-rarity { font-size: 10px; font-weight: 600; text-transform: uppercase; margin-top: 2px; }
    .bird-progress-bar { height: 3px; background: var(--border); border-radius: 2px; margin-top: 6px; overflow: hidden; }
    .bird-progress-fill { height: 100%; background: var(--primary); border-radius: 2px; transition: width 0.3s; }

    /* Scene */
    .scene-container { border-radius: 20px; overflow: hidden; background: linear-gradient(180deg, #87CEEB 0%, #E0F7FA 60%, #4CAF50 60%, #388E3C 100%); min-height: 360px; position: relative; }
    .scene-sky { position: relative; height: 60%; }
    .scene-sun { position: absolute; top: 16px; right: 24px; font-size: 40px; animation: spin-slow 20s linear infinite; }
    .scene-clouds { position: absolute; top: 30px; left: 0; right: 0; }
    .cloud { font-size: 32px; position: absolute; animation: drift 15s linear infinite; opacity: 0.8; }
    .cloud.c2 { top: 10px; left: 30%; animation-duration: 20s; animation-delay: -7s; font-size: 24px; }
    @keyframes drift { from { left: -10%; } to { left: 110%; } }
    @keyframes spin-slow { to { transform: rotate(360deg); } }

    .scene-tree { position: absolute; bottom: 40%; left: 50%; transform: translateX(-50%); }
    .scene-trunk { font-size: 80px; display: block; text-align: center; }
    .scene-branches { position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); width: 200px; height: 150px; }
    .branch-bird { position: absolute; }
    .scene-bird-emoji { font-size: 24px; cursor: pointer; display: inline-block; animation: bob 3s ease-in-out infinite alternate; }
    @keyframes bob { from { transform: translateY(0); } to { transform: translateY(-8px); } }
    .scene-empty-hint { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 12px; color: rgba(0,0,0,0.5); white-space: nowrap; text-align: center; }
    .scene-ground { position: absolute; bottom: 0; width: 100%; padding: 8px; }
    .scene-grass { font-size: 20px; text-align: center; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 24px; }
    .modal { background: var(--surface); border-radius: 24px; padding: 28px 24px; width: 100%; max-width: 320px; text-align: center; }
    .detail-avatar { font-size: 72px; }
    .detail-stage { font-size: 13px; color: var(--text-muted); margin: 4px 0; }
    .detail-name { font-size: 22px; font-weight: 800; color: var(--text); margin: 4px 0; }
    .detail-species { font-size: 13px; color: var(--text-muted); font-style: italic; margin: 0 0 8px; }
    .detail-rarity { display: inline-block; padding: 4px 12px; border-radius: 20px; color: #fff; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; }
    .detail-desc { font-size: 14px; color: var(--text-muted); line-height: 1.5; margin: 0 0 8px; }
    .detail-habitat { font-size: 13px; color: var(--text-muted); margin-bottom: 4px; }
    .detail-sessions { font-size: 13px; font-weight: 600; color: var(--primary); margin-bottom: 4px; }
    .detail-next-stage { font-size: 12px; color: var(--text-muted); margin-bottom: 20px; }
    .btn-close { width: 100%; padding: 12px; border-radius: 12px; border: 2px solid var(--border); background: var(--bg); color: var(--text); font-size: 14px; font-weight: 600; cursor: pointer; }
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
    return { filhote: 'Filhote', jovem: 'Jovem', adulto: 'Adulto' }[stage];
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
