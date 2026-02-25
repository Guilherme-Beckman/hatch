import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { FirestoreService } from '../../core/services/firestore.service';
import { AuthService } from '../../core/services/auth.service';
import { UserBird, BIRDS, RARITY_CONFIG, Bird, BirdStage, Rarity } from '../../core/models/bird.model';
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
          Album
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'cena'" (click)="activeTab.set('cena')">
          Scene
        </button>
        <div class="tab-indicator" [class.right]="activeTab() === 'cena'"></div>
      </div>

      <!-- ═══════════════════════ ALBUM TAB ═══════════════════════ -->
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
          <!-- Collection progress -->
          <div class="collection-header">
            <div class="collection-bar">
              <div class="collection-fill" [style.width.%]="(uniqueBirdCount() / totalBirdSpecies) * 100"></div>
            </div>
            <div class="collection-info">
              <span class="collection-text">{{ uniqueBirdCount() }}/{{ totalBirdSpecies }} species discovered</span>
              <div class="rarity-dots">
                @for (r of rarityBreakdown(); track r.rarity) {
                  <span class="rarity-dot" [style.background]="RARITY_CONFIG[r.rarity].color" [title]="RARITY_CONFIG[r.rarity].label + ': ' + r.count">
                    {{ r.count }}
                  </span>
                }
              </div>
            </div>
          </div>

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
                [class.legendary]="getBirdData(ub)?.rarity === 'lendario'"
                [class.rare]="getBirdData(ub)?.rarity === 'raro'"
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
                <!-- Stage evolution dots -->
                <div class="stage-dots">
                  <span class="stage-dot filled"></span>
                  <span class="stage-dot" [class.filled]="ub.stage === 'jovem' || ub.stage === 'adulto'"></span>
                  <span class="stage-dot" [class.filled]="ub.stage === 'adulto'"></span>
                </div>
                <div class="bird-progress-bar">
                  <div class="bird-progress-fill" [style.width.%]="getStageProgress(ub)"></div>
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- ═══════════════════════ SCENE TAB ═══════════════════════ -->
      @if (activeTab() === 'cena') {
        <div class="scene-container" [class.scene-empty]="userBirds().length === 0">
          <!-- Sky -->
          <div class="scene-sky">
            <!-- Sun -->
            <div class="sun">
              <div class="sun-ray r1"></div>
              <div class="sun-ray r2"></div>
              <div class="sun-ray r3"></div>
              <div class="sun-ray r4"></div>
            </div>

            <!-- CSS Clouds -->
            <div class="cloud cloud-1"></div>
            <div class="cloud cloud-2"></div>
            <div class="cloud cloud-3"></div>

            <!-- Flying birds -->
            @if (flyingBirds().length > 0) {
              <div class="flying-bird fly-1">
                <img [src]="getBirdSpriteUrl(flyingBirds()[0])" [alt]="getBirdData(flyingBirds()[0])?.name" class="flying-sprite" (error)="onSpriteError($event)" />
              </div>
            }
            @if (flyingBirds().length > 1) {
              <div class="flying-bird fly-2">
                <img [src]="getBirdSpriteUrl(flyingBirds()[1])" [alt]="getBirdData(flyingBirds()[1])?.name" class="flying-sprite" (error)="onSpriteError($event)" />
              </div>
            }

            <!-- Floating particles -->
            <div class="particle p1"></div>
            <div class="particle p2"></div>
            <div class="particle p3"></div>
            <div class="particle p4"></div>
            <div class="particle p5"></div>
          </div>

          <!-- Mountains -->
          <div class="mountains">
            <div class="mountain m1"></div>
            <div class="mountain m2"></div>
            <div class="mountain m3"></div>
          </div>

          <!-- Tree area -->
          <div class="tree-area">
            <div class="tree-canopy">
              <div class="canopy-layer c1"></div>
              <div class="canopy-layer c2"></div>
              <div class="canopy-layer c3"></div>
            </div>
            <div class="tree-trunk"></div>

            <!-- Birds perching on branches -->
            <div class="perch-zone">
              @for (ub of sceneBirds(); track ub.id; let i = $index) {
                <div
                  class="perched-bird"
                  [style.left.%]="branchPositions[i % branchPositions.length]"
                  [style.top.%]="branchTops[i % branchTops.length]"
                  [style.animation-delay]="(i * 0.4) + 's'"
                  [title]="getBirdData(ub)?.name ?? 'Bird'"
                >
                  <img [src]="getBirdSpriteUrl(ub)" [alt]="getBirdData(ub)?.name" class="perch-sprite" (error)="onSpriteError($event)" />
                  <span class="perch-name">{{ getBirdData(ub)?.name }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Ground -->
          <div class="ground">
            <div class="grass-layer g1"></div>
            <div class="grass-layer g2"></div>
            <div class="flower f1"></div>
            <div class="flower f2"></div>
            <div class="flower f3"></div>
            <div class="flower f4"></div>
            <div class="flower f5"></div>
            <div class="flower f6"></div>
            <div class="flower f7"></div>
          </div>

          <!-- Empty state overlay -->
          @if (userBirds().length === 0) {
            <div class="scene-overlay">
              <span class="scene-overlay-text">Complete sessions to see birds here!</span>
            </div>
          }
        </div>
      }

      <!-- ═══════════════════════ BIRD DETAIL MODAL ═══════════════════════ -->
      @if (selectedBird()) {
        <div class="modal-overlay" (click)="selectedBird.set(null)">
          <div class="modal" (click)="$event.stopPropagation()">
            @if (getBirdData(selectedBird()!); as bird) {
              <!-- Rarity gradient header -->
              <div class="modal-header" [style.background]="RARITY_CONFIG[bird.rarity].gradient">
                <!-- Floating celebration particles -->
                <div class="modal-particle mp1"></div>
                <div class="modal-particle mp2"></div>
                <div class="modal-particle mp3"></div>
                <div class="modal-particle mp4"></div>
                <div class="modal-particle mp5"></div>
                <div class="modal-particle mp6"></div>

                <div class="detail-avatar">
                  <img class="detail-sprite" [src]="getBirdSpriteUrl(selectedBird()!)" [alt]="bird.name" (error)="onSpriteError($event)" />
                </div>
              </div>

              <!-- Stage evolution timeline -->
              <div class="stage-timeline">
                <div class="timeline-step" [class.active]="true" [class.current]="selectedBird()!.stage === 'filhote'">
                  <span class="timeline-dot"></span>
                  <span class="timeline-label">Hatchling</span>
                </div>
                <div class="timeline-line" [class.filled]="selectedBird()!.stage === 'jovem' || selectedBird()!.stage === 'adulto'"></div>
                <div class="timeline-step" [class.active]="selectedBird()!.stage === 'jovem' || selectedBird()!.stage === 'adulto'" [class.current]="selectedBird()!.stage === 'jovem'">
                  <span class="timeline-dot"></span>
                  <span class="timeline-label">Juvenile</span>
                </div>
                <div class="timeline-line" [class.filled]="selectedBird()!.stage === 'adulto'"></div>
                <div class="timeline-step" [class.active]="selectedBird()!.stage === 'adulto'" [class.current]="selectedBird()!.stage === 'adulto'">
                  <span class="timeline-dot"></span>
                  <span class="timeline-label">Adult</span>
                </div>
              </div>

              <h2 class="detail-name">{{ bird.name }}</h2>
              <p class="detail-species">{{ bird.species }}</p>
              <div class="detail-rarity" [style.color]="RARITY_CONFIG[bird.rarity].color">
                {{ RARITY_CONFIG[bird.rarity].label }}
              </div>
              <p class="detail-desc">{{ bird.description }}</p>
              <div class="detail-habitat">{{ bird.habitat }}</div>
              <div class="detail-sessions">
                @if (selectedBird()!.stage === 'adulto') {
                  🏆
                }
                {{ selectedBird()!.sessionsWithBird }} session{{ selectedBird()!.sessionsWithBird !== 1 ? 's' : '' }} together
              </div>
              <div class="detail-next-stage">
                @if (selectedBird()!.stage !== 'adulto') {
                  Next stage in {{ sessionsToNextStage(selectedBird()!) }} session{{ sessionsToNextStage(selectedBird()!) !== 1 ? 's' : '' }}
                } @else {
                  Fully grown!
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
    /* ═══════════════════════ LAYOUT ═══════════════════════ */
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

    /* ═══════════════════════ TABS ═══════════════════════ */
    .tab-row {
      display: flex; gap: 0;
      background: var(--surface); border-radius: var(--radius-md);
      padding: 4px; position: relative; box-shadow: var(--shadow-sm);
    }
    .tab-btn {
      flex: 1; padding: 10px; border-radius: 10px; border: none;
      background: transparent; color: var(--text-muted);
      font-size: 14px; font-weight: 700; font-family: inherit;
      cursor: pointer; transition: color 0.3s var(--ease-out); z-index: 1;
    }
    .tab-btn.active { color: var(--primary); }
    .tab-indicator {
      position: absolute; left: 4px; top: 4px; bottom: 4px;
      width: calc(50% - 4px); background: var(--bg);
      border-radius: 10px; box-shadow: var(--shadow-sm);
      transition: transform 0.3s var(--ease-out);
    }
    .tab-indicator.right { transform: translateX(100%); }

    /* ═══════════════════════ EMPTY STATE ═══════════════════════ */
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

    /* ═══════════════════════ COLLECTION PROGRESS ═══════════════════════ */
    .collection-header {
      background: var(--surface);
      border-radius: var(--radius-md);
      padding: 14px 16px;
      box-shadow: var(--shadow-sm);
    }
    .collection-bar {
      height: 8px;
      background: var(--border);
      border-radius: var(--radius-full);
      overflow: hidden;
      position: relative;
    }
    .collection-fill {
      height: 100%;
      background: var(--gradient-primary);
      border-radius: var(--radius-full);
      transition: width 0.6s var(--ease-out);
      position: relative;
    }
    .collection-fill::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
      background-size: 200% 100%;
      animation: shimmer 2s ease-in-out infinite;
    }
    .collection-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
    }
    .collection-text {
      font-size: 13px; font-weight: 700; color: var(--text);
    }
    .rarity-dots {
      display: flex; gap: 6px;
    }
    .rarity-dot {
      width: 22px; height: 22px;
      border-radius: 50%;
      font-size: 10px; font-weight: 800;
      color: white;
      display: flex; align-items: center; justify-content: center;
      box-shadow: var(--shadow-sm);
    }

    /* ═══════════════════════ FILTER ═══════════════════════ */
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
      border-color: var(--primary); color: var(--primary);
      background: var(--primary-light);
      box-shadow: 0 0 0 3px var(--primary-glow);
    }

    /* ═══════════════════════ BIRD CARDS ═══════════════════════ */
    .birds-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .bird-card {
      background: var(--surface);
      border-radius: var(--radius-md);
      padding: 14px 8px 10px;
      text-align: center;
      position: relative; overflow: hidden;
      cursor: pointer;
      border-top: 3px solid var(--rarity-color);
      transition: all 0.2s var(--ease-out);
      box-shadow: var(--shadow-sm);
      animation: fadeInUp 0.4s var(--ease-out) both;
    }
    .bird-card:active { transform: scale(0.95); }
    .bird-card:hover {
      box-shadow: 0 0 0 2px var(--rarity-color), var(--shadow-md);
    }

    /* Legendary shimmer effect */
    .bird-card.legendary::after {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(
        105deg,
        transparent 35%,
        rgba(255, 215, 0, 0.12) 42%,
        rgba(255, 215, 0, 0.25) 50%,
        rgba(255, 215, 0, 0.12) 58%,
        transparent 65%
      );
      background-size: 250% 100%;
      animation: shimmer 3s ease-in-out infinite;
      border-radius: inherit;
      pointer-events: none;
    }

    /* Rare glow pulse */
    .bird-card.rare {
      animation: fadeInUp 0.4s var(--ease-out) both, rareGlow 3s ease-in-out infinite;
    }
    @keyframes rareGlow {
      0%, 100% { box-shadow: var(--shadow-sm), 0 0 0 0 rgba(155, 89, 182, 0); }
      50% { box-shadow: var(--shadow-sm), 0 0 12px 2px rgba(155, 89, 182, 0.25); }
    }

    .bird-stage-badge {
      position: absolute; top: 6px; right: 6px;
      font-size: 12px; background: var(--bg); border-radius: 50%;
      width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;
      box-shadow: var(--shadow-sm);
    }
    .bird-avatar {
      width: 64px; height: 64px;
      margin: 0 auto;
      display: flex; align-items: center; justify-content: center;
    }
    .bird-sprite { width: 100%; height: 100%; object-fit: contain; border-radius: 8px; }
    .bird-card-name {
      font-size: 11px; font-weight: 800; color: var(--text);
      margin-top: var(--space-xs);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .bird-card-rarity {
      font-size: 10px; font-weight: 700;
      text-transform: uppercase; margin-top: 2px; letter-spacing: 0.5px;
    }

    /* Stage evolution dots */
    .stage-dots {
      display: flex; gap: 4px; justify-content: center;
      margin-top: 6px;
    }
    .stage-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--border);
      transition: all 0.3s var(--ease-out);
    }
    .stage-dot.filled {
      background: var(--rarity-color, var(--primary));
    }

    .bird-progress-bar {
      height: 3px; background: var(--border);
      border-radius: var(--radius-full);
      margin-top: 6px; overflow: hidden;
    }
    .bird-progress-fill {
      height: 100%;
      background: var(--gradient-primary);
      border-radius: var(--radius-full);
      transition: width 0.4s var(--ease-out);
    }

    /* ═══════════════════════ SCENE TAB ═══════════════════════ */
    .scene-container {
      border-radius: var(--radius-xl);
      overflow: hidden;
      min-height: 420px;
      position: relative;
      box-shadow: var(--shadow-lg);
      background: #87CEEB;
    }
    .scene-container.scene-empty {
      filter: saturate(0.3) brightness(0.8);
    }

    /* Sky */
    .scene-sky {
      position: absolute; top: 0; left: 0; right: 0;
      height: 55%;
      background: linear-gradient(180deg, #4A90D9 0%, #87CEEB 40%, #B8E6F0 100%);
      overflow: hidden;
    }

    /* ── CSS Sun ── */
    .sun {
      position: absolute; top: 20px; right: 28px;
      width: 56px; height: 56px;
      background: radial-gradient(circle, #FFE44D 20%, #FFD700 50%, #FFA500 80%, transparent 100%);
      border-radius: 50%;
      box-shadow:
        0 0 30px rgba(255, 215, 0, 0.6),
        0 0 60px rgba(255, 165, 0, 0.3),
        0 0 100px rgba(255, 215, 0, 0.15);
      animation: sunPulse 4s ease-in-out infinite;
      z-index: 2;
    }
    @keyframes sunPulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 30px rgba(255,215,0,0.6), 0 0 60px rgba(255,165,0,0.3); }
      50% { transform: scale(1.08); box-shadow: 0 0 40px rgba(255,215,0,0.7), 0 0 80px rgba(255,165,0,0.4), 0 0 120px rgba(255,215,0,0.2); }
    }
    .sun-ray {
      position: absolute;
      top: 50%; left: 50%;
      width: 80px; height: 2px;
      background: linear-gradient(90deg, rgba(255,215,0,0.5) 0%, transparent 100%);
      transform-origin: 0 50%;
      animation: rayPulse 4s ease-in-out infinite;
    }
    .sun-ray.r1 { transform: rotate(0deg); }
    .sun-ray.r2 { transform: rotate(90deg); }
    .sun-ray.r3 { transform: rotate(45deg); }
    .sun-ray.r4 { transform: rotate(135deg); }
    @keyframes rayPulse {
      0%, 100% { opacity: 0.5; width: 80px; }
      50% { opacity: 0.8; width: 100px; }
    }

    /* ── CSS Clouds ── */
    .cloud {
      position: absolute;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 50px;
      z-index: 3;
    }
    .cloud::before, .cloud::after {
      content: '';
      position: absolute;
      background: inherit;
      border-radius: 50%;
    }

    .cloud-1 {
      width: 90px; height: 30px;
      top: 30px; left: -100px;
      animation: cloudDrift 22s linear infinite;
    }
    .cloud-1::before {
      width: 40px; height: 40px;
      top: -20px; left: 15px;
    }
    .cloud-1::after {
      width: 50px; height: 50px;
      top: -28px; left: 35px;
    }

    .cloud-2 {
      width: 70px; height: 24px;
      top: 60px; left: -80px;
      opacity: 0.7;
      animation: cloudDrift 28s linear infinite;
      animation-delay: -10s;
    }
    .cloud-2::before {
      width: 35px; height: 35px;
      top: -18px; left: 10px;
    }
    .cloud-2::after {
      width: 40px; height: 40px;
      top: -22px; left: 28px;
    }

    .cloud-3 {
      width: 60px; height: 20px;
      top: 95px; left: -70px;
      opacity: 0.5;
      animation: cloudDrift 34s linear infinite;
      animation-delay: -18s;
    }
    .cloud-3::before {
      width: 28px; height: 28px;
      top: -14px; left: 8px;
    }
    .cloud-3::after {
      width: 32px; height: 32px;
      top: -17px; left: 22px;
    }

    @keyframes cloudDrift {
      from { transform: translateX(0); }
      to { transform: translateX(calc(100vw + 200px)); }
    }

    /* ── Floating particles ── */
    .particle {
      position: absolute;
      border-radius: 50%;
      z-index: 4;
      opacity: 0;
      animation: floatParticle 10s ease-in-out infinite;
    }
    .p1 { width: 4px; height: 4px; background: rgba(255,255,255,0.6); left: 15%; bottom: 30%; animation-delay: 0s; }
    .p2 { width: 3px; height: 3px; background: rgba(255,235,150,0.7); left: 35%; bottom: 25%; animation-delay: -2s; }
    .p3 { width: 5px; height: 5px; background: rgba(255,255,255,0.5); left: 55%; bottom: 35%; animation-delay: -4s; }
    .p4 { width: 3px; height: 3px; background: rgba(255,235,150,0.6); left: 75%; bottom: 28%; animation-delay: -6s; }
    .p5 { width: 4px; height: 4px; background: rgba(255,255,255,0.4); left: 85%; bottom: 40%; animation-delay: -8s; }
    @keyframes floatParticle {
      0% { transform: translateY(0); opacity: 0; }
      15% { opacity: 0.8; }
      50% { opacity: 0.6; }
      85% { opacity: 0.8; }
      100% { transform: translateY(-120px); opacity: 0; }
    }

    /* ── Flying birds ── */
    .flying-bird {
      position: absolute;
      z-index: 5;
    }
    .flying-sprite {
      width: 36px; height: 36px;
      object-fit: contain;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.2));
      border-radius: 6px;
    }
    .fly-1 {
      top: 25%;
      animation: flyAcross1 12s ease-in-out infinite;
    }
    .fly-2 {
      top: 12%;
      animation: flyAcross2 16s ease-in-out infinite;
      animation-delay: -6s;
    }
    @keyframes flyAcross1 {
      0%   { transform: translate(-60px, 0) rotate(-5deg) scaleX(-1); opacity: 0; }
      5%   { opacity: 1; }
      25%  { transform: translate(25vw, -15px) rotate(3deg) scaleX(-1); }
      50%  { transform: translate(50vw, 5px) rotate(-3deg) scaleX(-1); }
      75%  { transform: translate(75vw, -10px) rotate(2deg) scaleX(-1); }
      95%  { opacity: 1; }
      100% { transform: translate(100vw, 0) rotate(-5deg) scaleX(-1); opacity: 0; }
    }
    @keyframes flyAcross2 {
      0%   { transform: translate(calc(100vw + 60px), 0) rotate(5deg); opacity: 0; }
      5%   { opacity: 1; }
      25%  { transform: translate(75vw, -10px) rotate(-3deg); }
      50%  { transform: translate(50vw, 8px) rotate(3deg); }
      75%  { transform: translate(25vw, -12px) rotate(-2deg); }
      95%  { opacity: 1; }
      100% { transform: translate(-60px, 0) rotate(5deg); opacity: 0; }
    }

    /* ── Mountains ── */
    .mountains {
      position: absolute;
      bottom: 42%; left: 0; right: 0;
      height: 80px;
      z-index: 1;
    }
    .mountain {
      position: absolute; bottom: 0;
      width: 0; height: 0;
    }
    .m1 {
      left: 5%;
      border-left: 80px solid transparent;
      border-right: 80px solid transparent;
      border-bottom: 70px solid #5B8C5A;
      opacity: 0.6;
    }
    .m2 {
      left: 25%;
      border-left: 110px solid transparent;
      border-right: 110px solid transparent;
      border-bottom: 85px solid #4A7C59;
      opacity: 0.5;
    }
    .m3 {
      right: 5%;
      border-left: 90px solid transparent;
      border-right: 90px solid transparent;
      border-bottom: 65px solid #6B9C6A;
      opacity: 0.55;
    }

    /* ── Tree ── */
    .tree-area {
      position: absolute;
      bottom: 12%;
      left: 50%;
      transform: translateX(-50%);
      z-index: 6;
    }
    .tree-canopy {
      position: relative;
      width: 200px;
      height: 140px;
    }
    .canopy-layer {
      position: absolute;
      border-radius: 50%;
      background: #2D8B46;
    }
    .canopy-layer.c1 {
      width: 130px; height: 100px;
      bottom: 10px; left: 50%;
      transform: translateX(-50%);
      background: radial-gradient(ellipse, #3DA854 30%, #2D8B46 100%);
    }
    .canopy-layer.c2 {
      width: 100px; height: 80px;
      bottom: 50px; left: 20%;
      background: radial-gradient(ellipse, #45B85C 30%, #35A04D 100%);
    }
    .canopy-layer.c3 {
      width: 90px; height: 70px;
      bottom: 55px; right: 15%;
      background: radial-gradient(ellipse, #4DC868 30%, #3DA854 100%);
    }
    .tree-trunk {
      width: 28px; height: 70px;
      background: linear-gradient(180deg, #6B4423 0%, #8B6914 50%, #5A3A1A 100%);
      border-radius: 6px 6px 10px 10px;
      margin: -10px auto 0;
    }

    /* ── Perched birds ── */
    .perch-zone {
      position: absolute;
      top: 0; left: 0;
      width: 200px; height: 140px;
    }
    .perched-bird {
      position: absolute;
      transform: translate(-50%, -50%);
      animation: birdBob 3s ease-in-out infinite alternate;
      cursor: pointer;
      z-index: 7;
    }
    .perch-sprite {
      width: 38px; height: 38px;
      object-fit: contain;
      filter: drop-shadow(0 3px 6px rgba(0,0,0,0.25));
      border-radius: 6px;
      transition: transform 0.2s var(--ease-spring);
    }
    .perched-bird:hover .perch-sprite,
    .perched-bird:active .perch-sprite {
      transform: scale(1.2);
    }
    .perch-name {
      display: none;
      position: absolute;
      bottom: 100%;
      left: 50%; transform: translateX(-50%);
      background: rgba(0,0,0,0.75);
      color: white;
      font-size: 10px; font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      white-space: nowrap;
      pointer-events: none;
    }
    .perched-bird:hover .perch-name {
      display: block;
    }
    @keyframes birdBob {
      from { transform: translate(-50%, -50%) translateY(0); }
      to { transform: translate(-50%, -50%) translateY(-6px); }
    }

    /* ── Ground ── */
    .ground {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 14%;
      z-index: 5;
      overflow: hidden;
    }
    .grass-layer {
      position: absolute;
      left: 0; right: 0;
      border-radius: 50% 50% 0 0;
    }
    .grass-layer.g1 {
      bottom: 0;
      height: 100%;
      background: linear-gradient(180deg, #4CAF50 0%, #388E3C 60%, #2E7D32 100%);
    }
    .grass-layer.g2 {
      bottom: 0;
      height: 60%;
      background: linear-gradient(180deg, transparent 0%, rgba(46, 125, 50, 0.5) 100%);
    }

    /* Flowers */
    .flower {
      position: absolute; bottom: 0;
      width: 8px; height: 8px;
      border-radius: 50%;
      z-index: 6;
    }
    .f1 { left: 8%; bottom: 15%; background: #FF6B6B; width: 6px; height: 6px; }
    .f2 { left: 20%; bottom: 8%; background: #FFD93D; }
    .f3 { left: 38%; bottom: 20%; background: #FF8CC8; width: 7px; height: 7px; }
    .f4 { left: 52%; bottom: 10%; background: #FFD93D; width: 5px; height: 5px; }
    .f5 { right: 30%; bottom: 16%; background: #FF6B6B; }
    .f6 { right: 15%; bottom: 6%; background: #C8A8FF; width: 6px; height: 6px; }
    .f7 { right: 5%; bottom: 18%; background: #FF8CC8; width: 5px; height: 5px; }

    /* ── Scene empty overlay ── */
    .scene-overlay {
      position: absolute; inset: 0;
      background: rgba(0,0,0,0.35);
      display: flex; align-items: center; justify-content: center;
      z-index: 20;
      backdrop-filter: blur(2px);
    }
    .scene-overlay-text {
      color: white;
      font-size: 16px; font-weight: 700;
      text-align: center;
      padding: 16px 24px;
      background: rgba(0,0,0,0.4);
      border-radius: var(--radius-md);
    }

    /* ═══════════════════════ MODAL ═══════════════════════ */
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
      width: 100%; max-width: 340px;
      text-align: center;
      box-shadow: var(--shadow-lg);
      animation: scaleIn 0.3s var(--ease-spring) both;
      overflow: hidden;
    }

    /* Modal rarity header */
    .modal-header {
      position: relative;
      padding: var(--space-xl) var(--space-lg) var(--space-md);
      overflow: hidden;
    }
    .detail-avatar {
      width: 120px; height: 120px;
      margin: 0 auto;
      display: flex; align-items: center; justify-content: center;
      position: relative;
      z-index: 2;
    }
    .detail-sprite {
      width: 100%; height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 4px 16px rgba(0,0,0,0.25));
      border-radius: 12px;
    }

    /* Modal celebration particles */
    .modal-particle {
      position: absolute;
      border-radius: 50%;
      z-index: 1;
      animation: modalFloat 5s ease-in-out infinite;
    }
    .mp1 { width: 6px; height: 6px; background: rgba(255,255,255,0.5); left: 15%; bottom: 20%; animation-delay: 0s; }
    .mp2 { width: 4px; height: 4px; background: rgba(255,255,255,0.6); left: 30%; bottom: 10%; animation-delay: -1s; }
    .mp3 { width: 5px; height: 5px; background: rgba(255,255,255,0.4); right: 25%; bottom: 15%; animation-delay: -2s; }
    .mp4 { width: 3px; height: 3px; background: rgba(255,255,255,0.7); right: 10%; bottom: 25%; animation-delay: -3s; }
    .mp5 { width: 7px; height: 7px; background: rgba(255,255,255,0.3); left: 50%; bottom: 5%; animation-delay: -1.5s; }
    .mp6 { width: 4px; height: 4px; background: rgba(255,255,255,0.5); right: 40%; bottom: 30%; animation-delay: -4s; }
    @keyframes modalFloat {
      0% { transform: translateY(0); opacity: 0; }
      20% { opacity: 1; }
      80% { opacity: 0.6; }
      100% { transform: translateY(-80px); opacity: 0; }
    }

    /* Stage evolution timeline */
    .stage-timeline {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      padding: var(--space-md) var(--space-lg) var(--space-sm);
    }
    .timeline-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .timeline-dot {
      width: 14px; height: 14px;
      border-radius: 50%;
      background: var(--border);
      border: 2px solid var(--border);
      transition: all 0.3s var(--ease-out);
    }
    .timeline-step.active .timeline-dot {
      background: var(--primary);
      border-color: var(--primary);
    }
    .timeline-step.current .timeline-dot {
      background: var(--primary);
      border-color: var(--primary);
      box-shadow: 0 0 0 4px var(--primary-glow);
      animation: pulse 2s ease-in-out infinite;
    }
    .timeline-label {
      font-size: 10px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .timeline-step.active .timeline-label {
      color: var(--primary);
    }
    .timeline-step.current .timeline-label {
      color: var(--primary);
      font-weight: 800;
    }
    .timeline-line {
      width: 40px; height: 3px;
      background: var(--border);
      border-radius: 2px;
      margin: 0 4px;
      margin-bottom: 18px;
      transition: background 0.3s var(--ease-out);
    }
    .timeline-line.filled {
      background: var(--primary);
    }

    .detail-name {
      font-size: 24px; font-weight: 800;
      color: var(--text); margin: 0 0 var(--space-xs);
      letter-spacing: -0.5px;
      padding: 0 var(--space-lg);
    }
    .detail-species {
      font-size: 13px; color: var(--text-muted);
      font-style: italic; margin: 0 0 var(--space-sm);
      padding: 0 var(--space-lg);
    }
    .detail-rarity {
      font-size: 12px; font-weight: 800;
      text-transform: uppercase; letter-spacing: 1px;
      margin-bottom: var(--space-sm);
    }
    .detail-desc {
      font-size: 14px; color: var(--text-muted);
      line-height: 1.6; margin: 0 0 var(--space-sm);
      padding: 0 var(--space-lg);
    }
    .detail-habitat {
      font-size: 13px; color: var(--text-muted);
      margin-bottom: var(--space-xs);
      padding: 0 var(--space-lg);
    }
    .detail-sessions {
      font-size: 14px; font-weight: 700;
      color: var(--primary);
      margin-bottom: var(--space-xs);
    }
    .detail-next-stage {
      font-size: 12px; color: var(--text-muted);
      margin-bottom: var(--space-lg);
      font-weight: 600;
    }
    .btn-close {
      width: calc(100% - 2 * var(--space-lg)); margin: 0 var(--space-lg) var(--space-lg);
      padding: 12px;
      border-radius: var(--radius-md);
      border: 2px solid var(--border);
      background: var(--bg); color: var(--text);
      font-size: 14px; font-weight: 700; font-family: inherit;
      cursor: pointer; transition: all 0.2s var(--ease-out);
    }
    .btn-close:active { transform: scale(0.97); }
  `],
})
export class AviarioComponent implements OnInit, OnDestroy {
  private db = inject(FirestoreService);
  private auth = inject(AuthService);

  readonly RARITY_CONFIG = RARITY_CONFIG;
  readonly totalBirdSpecies = BIRDS.length;
  readonly activeTab = signal<AviarioTab>('album');
  readonly rarityFilter = signal<string | null>(null);
  readonly userBirds = signal<UserBird[]>([]);
  readonly selectedBird = signal<UserBird | null>(null);
  readonly branchPositions = [18, 42, 68, 28, 58, 82, 50];
  readonly branchTops = [15, 40, 65, 30, 55, 75, 48];

  private sub?: Subscription;

  readonly uniqueBirdCount = computed(() => {
    const ids = new Set(this.userBirds().map(ub => ub.birdId));
    return ids.size;
  });

  readonly rarityBreakdown = computed(() => {
    const counts = new Map<Rarity, number>();
    const seen = new Set<string>();
    for (const ub of this.userBirds()) {
      if (seen.has(ub.birdId)) continue;
      seen.add(ub.birdId);
      const bird = BIRDS.find(b => b.id === ub.birdId);
      if (!bird) continue;
      counts.set(bird.rarity, (counts.get(bird.rarity) ?? 0) + 1);
    }
    const order: Rarity[] = ['comum', 'incomum', 'raro', 'lendario'];
    return order
      .filter(r => counts.has(r))
      .map(r => ({ rarity: r, count: counts.get(r)! }));
  });

  readonly flyingBirds = computed(() => {
    const birds = this.userBirds();
    if (birds.length < 3) return [];
    if (birds.length < 5) return [birds[birds.length - 1]];
    return [birds[birds.length - 1], birds[birds.length - 2]];
  });

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

  sceneBirds(): UserBird[] {
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
