import { Injectable, inject, signal, computed } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  user,
  User,
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { UserProfile } from '../models';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  readonly currentUser = signal<User | null>(null);
  readonly loading = signal(true);
  readonly isAdmin = computed(() => this.currentUser()?.email === 'guilhermebeckman3@gmail.com');

  constructor() {
    user(this.auth).subscribe(u => {
      this.currentUser.set(u);
      this.loading.set(false);
    });

    // Handle redirect result on native
    if (Capacitor.isNativePlatform()) {
      getRedirectResult(this.auth).then(result => {
        if (result?.user) {
          this.ensureUserProfile(result.user);
        }
      });
    }
  }

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    if (Capacitor.isNativePlatform()) {
      await signInWithRedirect(this.auth, provider);
    } else {
      const result = await signInWithPopup(this.auth, provider);
      await this.ensureUserProfile(result.user);
      await this.router.navigate(['/timer']);
    }
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
    await this.router.navigate(['/auth']);
  }

  private async ensureUserProfile(user: User): Promise<void> {
    const ref = doc(this.firestore, `users/${user.uid}`);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const profile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName ?? 'Anonymous Bird',
        email: user.email ?? '',
        photoURL: user.photoURL ?? '',
        totalFocusMinutes: 0,
        totalSessions: 0,
        createdAt: new Date(),
      };
      await setDoc(ref, profile);
    }
  }
}
