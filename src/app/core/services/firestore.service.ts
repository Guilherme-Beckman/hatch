import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  collectionData,
  docData,
  Timestamp,
  increment,
  writeBatch,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Egg, HATCH_DURATION_MS } from '../models/egg.model';
import { UserBird } from '../models/bird.model';
import { FocusSession, eggsFromSession, rollRarity, pickBird } from '../models/session.model';
import { BIRDS } from '../models/bird.model';
import { FoodType } from '../models/food.model';
import { Rarity } from '../models/bird.model';

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private db = inject(Firestore);

  // ─── Sessions ───────────────────────────────────────────

  async saveSession(userId: string, durationMinutes: number, food: FoodType): Promise<string> {
    const sessionsCol = collection(this.db, 'sessions');
    const now = new Date();
    const session: Omit<FocusSession, 'id'> = {
      userId,
      durationMinutes,
      foodUsed: food,
      startedAt: now,
      completedAt: now,
      completed: true,
      eggsGenerated: eggsFromSession(durationMinutes),
    };
    const ref = await addDoc(sessionsCol, session);

    // Update user stats
    const userRef = doc(this.db, `users/${userId}`);
    await updateDoc(userRef, {
      totalFocusMinutes: increment(durationMinutes),
      totalSessions: increment(1),
    });

    return ref.id;
  }

  // ─── Eggs ────────────────────────────────────────────────

  async generateEggs(userId: string, sessionId: string, durationMinutes: number, food: FoodType): Promise<void> {
    const count = eggsFromSession(durationMinutes);
    const batch = writeBatch(this.db);
    const eggsCol = collection(this.db, 'eggs');

    for (let i = 0; i < count; i++) {
      const rarity = rollRarity(durationMinutes);
      const birdId = pickBird(rarity, food, BIRDS);
      const hatchAt = new Date(Date.now() + HATCH_DURATION_MS[rarity]);

      const egg: Omit<Egg, 'id'> = {
        userId,
        birdId,
        rarity,
        foodUsed: food,
        hatchAt,
        createdAt: new Date(),
        hatched: false,
        sessionId,
      };
      const eggRef = doc(eggsCol);
      batch.set(eggRef, egg);
    }

    await batch.commit();
  }

  getUnhatchedEggs(userId: string): Observable<Egg[]> {
    const q = query(
      collection(this.db, 'eggs'),
      where('userId', '==', userId),
      where('hatched', '==', false),
      orderBy('createdAt', 'asc')
    );
    return collectionData(q, { idField: 'id' }).pipe(
      map(docs => docs.map(d => ({
        ...d,
        hatchAt: (d['hatchAt'] as Timestamp).toDate(),
        createdAt: (d['createdAt'] as Timestamp).toDate(),
      })) as Egg[])
    );
  }

  async hatchEgg(egg: Egg): Promise<void> {
    const batch = writeBatch(this.db);

    // Mark egg as hatched
    const eggRef = doc(this.db, `eggs/${egg.id}`);
    batch.update(eggRef, { hatched: true });

    // Create UserBird
    const birdsCol = collection(this.db, 'userBirds');
    const birdRef = doc(birdsCol);
    const userBird: Omit<UserBird, 'id'> = {
      userId: egg.userId,
      birdId: egg.birdId,
      stage: 'filhote',
      sessionsWithBird: 0,
      collectedAt: new Date(),
    };
    batch.set(birdRef, userBird);

    await batch.commit();
  }

  // ─── User Birds ──────────────────────────────────────────

  getUserBirds(userId: string): Observable<UserBird[]> {
    const q = query(
      collection(this.db, 'userBirds'),
      where('userId', '==', userId),
      orderBy('collectedAt', 'desc')
    );
    return collectionData(q, { idField: 'id' }).pipe(
      map(docs => docs.map(d => ({
        ...d,
        collectedAt: (d['collectedAt'] as Timestamp).toDate(),
      })) as UserBird[])
    );
  }

  async growBirdsAfterSession(userId: string): Promise<void> {
    // Called after each completed session – increments sessionsWithBird on all filhote/jovem birds
    const q = query(
      collection(this.db, 'userBirds'),
      where('userId', '==', userId)
    );
    // We read and update individually to check stage thresholds
    const { getDocs } = await import('@angular/fire/firestore');
    const snap = await getDocs(q);
    const batch = writeBatch(this.db);

    snap.forEach(docSnap => {
      const bird = docSnap.data() as UserBird;
      const newSessions = (bird.sessionsWithBird ?? 0) + 1;
      let newStage = bird.stage;

      if (bird.stage === 'filhote' && newSessions >= 5) newStage = 'jovem';
      else if (bird.stage === 'jovem' && newSessions >= 15) newStage = 'adulto';

      batch.update(docSnap.ref, { sessionsWithBird: newSessions, stage: newStage });
    });

    await batch.commit();
  }

  // ─── User Profile ────────────────────────────────────────

  getUserProfile(userId: string) {
    return docData(doc(this.db, `users/${userId}`), { idField: 'uid' });
  }

  // ─── Admin Tools ─────────────────────────────────────────

  async adminGenerateEggs(userId: string, count: number, food: FoodType, rarity: Rarity): Promise<void> {
    const batch = writeBatch(this.db);
    const eggsCol = collection(this.db, 'eggs');
    for (let i = 0; i < count; i++) {
      const birdId = pickBird(rarity, food, BIRDS);
      const egg: Omit<Egg, 'id'> = {
        userId,
        birdId,
        rarity,
        foodUsed: food,
        hatchAt: new Date(), // ready to hatch immediately
        createdAt: new Date(),
        hatched: false,
        sessionId: 'admin',
      };
      batch.set(doc(eggsCol), egg);
    }
    await batch.commit();
  }

  async adminHatchAllEggs(userId: string): Promise<void> {
    const { getDocs } = await import('@angular/fire/firestore');
    const q = query(
      collection(this.db, 'eggs'),
      where('userId', '==', userId),
      where('hatched', '==', false)
    );
    const snap = await getDocs(q);
    const batch = writeBatch(this.db);
    snap.forEach(docSnap => {
      const egg = docSnap.data() as Egg;
      batch.update(docSnap.ref, { hatched: true });
      const birdRef = doc(collection(this.db, 'userBirds'));
      const userBird: Omit<UserBird, 'id'> = {
        userId: egg.userId,
        birdId: egg.birdId,
        stage: 'filhote',
        sessionsWithBird: 0,
        collectedAt: new Date(),
      };
      batch.set(birdRef, userBird);
    });
    await batch.commit();
  }

  async adminResetStats(userId: string): Promise<void> {
    const userRef = doc(this.db, `users/${userId}`);
    await updateDoc(userRef, { totalFocusMinutes: 0, totalSessions: 0 });
  }
}
