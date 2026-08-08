import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { db } from '@/db';
import { createBackupFile, restoreFromPickedFile } from '@/db/backup';
import { UpsertOp } from '@/db/schema';
import {
  auditRow, categoryRow, customerRow, customerTxRow, expenseRow, productRow, purchaseOps,
  returnOps, saleOps, settingRow, shiftRow, stateSettingsOps, storeProfileRow, supplierRow, supplierTxRow, userRow,
} from '@/db/mapping';

export type PaymentMethod = 'نقدي' | 'حوالة' | 'آجل' | 'مختلط';
export type ThemeMode = 'system' | 'light' | 'dark';
export type ThemeName = 'classic' | 'mint' | 'midnight';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  wholesalePrice: number;
  stock: number;
  minimumStock: number;
  shelf: string;
  active: boolean;
  usdLinked: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  balance: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  balance: number;
}

export interface CartLine {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  /** تكلفة المنتج المثبتة لحظة البيع — لا تتأثر بتغير سعر الشراء لاحقًا */
  costPrice?: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  items: CartLine[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  paymentMethod: PaymentMethod;
  customerId?: string;
  user: string;
  returned?: boolean;
}

export interface PurchaseLine {
  productId: string;
  name: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  supplierId?: string;
  supplierName: string;
  items: PurchaseLine[];
  total: number;
  paid: number;
  user: string;
}

export interface ReturnLine {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface SaleReturn {
  id: string;
  returnNumber: string;
  createdAt: string;
  saleId: string;
  invoiceRef: string;
  items: ReturnLine[];
  total: number;
  user: string;
}

export interface Shift {
  id: string;
  openedAt: string;
  closedAt?: string;
  openingBalance: number;
  closingBalance?: number;
  expectedBalance?: number;
  salesTotal: number;
  expensesTotal: number;
  purchasesTotal: number;
  cashIn: number;
  cashOut: number;
  status: 'open' | 'closed';
  user: string;
  notes: string;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  detail: string;
  createdAt: string;
  user: string;
}

/** حركة في كشف حساب عميل أو مورد */
export interface LedgerEntry {
  id: string;
  partyId: string;
  kind: 'debt' | 'payment';
  amount: number;
  ref: string;
  createdAt: string;
  user: string;
}

export interface StoreProfile {
  storeName: string;
  ownerName: string;
  phone: string;
  whatsapp: string;
  city: string;
  address: string;
  activityType: string;
  email: string;
  /** شعار متجر الزبون (اختياري) — منفصل تمامًا عن شعار منظومة شهبون الثابت */
  logoUri: string | null;
}

export const emptyStoreProfile = (): StoreProfile => ({
  storeName: '', ownerName: '', phone: '', whatsapp: '', city: '', address: '', activityType: '', email: '', logoUri: null,
});

export interface AppState {
  version: number;
  passwordHash: string;
  mustChangePassword: boolean;
  loggedInUser: string | null;
  /** بيانات متجر الزبون — قابلة للتعديل وتظهر في الفواتير والتقارير */
  storeProfile: StoreProfile;
  /** هل أُكمل الإعداد الأولي عند أول تشغيل؟ */
  setupComplete: boolean;
  usdRate: number;
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  customerTransactions: LedgerEntry[];
  supplierTransactions: LedgerEntry[];
  sales: Sale[];
  purchases: Purchase[];
  returns: SaleReturn[];
  shifts: Shift[];
  expenses: Expense[];
  audit: AuditEntry[];
  themeMode: ThemeMode;
  themeName: ThemeName;
}

interface AppContextValue {
  state: AppState;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; message: string }>;
  changePassword: (password: string) => Promise<{ ok: boolean; message: string }>;
  logout: () => void;
  addProduct: (product: Omit<Product, 'id' | 'active'>) => void;
  updateProduct: (id: string, values: Partial<Product>) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'balance'>) => void;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'balance'>) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  completeSale: (sale: Omit<Sale, 'id' | 'invoiceNumber' | 'createdAt' | 'user'>) => void;
  addPurchase: (purchase: Omit<Purchase, 'id' | 'invoiceNumber' | 'createdAt' | 'user'>) => void;
  addReturn: (saleReturn: Omit<SaleReturn, 'id' | 'returnNumber' | 'createdAt' | 'user'>) => void;
  collectFromCustomer: (customerId: string, amount: number) => void;
  payToSupplier: (supplierId: string, amount: number) => void;
  openShift: (openingBalance: number) => void;
  closeShift: (closingBalance: number, notes: string) => void;
  setTheme: (mode: ThemeMode, name: ThemeName) => void;
  setUsdRate: (rate: number) => void;
  completeSetup: (profile: StoreProfile) => void;
  updateStoreProfile: (values: Partial<StoreProfile>) => void;
  /** إنشاء ملف نسخة احتياطية فعلي ومشاركته */
  createBackup: () => Promise<{ ok: boolean; message: string }>;
  /** اختيار ملف نسخة واستعادته (مع فحص ونسخة أمان تلقائية) */
  restoreBackup: () => Promise<{ ok: boolean; message: string }>;
}

