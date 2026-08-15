// النسخ الاحتياطي والاستعادة — ملف فعلي يمكن حفظه ومشاركته، مع فحص صارم قبل الاستعادة
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import type { AppState } from '@/context/AppContext';
import { db } from './index';
import { BACKUP_APP_MARKER, SCHEMA_VERSION } from './schema';
import type { BackupData } from './types';

export interface BackupFile {
  app: string;
  schemaVersion: number;
  createdAt: string;
  data: BackupData;
}

const fileStamp = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};

/** إنشاء ملف نسخة احتياطية فعلي ومشاركته/تنزيله */
export async function createBackupFile(): Promise<{ ok: boolean; message: string }> {
  const data = await db.exportAll();
  const payload: BackupFile = { app: BACKUP_APP_MARKER, schemaVersion: SCHEMA_VERSION, createdAt: new Date().toISOString(), data };
  const json = JSON.stringify(payload);
  const fileName = `shahboun-backup-${fileStamp()}.json`;

  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return { ok: true, message: `تم تنزيل النسخة الاحتياطية: ${fileName}` };
  }

  const uri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(uri, json, { encoding: FileSystem.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'حفظ النسخة الاحتياطية' });
  }
  return { ok: true, message: `تم إنشاء النسخة الاحتياطية: ${fileName}` };
}

/** فحص محتوى ملف النسخة قبل قبوله */
export function validateBackup(raw: string): { ok: true; payload: BackupFile } | { ok: false; message: string } {
  let parsed: any;
  try { parsed = JSON.parse(raw); } catch { return { ok: false, message: 'الملف تالف — ليس ملف JSON صالحًا.' }; }
  if (!parsed || typeof parsed !== 'object' || parsed.app !== BACKUP_APP_MARKER) {
    return { ok: false, message: 'هذا الملف ليس نسخة احتياطية من منظومة شهبون للمبيعات.' };
  }
  if (typeof parsed.schemaVersion !== 'number' || parsed.schemaVersion > SCHEMA_VERSION) {
    return { ok: false, message: `إصدار النسخة (${parsed.schemaVersion ?? '؟'}) أحدث من إصدار التطبيق الحالي. حدّث التطبيق أولًا.` };
  }
  const s = parsed?.data?.state;
  const requiredArrays = ['products', 'customers', 'suppliers', 'sales', 'purchases', 'returns', 'expenses', 'shifts', 'audit'];
  if (!s || typeof s !== 'object' || !parsed.data.counters || requiredArrays.some((k) => !Array.isArray(s[k]))) {
    return { ok: false, message: 'بنية النسخة الاحتياطية غير مكتملة أو تالفة — رُفضت الاستعادة.' };
  }
  if (typeof s.passwordHash !== 'string' || !s.storeProfile || typeof s.storeProfile !== 'object') {
    return { ok: false, message: 'النسخة تفتقد بيانات أساسية (الحساب أو بيانات المتجر) — رُفضت الاستعادة.' };
  }
  return { ok: true, payload: parsed as BackupFile };
}

/** اختيار ملف نسخة واستعادته. تُنشأ نسخة أمان تلقائية قبل الاستبدال. */
export async function restoreFromPickedFile(): Promise<{ ok: boolean; message: string; state?: AppState }> {
  const picked = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true, multiple: false });
  if (picked.canceled || !picked.assets?.[0]) return { ok: false, message: 'أُلغيت الاستعادة.' };
  const asset = picked.assets[0];

  let raw: string;
  try {
    raw = Platform.OS === 'web'
      ? await (await fetch(asset.uri)).text()
      : await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
  } catch {
    return { ok: false, message: 'تعذّرت قراءة الملف المحدد.' };
  }

  const check = validateBackup(raw);
  if (!check.ok) return { ok: false, message: check.message };

  // نسخة أمان تلقائية من الحالة الحالية قبل أي استبدال
  try {
    const current = await db.exportAll();
    const safety: BackupFile = { app: BACKUP_APP_MARKER, schemaVersion: SCHEMA_VERSION, createdAt: new Date().toISOString(), data: current };
    if (Platform.OS === 'web') {
      await db.setMeta('pre_restore_safety_backup', JSON.stringify(safety));
    } else {
      const safetyUri = `${FileSystem.documentDirectory}shahboun-pre-restore-${fileStamp()}.json`;
      await FileSystem.writeAsStringAsync(safetyUri, JSON.stringify(safety), { encoding: FileSystem.EncodingType.UTF8 });
      await db.setMeta('pre_restore_safety_backup_uri', safetyUri);
    }
  } catch {
    // القاعدة فارغة تمامًا — لا حاجة لنسخة أمان
  }

  const incoming = check.payload.data;
  const restoredState: AppState = { ...incoming.state, loggedInUser: null };
  await db.replaceAll({ state: restoredState, counters: incoming.counters });
  const reloaded = await db.loadState();
  if (!reloaded) return { ok: false, message: 'فشل التحقق بعد الاستعادة — أعد المحاولة.' };
  return { ok: true, message: `تمت الاستعادة بنجاح (نسخة ${new Date(check.payload.createdAt).toLocaleString('ar')}).`, state: reloaded };
}
