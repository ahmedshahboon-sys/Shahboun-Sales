// محرك SQLite الفعلي (Android/iOS) — كل البيانات في جداول منظمة مع معاملات
import * as SQLite from 'expo-sqlite';
import type { AppState } from '@/context/AppContext';
import { initialState } from '@/context/AppContext';
import { CREATE_TABLES, DB_NAME, SCHEMA_VERSION, TABLE_COLUMNS, UpsertOp, upsertSql, rowValues } from './schema';
import { rowToAudit, rowToCustomer, rowToCustomerTx, rowToExpense, rowToProduct, rowToPurchase, rowToReturn, rowToSale, rowToShift, rowToStoreProfile, rowToSupplier, rowToSupplierTx, settingsToState, stateToOps } from './mapping';
import type { BackupData, DbDriver } from './types';

class SqliteDriver implements DbDriver {
  private db: SQLite.SQLiteDatabase | null = null;
  /** طابور كتابة متسلسل — يمنع تداخل المعاملات وضياع الكتابات المتزامنة */
  private queue: Promise<unknown> = Promise.resolve();

  private enqueue<T>(job: () => Promise<T>): Promise<T> {
    const next = this.queue.then(job, job);
    this.queue = next.catch(() => undefined);
    return next;
  }

  private handle(): SQLite.SQLiteDatabase {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  async init(): Promise<void> {
    if (this.db) return;
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    await db.withExclusiveTransactionAsync(async (tx) => {
      for (const ddl of CREATE_TABLES) await tx.execAsync(ddl);
    });
    const saleCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(sales)');
    const saleColNames = new Set(saleCols.map((c) => c.name));

    if (!saleColNames.has('cash_paid')) {
      await db.execAsync('ALTER TABLE sales ADD COLUMN cash_paid REAL NOT NULL DEFAULT 0');
    }
    if (!saleColNames.has('transfer_paid')) {
      await db.execAsync('ALTER TABLE sales ADD COLUMN transfer_paid REAL NOT NULL DEFAULT 0');
    }

    // ترحيل الفواتير القديمة التي كانت تحفظ المبلغ في paid فقط
    await db.runAsync("UPDATE sales SET cash_paid = paid WHERE payment_method = 'نقدي' AND cash_paid = 0 AND transfer_paid = 0");
    await db.runAsync("UPDATE sales SET transfer_paid = paid WHERE payment_method = 'حوالة' AND cash_paid = 0 AND transfer_paid = 0");

    await db.runAsync(
      `INSERT OR REPLACE INTO settings (key, value) VALUES ('schema_version', ?)`,
      [String(SCHEMA_VERSION)]
    );

    this.db = db;
  }

  async loadState(): Promise<AppState | null> {
    const db = this.handle();
    const hasUser = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM users');
    if (!hasUser || hasUser.n === 0) return null;

    const [products, customers, suppliers, salesRows, saleItems, purchaseRows, purchaseItems, returnRows, returnItems, expenses, shifts, audit, ctx, stx, settingsRows, profileRow, adminRow] = await Promise.all([
      db.getAllAsync<any>('SELECT * FROM products'),
      db.getAllAsync<any>('SELECT * FROM customers'),
      db.getAllAsync<any>('SELECT * FROM suppliers'),
      db.getAllAsync<any>('SELECT * FROM sales ORDER BY created_at DESC'),
      db.getAllAsync<any>('SELECT * FROM sale_items'),
      db.getAllAsync<any>('SELECT * FROM purchases ORDER BY created_at DESC'),
      db.getAllAsync<any>('SELECT * FROM purchase_items'),
      db.getAllAsync<any>('SELECT * FROM returns ORDER BY created_at DESC'),
      db.getAllAsync<any>('SELECT * FROM return_items'),
      db.getAllAsync<any>('SELECT * FROM expenses ORDER BY created_at DESC'),
      db.getAllAsync<any>('SELECT * FROM shifts ORDER BY opened_at DESC'),
      db.getAllAsync<any>('SELECT * FROM audit_log ORDER BY created_at DESC'),
      db.getAllAsync<any>('SELECT * FROM customer_transactions ORDER BY created_at DESC'),
      db.getAllAsync<any>('SELECT * FROM supplier_transactions ORDER BY created_at DESC'),
      db.getAllAsync<any>('SELECT * FROM settings'),
      db.getFirstAsync<any>('SELECT * FROM store_profile WHERE id = 1'),
      db.getFirstAsync<any>(`SELECT * FROM users WHERE username = 'admin'`),
    ]);

    const settings: Record<string, string> = {};
    for (const r of settingsRows) settings[r.key] = r.value;
    const bySale = groupBy(saleItems, 'sale_id');
    const byPurchase = groupBy(purchaseItems, 'purchase_id');
    const byReturn = groupBy(returnItems, 'return_id');

    const base = initialState();
    return {
      ...base,
      ...settingsToState(settings),
      passwordHash: adminRow?.password_hash ?? base.passwordHash,
      mustChangePassword: adminRow ? !!adminRow.must_change_password : true,
      storeProfile: profileRow ? rowToStoreProfile(profileRow) : base.storeProfile,
      products: products.map(rowToProduct),
      customers: customers.map(rowToCustomer),
      suppliers: suppliers.map(rowToSupplier),
      sales: salesRows.map((r) => rowToSale(r, bySale[r.id] ?? [])),
      purchases: purchaseRows.map((r) => rowToPurchase(r, byPurchase[r.id] ?? [])),
      returns: returnRows.map((r) => rowToReturn(r, byReturn[r.id] ?? [])),
      expenses: expenses.map(rowToExpense),
      shifts: shifts.map(rowToShift),
      audit: audit.map(rowToAudit),
      customerTransactions: ctx.map(rowToCustomerTx),
      supplierTransactions: stx.map(rowToSupplierTx),
    };
  }

  persist(ops: UpsertOp[], _snapshot: AppState): Promise<void> {
    return this.enqueue(async () => {
      const db = this.handle();
      await db.withExclusiveTransactionAsync(async (tx) => {
        for (const op of ops) await tx.runAsync(upsertSql(op.table), rowValues(op.table, op.row));
      });
    });
  }

  nextCounter(name: string, seed: number): Promise<number> {
    return this.enqueue(async () => {
      const db = this.handle();
      let value = 0;
      await db.withExclusiveTransactionAsync(async (tx) => {
        await tx.runAsync('INSERT OR IGNORE INTO counters (name, value) VALUES (?, ?)', [name, seed]);
        await tx.runAsync('UPDATE counters SET value = value + 1 WHERE name = ?', [name]);
        const row = await tx.getFirstAsync<{ value: number }>('SELECT value FROM counters WHERE name = ?', [name]);
        value = row?.value ?? seed + 1;
      });
      return value;
    });
  }

  bumpCounter(name: string, atLeast: number): Promise<void> {
    return this.enqueue(async () => {
      const db = this.handle();
      await db.runAsync('INSERT INTO counters (name, value) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET value = MAX(value, excluded.value)', [name, atLeast]);
    });
  }

  async exportAll(): Promise<BackupData> {
    const db = this.handle();
    const state = (await this.loadState()) ?? initialState();
    const counterRows = await db.getAllAsync<{ name: string; value: number }>('SELECT * FROM counters');
    const counters: Record<string, number> = {};
    for (const r of counterRows) counters[r.name] = r.value;
    return { state: { ...state, loggedInUser: null }, counters };
  }

  replaceAll(data: BackupData): Promise<void> {
    return this.enqueue(async () => {
      const db = this.handle();
      const ops = stateToOps(data.state);
      await db.withExclusiveTransactionAsync(async (tx) => {
        for (const table of Object.keys(TABLE_COLUMNS)) {
          if (table === 'settings') continue; // نحافظ على schema_version وأعلام الترحيل
          await tx.execAsync(`DELETE FROM ${table}`);
        }
        for (const op of ops) await tx.runAsync(upsertSql(op.table), rowValues(op.table, op.row));
        for (const [name, value] of Object.entries(data.counters)) {
          await tx.runAsync('INSERT OR REPLACE INTO counters (name, value) VALUES (?, ?)', [name, value]);
        }
      });
    });
  }

  async getMeta(key: string): Promise<string | null> {
    const row = await this.handle().getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
    return row?.value ?? null;
  }

  setMeta(key: string, value: string): Promise<void> {
    return this.enqueue(async () => {
      await this.handle().runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
    });
  }
}

function groupBy(rows: any[], key: string): Record<string, any[]> {
  const out: Record<string, any[]> = {};
  for (const r of rows) (out[r[key]] ??= []).push(r);
  return out;
}

export const driver: DbDriver = new SqliteDriver();