// مفاتيح AsyncStorage القديمة — تُقرأ مرة واحدة للترحيل إلى SQLite ثم تُؤرشف
const LEGACY_KEYS = ['@shahboun_sales_state_v3', '@shahboun_sales_state_v2'];
const MIGRATION_META = 'asyncstorage_migration';

const hashPassword = (password: string) => {
  let hash = 2166136261;
  for (let index = 0; index < password.length; index += 1) {
    hash ^= password.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
};

const uid = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// بذور العدّادات — تحافظ على صيَغ الأرقام الحالية INV-1001 / PUR-101 / RET-11
const COUNTER_SEEDS = { sale: 1000, purchase: 100, return: 10 } as const;

// النسخة التجارية تبدأ فارغة تمامًا — لا بيانات تجريبية. المستخدم الافتراضي admin فقط.
export const initialState = (): AppState => ({
  version: 4,
  passwordHash: hashPassword('admin'),
  mustChangePassword: true,
  loggedInUser: null,
  storeProfile: emptyStoreProfile(),
  setupComplete: false,
  usdRate: 4.85,
  products: [],
  customers: [],
  suppliers: [],
  customerTransactions: [],
  supplierTransactions: [],
  sales: [],
  purchases: [],
  returns: [],
  shifts: [],
  expenses: [],
  audit: [],
  themeMode: 'system',
  themeName: 'classic',
});

/** استخراج أكبر رقم من أرقام فواتير مثل INV-1048 */
const maxNumber = (values: string[], fallback: number) =>
  values.reduce((max, v) => {
    const n = Number((v.match(/(\d+)\s*$/) ?? [])[1]);
    return Number.isFinite(n) && n > max ? n : max;
  }, fallback);

/** ترحيل بيانات AsyncStorage القديمة إلى قاعدة SQLite — مرة واحدة فقط، دون فقدان بيانات */
async function migrateFromAsyncStorage(): Promise<void> {
  const done = await db.getMeta(MIGRATION_META);
  if (done === 'done') return;

  let legacyRaw: string | null = null;
  let legacyKey: string | null = null;
  for (const key of LEGACY_KEYS) {
    legacyRaw = await AsyncStorage.getItem(key);
    if (legacyRaw) { legacyKey = key; break; }
  }

  if (legacyRaw) {
    try {
      const parsed = JSON.parse(legacyRaw) as Partial<AppState> & { businessName?: string };
      delete parsed.businessName;
      const migrated: AppState = {
        ...initialState(),
        ...parsed,
        version: 4,
        customerTransactions: parsed.customerTransactions ?? [],
        supplierTransactions: parsed.supplierTransactions ?? [],
        storeProfile: { ...emptyStoreProfile(), ...(parsed.storeProfile ?? {}) },
        setupComplete: parsed.setupComplete ?? false,
      };
      const counters: Record<string, number> = {
        sale: maxNumber(migrated.sales.map((s) => s.invoiceNumber), COUNTER_SEEDS.sale),
        purchase: maxNumber(migrated.purchases.map((p) => p.invoiceNumber), COUNTER_SEEDS.purchase),
        return: maxNumber(migrated.returns.map((r) => r.returnNumber), COUNTER_SEEDS.return),
      };
      await db.replaceAll({ state: migrated, counters });

      // تحقق من نجاح النقل قبل لمس البيانات القديمة
      const check = await db.loadState();
      const okay = !!check
        && check.sales.length === migrated.sales.length
        && check.products.length === migrated.products.length
        && check.customers.length === migrated.customers.length;
      if (!okay) throw new Error('migration verification failed');

      // أرشفة البيانات القديمة بأمان (لا حذف قبل التأكد)
      await AsyncStorage.setItem(`${legacyKey}_migrated_archive`, legacyRaw);
      for (const key of LEGACY_KEYS) await AsyncStorage.removeItem(key);
    } catch (error) {
      // نُبقي بيانات AsyncStorage كما هي ولا نعلّم الترحيل كمكتمل
      console.error('AsyncStorage → SQLite migration failed:', error);
      return;
    }
  }
  await db.setMeta(MIGRATION_META, 'done');
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [loading, setLoading] = useState(true);
  // مرجع الحالة الحالية — كل عملية تُحسب منه وتُحفظ في القاعدة قبل أي عملية تالية
  const stateRef = useRef<AppState>(state);

  useEffect(() => {
    (async () => {
      try {
        await db.init();
        await migrateFromAsyncStorage();
        const loaded = await db.loadState();
        if (loaded) {
          stateRef.current = loaded;
          setState(loaded);
        } else {
          // قاعدة جديدة تمامًا — نكتب الحالة الابتدائية (admin + الإعدادات)
          const fresh = initialState();
          await db.replaceAll({ state: fresh, counters: { ...COUNTER_SEEDS } });
          stateRef.current = fresh;
          setState(fresh);
        }
      } catch (error) {
        console.error('Database initialization failed:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /** تنفيذ عملية: تحديث الحالة + حفظ صفوفها في القاعدة (معاملة واحدة، كتابات متسلسلة) */
  const commit = useCallback((next: AppState, ops: UpsertOp[]) => {
    stateRef.current = next;
    setState(next);
    db.persist(ops, next).catch((error) => console.error('DB persist failed:', error));
  }, []);

  const makeAudit = useCallback((action: string, detail: string, cur: AppState): AuditEntry => ({
    id: uid('audit'), action, detail, createdAt: new Date().toISOString(), user: cur.loggedInUser ?? 'admin',
  }), []);

  const login = useCallback(async (username: string, password: string) => {
    const cur = stateRef.current;
    if (username.trim().toLowerCase() !== 'admin') return { ok: false, message: 'اسم المستخدم غير صحيح.' };
    if (hashPassword(password) !== cur.passwordHash) return { ok: false, message: 'كلمة المرور غير صحيحة.' };
    const audit = makeAudit('تسجيل دخول', 'دخول ناجح إلى التطبيق', cur);
    const next = { ...cur, loggedInUser: 'admin', audit: [audit, ...cur.audit] };
    commit(next, [auditRow(audit), settingRow('logged_in_user', 'admin')]);
    return { ok: true, message: cur.mustChangePassword ? 'يجب تغيير كلمة المرور.' : 'تم تسجيل الدخول.' };
  }, [commit, makeAudit]);

  const changePassword = useCallback(async (password: string) => {
    if (password.length < 6) return { ok: false, message: 'كلمة المرور يجب ألا تقل عن 6 أحرف.' };
    const cur = stateRef.current;
    const audit = makeAudit('تغيير كلمة المرور', 'تم تحديث كلمة مرور المدير', cur);
    const passwordHash = hashPassword(password);
    const next = { ...cur, passwordHash, mustChangePassword: false, audit: [audit, ...cur.audit] };
    commit(next, [userRow('admin', passwordHash, false), auditRow(audit)]);
    return { ok: true, message: 'تم تحديث كلمة المرور.' };
  }, [commit, makeAudit]);

  const logout = useCallback(() => {
    const cur = stateRef.current;
    commit({ ...cur, loggedInUser: null }, [settingRow('logged_in_user', '')]);
  }, [commit]);

  const addProduct = useCallback((values: Omit<Product, 'id' | 'active'>) => {
    const cur = stateRef.current;
    const product: Product = { ...values, id: uid('product'), active: true };
    const audit = makeAudit('إضافة منتج', values.name, cur);
    const next = { ...cur, products: [product, ...cur.products], audit: [audit, ...cur.audit] };
    const ops = [productRow(product), auditRow(audit)];
    if (product.category) ops.push(categoryRow(product.category));
    commit(next, ops);
  }, [commit, makeAudit]);

  const updateProduct = useCallback((productId: string, values: Partial<Product>) => {
    const cur = stateRef.current;
    const updated = cur.products.find((p) => p.id === productId);
    if (!updated) return;
    const product = { ...updated, ...values };
    const audit = makeAudit('تعديل منتج', product.name, cur);
    const next = { ...cur, products: cur.products.map((p) => (p.id === productId ? product : p)), audit: [audit, ...cur.audit] };
    const ops = [productRow(product), auditRow(audit)];
    if (product.category) ops.push(categoryRow(product.category));
    commit(next, ops);
  }, [commit, makeAudit]);

  const addCustomer = useCallback((values: Omit<Customer, 'id' | 'balance'>) => {
    const cur = stateRef.current;
    const customer: Customer = { ...values, id: uid('customer'), balance: 0 };
    const audit = makeAudit('إضافة عميل', values.name, cur);
    commit({ ...cur, customers: [customer, ...cur.customers], audit: [audit, ...cur.audit] }, [customerRow(customer), auditRow(audit)]);
  }, [commit, makeAudit]);

  const addSupplier = useCallback((values: Omit<Supplier, 'id' | 'balance'>) => {
    const cur = stateRef.current;
    const supplier: Supplier = { ...values, id: uid('supplier'), balance: 0 };
    const audit = makeAudit('إضافة مورد', values.name, cur);
    commit({ ...cur, suppliers: [supplier, ...cur.suppliers], audit: [audit, ...cur.audit] }, [supplierRow(supplier), auditRow(audit)]);
  }, [commit, makeAudit]);

  const addExpense = useCallback((values: Omit<Expense, 'id' | 'createdAt'>) => {
    const cur = stateRef.current;
    const expense: Expense = { ...values, id: uid('expense'), createdAt: new Date().toISOString() };
    const audit = makeAudit('مصروف', `${values.title} — ${values.amount}`, cur);
    commit({ ...cur, expenses: [expense, ...cur.expenses], audit: [audit, ...cur.audit] }, [expenseRow(expense), auditRow(audit)]);
  }, [commit, makeAudit]);

  const completeSale = useCallback((values: Omit<Sale, 'id' | 'invoiceNumber' | 'createdAt' | 'user'>) => {
    void (async () => {
      // رقم فاتورة متسلسل فريد من عدّاد القاعدة — لا يتكرر مع الحذف أو الاستعادة
      const seq = await db.nextCounter('sale', COUNTER_SEEDS.sale);
      const cur = stateRef.current;
      const productById = new Map(cur.products.map((p) => [p.id, p]));
      // تثبيت تكلفة كل صنف لحظة البيع
      const items: CartLine[] = values.items.map((item) => ({ ...item, costPrice: productById.get(item.productId)?.purchasePrice ?? 0 }));
      const sale: Sale = { ...values, items, id: uid('sale'), invoiceNumber: `INV-${seq}`, createdAt: new Date().toISOString(), user: cur.loggedInUser ?? 'admin' };
      const touched: Product[] = [];
      const products = cur.products.map((p) => {
        const line = items.find((item) => item.productId === p.id);
        if (!line) return p;
        const updated = { ...p, stock: Math.max(0, p.stock - line.quantity) };
        touched.push(updated);
        return updated;
      });
      const debt = Math.max(0, values.total - values.paid);
      const ledger: LedgerEntry[] = values.customerId && debt > 0
        ? [{ id: uid('ct'), partyId: values.customerId, kind: 'debt', amount: debt, ref: sale.invoiceNumber, createdAt: sale.createdAt, user: sale.user }]
        : [];
      const customers = values.customerId
        ? cur.customers.map((c) => (c.id === values.customerId ? { ...c, balance: c.balance + debt } : c))
        : cur.customers;
      const touchedCustomer = customers.find((c) => c.id === values.customerId);
      const shifts = cur.shifts.map((s) => (s.status === 'open' ? { ...s, salesTotal: s.salesTotal + values.total, cashIn: s.cashIn + (values.paymentMethod === 'نقدي' ? values.paid : 0) } : s));
      const openShiftRow = shifts.find((s) => s.status === 'open');
      const audit = makeAudit('بيع', `${sale.invoiceNumber} — ${sale.total.toFixed(2)} د.ل`, cur);
      const next: AppState = { ...cur, products, customers, shifts, sales: [sale, ...cur.sales], customerTransactions: [...ledger, ...cur.customerTransactions], audit: [audit, ...cur.audit] };
      const ops: UpsertOp[] = [
        ...saleOps(sale),
        ...touched.map(productRow),
        ...(touchedCustomer ? [customerRow(touchedCustomer)] : []),
        ...ledger.map(customerTxRow),
        ...(openShiftRow ? [shiftRow(openShiftRow)] : []),
        auditRow(audit),
      ];
      commit(next, ops);
    })();
  }, [commit, makeAudit]);

  const addPurchase = useCallback((values: Omit<Purchase, 'id' | 'invoiceNumber' | 'createdAt' | 'user'>) => {
    void (async () => {
      const seq = await db.nextCounter('purchase', COUNTER_SEEDS.purchase);
      const cur = stateRef.current;
      const purchase: Purchase = { ...values, id: uid('purchase'), invoiceNumber: `PUR-${seq}`, createdAt: new Date().toISOString(), user: cur.loggedInUser ?? 'admin' };
      const touched: Product[] = [];
      const products = cur.products.map((p) => {
        const line = values.items.find((item) => item.productId === p.id);
        if (!line) return p;
        const updated = { ...p, stock: p.stock + line.quantity, purchasePrice: line.unitCost };
        touched.push(updated);
        return updated;
      });
      const debt = Math.max(0, values.total - values.paid);
      const ledger: LedgerEntry[] = values.supplierId && debt > 0
        ? [{ id: uid('st'), partyId: values.supplierId, kind: 'debt', amount: debt, ref: purchase.invoiceNumber, createdAt: purchase.createdAt, user: purchase.user }]
        : [];
      const suppliers = values.supplierId
        ? cur.suppliers.map((s) => (s.id === values.supplierId ? { ...s, balance: s.balance + debt } : s))
        : cur.suppliers;
      const touchedSupplier = suppliers.find((s) => s.id === values.supplierId);
      const shifts = cur.shifts.map((s) => (s.status === 'open' ? { ...s, purchasesTotal: s.purchasesTotal + values.total, cashOut: s.cashOut + (values.paid ?? 0) } : s));
      const openShiftRow = shifts.find((s) => s.status === 'open');
      const audit = makeAudit('مشتريات', `${purchase.invoiceNumber} — ${purchase.total.toFixed(2)} د.ل`, cur);
      const next: AppState = { ...cur, products, suppliers, shifts, purchases: [purchase, ...cur.purchases], supplierTransactions: [...ledger, ...cur.supplierTransactions], audit: [audit, ...cur.audit] };
      const ops: UpsertOp[] = [
        ...purchaseOps(purchase),
        ...touched.map(productRow),
        ...(touchedSupplier ? [supplierRow(touchedSupplier)] : []),
        ...ledger.map(supplierTxRow),
        ...(openShiftRow ? [shiftRow(openShiftRow)] : []),
        auditRow(audit),
      ];
      commit(next, ops);
    })();
  }, [commit, makeAudit]);

  const addReturn = useCallback((values: Omit<SaleReturn, 'id' | 'returnNumber' | 'createdAt' | 'user'>) => {
    void (async () => {
      const seq = await db.nextCounter('return', COUNTER_SEEDS.return);
      const cur = stateRef.current;
      const ret: SaleReturn = { ...values, id: uid('return'), returnNumber: `RET-${seq}`, createdAt: new Date().toISOString(), user: cur.loggedInUser ?? 'admin' };
      const touched: Product[] = [];
      const products = cur.products.map((p) => {
        const line = values.items.find((item) => item.productId === p.id);
        if (!line) return p;
        const updated = { ...p, stock: p.stock + line.quantity };
        touched.push(updated);
        return updated;
      });
      const sales = cur.sales.map((s) => (s.id === values.saleId ? { ...s, returned: true } : s));
      const returnedSale = sales.find((s) => s.id === values.saleId);
      const shifts = cur.shifts.map((s) => (s.status === 'open' ? { ...s, cashOut: s.cashOut + values.total } : s));
      const openShiftRow = shifts.find((s) => s.status === 'open');
      const audit = makeAudit('مرتجع', `${ret.returnNumber} — ${ret.total.toFixed(2)} د.ل`, cur);
      const next: AppState = { ...cur, products, sales, shifts, returns: [ret, ...cur.returns], audit: [audit, ...cur.audit] };
      const ops: UpsertOp[] = [
        ...returnOps(ret),
        ...touched.map(productRow),
        ...(returnedSale ? saleOps(returnedSale) : []),
        ...(openShiftRow ? [shiftRow(openShiftRow)] : []),
        auditRow(audit),
      ];
      commit(next, ops);
    })();
  }, [commit, makeAudit]);

  const collectFromCustomer = useCallback((customerId: string, amount: number) => {
    const cur = stateRef.current;
    const customer = cur.customers.find((c) => c.id === customerId);
    if (!customer) return;
    const updated = { ...customer, balance: Math.max(0, customer.balance - amount) };
    const entry: LedgerEntry = { id: uid('ct'), partyId: customerId, kind: 'payment', amount, ref: 'تحصيل', createdAt: new Date().toISOString(), user: cur.loggedInUser ?? 'admin' };
    const shifts = cur.shifts.map((s) => (s.status === 'open' ? { ...s, cashIn: s.cashIn + amount } : s));
    const openShiftRow = shifts.find((s) => s.status === 'open');
    const audit = makeAudit('تحصيل دين', `${customer.name} — ${amount.toFixed(2)} د.ل`, cur);
    const next = { ...cur, customers: cur.customers.map((c) => (c.id === customerId ? updated : c)), shifts, customerTransactions: [entry, ...cur.customerTransactions], audit: [audit, ...cur.audit] };
    commit(next, [customerRow(updated), customerTxRow(entry), ...(openShiftRow ? [shiftRow(openShiftRow)] : []), auditRow(audit)]);
  }, [commit, makeAudit]);

  const payToSupplier = useCallback((supplierId: string, amount: number) => {
    const cur = stateRef.current;
    const supplier = cur.suppliers.find((s) => s.id === supplierId);
    if (!supplier) return;
    const updated = { ...supplier, balance: Math.max(0, supplier.balance - amount) };
    const entry: LedgerEntry = { id: uid('st'), partyId: supplierId, kind: 'payment', amount, ref: 'سداد', createdAt: new Date().toISOString(), user: cur.loggedInUser ?? 'admin' };
    const shifts = cur.shifts.map((s) => (s.status === 'open' ? { ...s, cashOut: s.cashOut + amount } : s));
    const openShiftRow = shifts.find((s) => s.status === 'open');
    const audit = makeAudit('سداد لمورد', `${supplier.name} — ${amount.toFixed(2)} د.ل`, cur);
    const next = { ...cur, suppliers: cur.suppliers.map((s) => (s.id === supplierId ? updated : s)), shifts, supplierTransactions: [entry, ...cur.supplierTransactions], audit: [audit, ...cur.audit] };
    commit(next, [supplierRow(updated), supplierTxRow(entry), ...(openShiftRow ? [shiftRow(openShiftRow)] : []), auditRow(audit)]);
  }, [commit, makeAudit]);

  const openShift = useCallback((openingBalance: number) => {
    const cur = stateRef.current;
    const shift: Shift = { id: uid('shift'), openedAt: new Date().toISOString(), openingBalance, salesTotal: 0, expensesTotal: 0, purchasesTotal: 0, cashIn: 0, cashOut: 0, status: 'open', user: cur.loggedInUser ?? 'admin', notes: '' };
    const audit = makeAudit('فتح وردية', `رصيد افتتاحي ${openingBalance.toFixed(2)} د.ل`, cur);
    commit({ ...cur, shifts: [shift, ...cur.shifts], audit: [audit, ...cur.audit] }, [shiftRow(shift), auditRow(audit)]);
  }, [commit, makeAudit]);

  const closeShift = useCallback((closingBalance: number, notes: string) => {
    const cur = stateRef.current;
    let closed: Shift | null = null;
    const shifts = cur.shifts.map((s) => {
      if (s.status !== 'open') return s;
      const expected = s.openingBalance + s.cashIn - s.cashOut;
      closed = { ...s, closedAt: new Date().toISOString(), closingBalance, expectedBalance: expected, status: 'closed' as const, notes };
      return closed;
    });
    if (!closed) return;
    const audit = makeAudit('إغلاق وردية', `رصيد ختامي ${closingBalance.toFixed(2)} د.ل`, cur);
    commit({ ...cur, shifts, audit: [audit, ...cur.audit] }, [shiftRow(closed), auditRow(audit)]);
  }, [commit, makeAudit]);

  const setTheme = useCallback((mode: ThemeMode, name: ThemeName) => {
    const cur = stateRef.current;
    const next = { ...cur, themeMode: mode, themeName: name };
    commit(next, [settingRow('theme_mode', mode), settingRow('theme_name', name)]);
  }, [commit]);

  const setUsdRate = useCallback((rate: number) => {
    const cur = stateRef.current;
    const audit = makeAudit('سعر الدولار', rate.toFixed(2), cur);
    commit({ ...cur, usdRate: rate, audit: [audit, ...cur.audit] }, [settingRow('usd_rate', String(rate)), auditRow(audit)]);
  }, [commit, makeAudit]);

  const completeSetup = useCallback((profile: StoreProfile) => {
    const cur = stateRef.current;
    const audit = makeAudit('إعداد أولي', `تسجيل بيانات المتجر: ${profile.storeName}`, cur);
    const next = { ...cur, storeProfile: profile, setupComplete: true, audit: [audit, ...cur.audit] };
    commit(next, [storeProfileRow(profile), settingRow('setup_complete', '1'), auditRow(audit)]);
  }, [commit, makeAudit]);

  const updateStoreProfile = useCallback((values: Partial<StoreProfile>) => {
    const cur = stateRef.current;
    const profile = { ...cur.storeProfile, ...values };
    const audit = makeAudit('تعديل بيانات المتجر', Object.keys(values).join('، '), cur);
    commit({ ...cur, storeProfile: profile, audit: [audit, ...cur.audit] }, [storeProfileRow(profile), auditRow(audit)]);
  }, [commit, makeAudit]);

  const createBackup = useCallback(async () => {
    try {
      return await createBackupFile();
    } catch (error) {
      console.error('Backup failed:', error);
      return { ok: false, message: 'فشل إنشاء النسخة الاحتياطية.' };
    }
  }, []);

  const restoreBackup = useCallback(async () => {
    try {
      const result = await restoreFromPickedFile();
      if (result.ok && result.state) {
        stateRef.current = result.state;
        setState(result.state);
      }
      return { ok: result.ok, message: result.message };
    } catch (error) {
      console.error('Restore failed:', error);
      return { ok: false, message: 'فشلت الاستعادة — لم تُمَس البيانات الحالية.' };
    }
  }, []);

  const value = useMemo(() => ({
    state, loading, login, changePassword, logout,
    addProduct, updateProduct, addCustomer, addSupplier, addExpense,
    completeSale, addPurchase, addReturn, collectFromCustomer, payToSupplier,
    openShift, closeShift, setTheme, setUsdRate, completeSetup, updateStoreProfile,
    createBackup, restoreBackup,
  }), [state, loading, login, changePassword, logout, addProduct, updateProduct, addCustomer, addSupplier, addExpense, completeSale, addPurchase, addReturn, collectFromCustomer, payToSupplier, openShift, closeShift, setTheme, setUsdRate, completeSetup, updateStoreProfile, createBackup, restoreBackup]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
