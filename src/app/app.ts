import { Component, inject, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { trigger, transition, style, animate, query } from '@angular/animations';
import { AuthService } from './core/services/auth.service';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';

const routeAnimation = trigger('routeAnim', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(8px)' }),
      animate('280ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
    ], { optional: true }),
  ]),
]);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent],
  template: `
    <div class="app-shell">
      <main class="app-content" [@routeAnim]="getRouteUrl(outlet)">
        <router-outlet #outlet="outlet" />
      </main>
      @if (showNav()) {
        <app-bottom-nav />
      }
    </div>
  `,
  animations: [routeAnimation],
  styles: [`
    .app-shell {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      background: var(--bg);
    }
    .app-content {
      flex: 1;
      padding-bottom: 72px;
    }
  `],
})
export class App {
  private auth = inject(AuthService);

  showNav = computed(() => this.auth.currentUser() !== null);

  getRouteUrl(outlet: RouterOutlet): string {
    return outlet?.activatedRouteData?.['animation'] ?? outlet?.activatedRoute?.routeConfig?.path ?? '';
  }
}
