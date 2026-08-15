// محرك الويب (معاينة التطوير فقط) — نفس واجهة SQLite لكن بتخزين JSON متسلسل.
// على أجهزة Android/iOS الفعلية يعمل محرك SQLite الحقيقي (driver.native.ts).
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppState } from '@/context/AppContext';
import type { UpsertOp } from './schema';
import { SCHEMA_VERSION } from './schema';
import type { BackupData, DbDriver } from './types';

const DB_KEY = '@shahboun_db_web_v1';

interface WebStore {
  schemaVersion: number;
  state: AppState | null;
  counters: Record<string, number>;
  meta: Record<string, string>;
}

class WebJsonDriver implements DbDriver {
  private store: WebStore = { schemaVersion: SCHEMA_VERSION, state: null, counters: {}, meta: {} };
  /** طابور كتابة متسلسل — يمنع كتابة لقطة قديمة فوق أحدث */
  private queue: Promise<unknown> = Promise.resolve();

  private enqueue<T>(job: () => Promise<T>): Promise<T> {
    const next = this.queue.then(job, job);
    this.queue = next.catch(() => undefined);
    return next;
  }

  private async flush(): Promise<void> {
    await AsyncStorage.setItem(DB_KEY, JSON.stringify(this.store));
  }

  async init(): Promise<void> {
    const raw = await AsyncStorage.getItem(DB_KEY);
    if (raw) {
      try { this.store = JSON.parse(raw) as WebStore; } catch { /* قاعدة تالفة — نبدأ من جديد */ }
    }
  }

  async loadState(): Promise<AppState | null> {
    return this.store.state;
  }

  persist(_ops: UpsertOp[], snapshot: AppState): Promise<void> {
    return this.enqueue(async () => {
      this.store.state = snapshot;
      await this.flush();
    });
  }

  nextCounter(name: string, seed: number): Promise<number> {
    return this.enqueue(async () => {
      const current = this.store.counters[name] ?? seed;
      const value = current + 1;
      this.store.counters[name] = value;
      await this.flush();
      return value;
    });
  }

  bumpCounter(name: string, atLeast: number): Promise<void> {
    return this.enqueue(async () => {
      this.store.counters[name] = Math.max(this.store.counters[name] ?? 0, atLeast);
      await this.flush();
    });
  }

  async exportAll(): Promise<BackupData> {
    const state = this.store.state;
    if (!state) throw new Error('empty database');
    return { state: { ...state, loggedInUser: null }, counters: { ...this.store.counters } };
  }

  replaceAll(data: BackupData): Promise<void> {
    return this.enqueue(async () => {
      this.store.state = data.state;
      this.store.counters = { ...data.counters };
      await this.flush();
    });
  }

  async getMeta(key: string): Promise<string | null> {
    return this.store.meta[key] ?? null;
  }

  setMeta(key: string, value: string): Promise<void> {
    return this.enqueue(async () => {
      this.store.meta[key] = value;
      await this.flush();
    });
  }
}

export const driver: DbDriver = new WebJsonDriver();
