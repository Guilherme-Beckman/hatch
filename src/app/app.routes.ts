import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent),
  },
  {
    path: 'timer',
    loadComponent: () => import('./features/timer/timer.component').then(m => m.TimerComponent),
    canActivate: [authGuard],
  },
  {
    path: 'incubadora',
    loadComponent: () => import('./features/incubadora/incubadora.component').then(m => m.IncubadoraComponent),
    canActivate: [authGuard],
  },
  {
    path: 'aviario',
    loadComponent: () => import('./features/aviario/aviario.component').then(m => m.AviarioComponent),
    canActivate: [authGuard],
  },
  {
    path: 'perfil',
    loadComponent: () => import('./features/perfil/perfil.component').then(m => m.PerfilComponent),
    canActivate: [authGuard],
  },
  { path: '', redirectTo: '/timer', pathMatch: 'full' },
  { path: '**', redirectTo: '/timer' },
];
