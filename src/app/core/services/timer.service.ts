import { Injectable, signal, computed } from '@angular/core';
import { FoodType } from '../models/food.model';

export type TimerState = 'idle' | 'running' | 'paused' | 'finished';

@Injectable({ providedIn: 'root' })
export class TimerService {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  readonly state = signal<TimerState>('idle');
  readonly selectedFood = signal<FoodType>('semente');
  readonly targetMinutes = signal(25);
  readonly elapsedSeconds = signal(0);

  readonly remainingSeconds = computed(() =>
    Math.max(0, this.targetMinutes() * 60 - this.elapsedSeconds())
  );

  readonly progressPercent = computed(() => {
    const total = this.targetMinutes() * 60;
    return total > 0 ? (this.elapsedSeconds() / total) * 100 : 0;
  });

  readonly formattedRemaining = computed(() => {
    const s = this.remainingSeconds();
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  });

  start(): void {
    if (this.state() === 'running') return;
    this.state.set('running');
    this.intervalId = setInterval(() => {
      const next = this.elapsedSeconds() + 1;
      this.elapsedSeconds.set(next);
      if (next >= this.targetMinutes() * 60) {
        this.finish();
      }
    }, 1000);
  }

  pause(): void {
    if (this.state() !== 'running') return;
    this.state.set('paused');
    this.clearInterval();
  }

  resume(): void {
    if (this.state() !== 'paused') return;
    this.start();
  }

  abandon(): void {
    this.clearInterval();
    this.state.set('idle');
    this.elapsedSeconds.set(0);
  }

  skipToEnd(): void {
    if (this.state() !== 'running' && this.state() !== 'paused') return;
    this.clearInterval();
    this.elapsedSeconds.set(this.targetMinutes() * 60);
    this.state.set('finished');
  }

  setFood(food: FoodType): void {
    this.selectedFood.set(food);
  }

  setDuration(minutes: number): void {
    this.targetMinutes.set(Math.max(15, Math.min(180, minutes)));
  }

  private finish(): void {
    this.clearInterval();
    this.state.set('finished');
  }

  private clearInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
