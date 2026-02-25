import { Component, inject, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent],
  template: `
    <div class="app-shell">
      <main class="app-content">
        <router-outlet />
      </main>
      @if (showNav()) {
        <app-bottom-nav />
      }
    </div>
  `,
  styles: [`
    .app-shell {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      background: var(--bg);
    }
    .app-content {
      flex: 1;
      padding-bottom: 70px;
    }
  `],
})
export class App {
  private auth = inject(AuthService);

  showNav = computed(() => this.auth.currentUser() !== null);
}
