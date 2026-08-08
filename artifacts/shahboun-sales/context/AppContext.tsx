import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

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

export interface AppState {
  version: number;
  passwordHash: string;
  mustChangePassword: boolean;
  loggedInUser: string | null;
  businessName: string;
  usdRate: number;
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
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
  shareBackupText: () => string;
}

const STORAGE_KEY = '@shahboun_sales_state_v2';

const hashPassword = (password: string) => {
  let hash = 2166136261;
  for (let index = 0; index < password.length; index += 1) {
    hash ^= password.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
};

const uid = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const seedProducts: Product[] = [
  { id: 'p1', name: 'زيت محرك 10W40', sku: 'SH-1001', barcode: '6281001001', category: 'زيوت', unit: 'علبة', purchasePrice: 32, salePrice: 45, wholesalePrice: 41, stock: 18, minimumStock: 5, shelf: 'A-01', active: true, usdLinked: false },
  { id: 'p2', name: 'فلتر هواء أصلي', sku: 'SH-1002', barcode: '6281001002', category: 'قطع غيار', unit: 'قطعة', purchasePrice: 18, salePrice: 29, wholesalePrice: 26, stock: 7, minimumStock: 8, shelf: 'B-03', active: true, usdLinked: false },
  { id: 'p3', name: 'سائل تبريد أخضر', sku: 'SH-1003', barcode: '6281001003', category: 'سوائل', unit: 'عبوة', purchasePrice: 12, salePrice: 19, wholesalePrice: 17, stock: 31, minimumStock: 6, shelf: 'A-04', active: true, usdLinked: false },
  { id: 'p4', name: 'شاحن سيارة سريع', sku: 'SH-1004', barcode: '6281001004', category: 'إكسسوارات', unit: 'قطعة', purchasePrice: 24, salePrice: 39, wholesalePrice: 35, stock: 4, minimumStock: 6, shelf: 'C-02', active: true, usdLinked: true },
  { id: 'p5', name: 'مناديل تنظيف داخلية', sku: 'SH-1005', barcode: '6281001005', category: 'عناية', unit: 'علبة', purchasePrice: 6, salePrice: 10, wholesalePrice: 9, stock: 46, minimumStock: 10, shelf: 'D-01', active: true, usdLinked: false },
];

const initialState = (): AppState => ({
  version: 2,
  passwordHash: hashPassword('admin'),
  mustChangePassword: true,
  loggedInUser: null,
  businessName: 'منظومة شهبون للمبيعات',
  usdRate: 4.85,
  products: seedProducts,
  customers: [
    { id: 'c1', name: 'شركة المدار', phone: '091 222 4411', address: 'طرابلس', balance: 340 },
    { id: 'c2', name: 'محمود الفيتوري', phone: '092 700 1821', address: 'بنغازي', balance: 0 },
  ],
  suppliers: [
    { id: 's1', name: 'مورد الخليج', phone: '091 555 1987', address: 'طرابلس', balance: 860 },
    { id: 's2', name: 'شركة الإمداد', phone: '092 445 2100', address: 'مصراتة', balance: 0 },
  ],
  sales: [
    { id: 'sale_seed', invoiceNumber: 'INV-1048', createdAt: new Date().toISOString(), items: [{ productId: 'p1', name: 'زيت محرك 10W40', quantity: 2, unitPrice: 45, total: 90 }], subtotal: 90, discount: 0, total: 90, paid: 90, paymentMethod: 'نقدي', user: 'admin' },
  ],
  purchases: [],
  returns: [],
  shifts: [],
  expenses: [
    { id: 'e1', title: 'مصاريف نقل', category: 'تشغيل', amount: 120, createdAt: new Date().toISOString() },
  ],
  audit: [],
  themeMode: 'system',
  themeName: 'classic',
});

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value) {
          try {
            const parsed = JSON.parse(value) as Partial<AppState>;
            setState({ ...initialState(), ...parsed });
          } catch {
            setState(initialState());
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [state, loading]);

  const addAudit = useCallback((action: string, detail: string, current: AppState): AuditEntry => ({
    id: uid('audit'),
    action,
    detail,
    createdAt: new Date().toISOString(),
    user: current.loggedInUser ?? 'admin',
  }), []);

  const login = useCallback(async (username: string, password: string) => {
    if (username.trim().toLowerCase() !== 'admin') return { ok: false, message: 'اسم المستخدم غير صحيح.' };
    if (hashPassword(password) !== state.passwordHash) return { ok: false, message: 'كلمة المرور غير صحيحة.' };
    setState((cur) => ({ ...cur, loggedInUser: 'admin', audit: [addAudit('تسجيل دخول', 'دخول ناجح إلى التطبيق', cur), ...cur.audit] }));
    return { ok: true, message: state.mustChangePassword ? 'يجب تغيير كلمة المرور.' : 'تم تسجيل الدخول.' };
  }, [addAudit, state.mustChangePassword, state.passwordHash]);

  const changePassword = useCallback(async (password: string) => {
    if (password.length < 6) return { ok: false, message: 'كلمة المرور يجب ألا تقل عن 6 أحرف.' };
    setState((cur) => ({ ...cur, passwordHash: hashPassword(password), mustChangePassword: false, audit: [addAudit('تغيير كلمة المرور', 'تم تحديث كلمة مرور المدير', cur), ...cur.audit] }));
    return { ok: true, message: 'تم تحديث كلمة المرور.' };
  }, [addAudit]);

  const logout = useCallback(() => setState((cur) => ({ ...cur, loggedInUser: null })), []);

  const addProduct = useCallback((values: Omit<Product, 'id' | 'active'>) => {
    setState((cur) => ({ ...cur, products: [{ ...values, id: uid('product'), active: true }, ...cur.products], audit: [addAudit('إضافة منتج', values.name, cur), ...cur.audit] }));
  }, [addAudit]);

  const updateProduct = useCallback((productId: string, values: Partial<Product>) => {
    setState((cur) => ({ ...cur, products: cur.products.map((p) => p.id === productId ? { ...p, ...values } : p), audit: [addAudit('تعديل منتج', productId, cur), ...cur.audit] }));
  }, [addAudit]);

  const addCustomer = useCallback((values: Omit<Customer, 'id' | 'balance'>) => {
    setState((cur) => ({ ...cur, customers: [{ ...values, id: uid('customer'), balance: 0 }, ...cur.customers], audit: [addAudit('إضافة عميل', values.name, cur), ...cur.audit] }));
  }, [addAudit]);

  const addSupplier = useCallback((values: Omit<Supplier, 'id' | 'balance'>) => {
    setState((cur) => ({ ...cur, suppliers: [{ ...values, id: uid('supplier'), balance: 0 }, ...cur.suppliers], audit: [addAudit('إضافة مورد', values.name, cur), ...cur.audit] }));
  }, [addAudit]);

  const addExpense = useCallback((values: Omit<Expense, 'id' | 'createdAt'>) => {
    setState((cur) => ({ ...cur, expenses: [{ ...values, id: uid('expense'), createdAt: new Date().toISOString() }, ...cur.expenses], audit: [addAudit('مصروف', `${values.title} — ${values.amount}`, cur), ...cur.audit] }));
  }, [addAudit]);

  const completeSale = useCallback((values: Omit<Sale, 'id' | 'invoiceNumber' | 'createdAt' | 'user'>) => {
    setState((cur) => {
      const sale: Sale = { ...values, id: uid('sale'), invoiceNumber: `INV-${1000 + cur.sales.length + 1}`, createdAt: new Date().toISOString(), user: cur.loggedInUser ?? 'admin' };
      const products = cur.products.map((p) => {
        const line = values.items.find((item) => item.productId === p.id);
        return line ? { ...p, stock: Math.max(0, p.stock - line.quantity) } : p;
      });
      const customers = values.customerId
        ? cur.customers.map((c) => c.id === values.customerId ? { ...c, balance: c.balance + Math.max(0, values.total - values.paid) } : c)
        : cur.customers;
      // update active shift sales
      const shifts = cur.shifts.map((s) => s.status === 'open' ? { ...s, salesTotal: s.salesTotal + values.total, cashIn: s.cashIn + (values.paymentMethod === 'نقدي' ? values.paid : 0) } : s);
      return { ...cur, products, customers, shifts, sales: [sale, ...cur.sales], audit: [addAudit('بيع', `${sale.invoiceNumber} — ${sale.total.toFixed(2)} د.ل`, cur), ...cur.audit] };
    });
  }, [addAudit]);

  const addPurchase = useCallback((values: Omit<Purchase, 'id' | 'invoiceNumber' | 'createdAt' | 'user'>) => {
    setState((cur) => {
      const purchase: Purchase = { ...values, id: uid('purchase'), invoiceNumber: `PUR-${100 + cur.purchases.length + 1}`, createdAt: new Date().toISOString(), user: cur.loggedInUser ?? 'admin' };
      // increase stock and update purchase price
      const products = cur.products.map((p) => {
        const line = values.items.find((item) => item.productId === p.id);
        return line ? { ...p, stock: p.stock + line.quantity, purchasePrice: line.unitCost } : p;
      });
      // update supplier balance (amount owed to supplier)
      const suppliers = values.supplierId
        ? cur.suppliers.map((s) => s.id === values.supplierId ? { ...s, balance: s.balance + Math.max(0, values.total - values.paid) } : s)
        : cur.suppliers;
      const shifts = cur.shifts.map((s) => s.status === 'open' ? { ...s, purchasesTotal: s.purchasesTotal + values.total, cashOut: s.cashOut + (values.paid ?? 0) } : s);
      return { ...cur, products, suppliers, shifts, purchases: [purchase, ...cur.purchases], audit: [addAudit('مشتريات', `${purchase.invoiceNumber} — ${purchase.total.toFixed(2)} د.ل`, cur), ...cur.audit] };
    });
  }, [addAudit]);

  const addReturn = useCallback((values: Omit<SaleReturn, 'id' | 'returnNumber' | 'createdAt' | 'user'>) => {
    setState((cur) => {
      const ret: SaleReturn = { ...values, id: uid('return'), returnNumber: `RET-${10 + cur.returns.length + 1}`, createdAt: new Date().toISOString(), user: cur.loggedInUser ?? 'admin' };
      // restore stock
      const products = cur.products.map((p) => {
        const line = values.items.find((item) => item.productId === p.id);
        return line ? { ...p, stock: p.stock + line.quantity } : p;
      });
      // mark sale as returned
      const sales = cur.sales.map((s) => s.id === values.saleId ? { ...s, returned: true } : s);
      const shifts = cur.shifts.map((s) => s.status === 'open' ? { ...s, cashOut: s.cashOut + values.total } : s);
      return { ...cur, products, sales, shifts, returns: [ret, ...cur.returns], audit: [addAudit('مرتجع', `${ret.returnNumber} — ${ret.total.toFixed(2)} د.ل`, cur), ...cur.audit] };
    });
  }, [addAudit]);

  const collectFromCustomer = useCallback((customerId: string, amount: number) => {
    setState((cur) => {
      const customers = cur.customers.map((c) => c.id === customerId ? { ...c, balance: Math.max(0, c.balance - amount) } : c);
      const customer = cur.customers.find((c) => c.id === customerId);
      const shifts = cur.shifts.map((s) => s.status === 'open' ? { ...s, cashIn: s.cashIn + amount } : s);
      return { ...cur, customers, shifts, audit: [addAudit('تحصيل دين', `${customer?.name ?? customerId} — ${amount.toFixed(2)} د.ل`, cur), ...cur.audit] };
    });
  }, [addAudit]);

  const payToSupplier = useCallback((supplierId: string, amount: number) => {
    setState((cur) => {
      const suppliers = cur.suppliers.map((s) => s.id === supplierId ? { ...s, balance: Math.max(0, s.balance - amount) } : s);
      const supplier = cur.suppliers.find((s) => s.id === supplierId);
      const shifts = cur.shifts.map((s) => s.status === 'open' ? { ...s, cashOut: s.cashOut + amount } : s);
      return { ...cur, suppliers, shifts, audit: [addAudit('سداد لمورد', `${supplier?.name ?? supplierId} — ${amount.toFixed(2)} د.ل`, cur), ...cur.audit] };
    });
  }, [addAudit]);

  const openShift = useCallback((openingBalance: number) => {
    setState((cur) => {
      const shift: Shift = { id: uid('shift'), openedAt: new Date().toISOString(), openingBalance, salesTotal: 0, expensesTotal: 0, purchasesTotal: 0, cashIn: 0, cashOut: 0, status: 'open', user: cur.loggedInUser ?? 'admin', notes: '' };
      return { ...cur, shifts: [shift, ...cur.shifts], audit: [addAudit('فتح وردية', `رصيد افتتاحي ${openingBalance.toFixed(2)} د.ل`, cur), ...cur.audit] };
    });
  }, [addAudit]);

  const closeShift = useCallback((closingBalance: number, notes: string) => {
    setState((cur) => {
      const shifts = cur.shifts.map((s) => {
        if (s.status !== 'open') return s;
        const expected = s.openingBalance + s.cashIn - s.cashOut;
        return { ...s, closedAt: new Date().toISOString(), closingBalance, expectedBalance: expected, status: 'closed' as const, notes };
      });
      return { ...cur, shifts, audit: [addAudit('إغلاق وردية', `رصيد ختامي ${closingBalance.toFixed(2)} د.ل`, cur), ...cur.audit] };
    });
  }, [addAudit]);

  const setTheme = useCallback((mode: ThemeMode, name: ThemeName) => setState((cur) => ({ ...cur, themeMode: mode, themeName: name })), []);
  const setUsdRate = useCallback((rate: number) => setState((cur) => ({ ...cur, usdRate: rate, audit: [addAudit('سعر الدولار', rate.toFixed(2), cur), ...cur.audit] })), [addAudit]);
  const shareBackupText = useCallback(() => JSON.stringify({ exportedAt: new Date().toISOString(), app: 'Shahboun Sales', version: state.version, state }), [state]);

  const value = useMemo(() => ({
    state, loading, login, changePassword, logout,
    addProduct, updateProduct, addCustomer, addSupplier, addExpense,
    completeSale, addPurchase, addReturn, collectFromCustomer, payToSupplier,
    openShift, closeShift, setTheme, setUsdRate, shareBackupText,
  }), [state, loading, login, changePassword, logout, addProduct, updateProduct, addCustomer, addSupplier, addExpense, completeSale, addPurchase, addReturn, collectFromCustomer, payToSupplier, openShift, closeShift, setTheme, setUsdRate, shareBackupText]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
