import type { AppState } from '@/context/AppContext';
import type { UpsertOp } from './schema';

/** كل بيانات النظام القابلة للنسخ الاحتياطي والاستعادة */
export interface BackupData {
  state: AppState;
  counters: Record<string, number>;
}

export interface DbDriver {
  /** فتح القاعدة وإنشاء الجداول */
  init(): Promise<void>;
  /** تحميل الحالة الكاملة، أو null إذا كانت القاعدة جديدة */
  loadState(): Promise<AppState | null>;
  /**
   * حفظ نتيجة عملية واحدة. ops تُنفَّذ داخل معاملة واحدة (SQLite)،
   * وsnapshot هي الحالة الكاملة بعد العملية (يستخدمها محرك الويب).
   * الكتابات متسلسلة داخليًا — لا تداخل ولا كتابة قديمة فوق أحدث.
   */
  persist(ops: UpsertOp[], snapshot: AppState): Promise<void>;
  /** زيادة عدّاد ذريًّا وإرجاع القيمة الجديدة (أرقام فواتير فريدة لا تتكرر) */
  nextCounter(name: string, seed: number): Promise<number>;
  /** رفع العدّاد إلى قيمة لا تقل عن المعطاة (يُستخدم في الترحيل والاستعادة) */
  bumpCounter(name: string, atLeast: number): Promise<void>;
  /** تصدير كل البيانات للنسخة الاحتياطية */
  exportAll(): Promise<BackupData>;
  /** استبدال كل البيانات (استعادة/ترحيل) داخل معاملة واحدة */
  replaceAll(data: BackupData): Promise<void>;
  getMeta(key: string): Promise<string | null>;
  setMeta(key: string, value: string): Promise<void>;
}
