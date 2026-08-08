// نقطة الدخول لقاعدة البيانات — Metro يختار driver.native.ts على الأجهزة وdriver.web.ts في المتصفح
export { driver as db } from './driver';
export type { BackupData, DbDriver } from './types';
export { SCHEMA_VERSION, BACKUP_APP_MARKER } from './schema';
