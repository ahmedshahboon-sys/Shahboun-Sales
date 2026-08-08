// تحويل كائنات التطبيق ↔ صفوف SQLite
import type { AppState, Product, Customer, Supplier, Sale, Purchase, SaleReturn, Shift, Expense, AuditEntry, LedgerEntry, StoreProfile, PaymentMethod, ThemeMode, ThemeName } from '@/context/AppContext';
import type { UpsertOp } from './schema';

export const productRow = (p: Product): UpsertOp => ({ table: 'products', row: { id: p.id, name: p.name, sku: p.sku, barcode: p.barcode, category: p.category, unit: p.unit, purchase_price: p.purchasePrice, sale_price: p.salePrice, wholesale_price: p.wholesalePrice, stock: p.stock, minimum_stock: p.minimumStock, shelf: p.shelf, active: p.active, usd_linked: p.usdLinked } });
export const categoryRow = (name: string): UpsertOp => ({ table: 'categories', row: { name } });
export const customerRow = (c: Customer): UpsertOp => ({ table: 'customers', row: { id: c.id, name: c.name, phone: c.phone, address: c.address, balance: c.balance } });
export const supplierRow = (s: Supplier): UpsertOp => ({ table: 'suppliers', row: { id: s.id, name: s.name, phone: s.phone, address: s.address, balance: s.balance } });
export const expenseRow = (e: Expense): UpsertOp => ({ table: 'expenses', row: { id: e.id, title: e.title, category: e.category, amount: e.amount, created_at: e.createdAt } });
export const shiftRow = (s: Shift): UpsertOp => ({ table: 'shifts', row: { id: s.id, opened_at: s.openedAt, closed_at: s.closedAt ?? null, opening_balance: s.openingBalance, closing_balance: s.closingBalance ?? null, expected_balance: s.expectedBalance ?? null, sales_total: s.salesTotal, expenses_total: s.expensesTotal, purchases_total: s.purchasesTotal, cash_in: s.cashIn, cash_out: s.cashOut, status: s.status, user: s.user, notes: s.notes } });
export const auditRow = (a: AuditEntry): UpsertOp => ({ table: 'audit_log', row: { id: a.id, action: a.action, detail: a.detail, created_at: a.createdAt, user: a.user } });
export const settingRow = (key: string, value: string): UpsertOp => ({ table: 'settings', row: { key, value } });
export const customerTxRow = (t: LedgerEntry): UpsertOp => ({ table: 'customer_transactions', row: { id: t.id, customer_id: t.partyId, kind: t.kind, amount: t.amount, ref: t.ref, created_at: t.createdAt, user: t.user } });
export const supplierTxRow = (t: LedgerEntry): UpsertOp => ({ table: 'supplier_transactions', row: { id: t.id, supplier_id: t.partyId, kind: t.kind, amount: t.amount, ref: t.ref, created_at: t.createdAt, user: t.user } });
export const storeProfileRow = (p: StoreProfile): UpsertOp => ({ table: 'store_profile', row: { id: 1, store_name: p.storeName, owner_name: p.ownerName, phone: p.phone, whatsapp: p.whatsapp, city: p.city, address: p.address, activity_type: p.activityType, email: p.email, logo_uri: p.logoUri } });
export const userRow = (username: string, passwordHash: string, mustChange: boolean): UpsertOp => ({ table: 'users', row: { username, password_hash: passwordHash, must_change_password: mustChange, role: 'admin', active: 1 } });
export const adminRoleRow = (): UpsertOp => ({ table: 'roles', row: { name: 'admin', title: 'مدير عام', permissions: 'all' } });

export const saleOps = (s: Sale): UpsertOp[] => [
  { table: 'sales', row: { id: s.id, invoice_number: s.invoiceNumber, created_at: s.createdAt, subtotal: s.subtotal, discount: s.discount, total: s.total, paid: s.paid, cash_paid: s.cashPaid ?? 0, transfer_paid: s.transferPaid ?? 0, payment_method: s.paymentMethod, customer_id: s.customerId ?? null, user: s.user, returned: s.returned ?? false } },
  ...s.items.map((i): UpsertOp => ({ table: 'sale_items', row: { sale_id: s.id, product_id: i.productId, name: i.name, quantity: i.quantity, unit_price: i.unitPrice, cost_price: i.costPrice ?? 0, total: i.total } })),
];
export const purchaseOps = (p: Purchase): UpsertOp[] => [
  { table: 'purchases', row: { id: p.id, invoice_number: p.invoiceNumber, created_at: p.createdAt, supplier_id: p.supplierId ?? null, supplier_name: p.supplierName, total: p.total, paid: p.paid, user: p.user } },
  ...p.items.map((i): UpsertOp => ({ table: 'purchase_items', row: { purchase_id: p.id, product_id: i.productId, name: i.name, quantity: i.quantity, unit_cost: i.unitCost, total: i.total } })),
];
export const returnOps = (r: SaleReturn): UpsertOp[] => [
  { table: 'returns', row: { id: r.id, return_number: r.returnNumber, created_at: r.createdAt, sale_id: r.saleId, invoice_ref: r.invoiceRef, total: r.total, user: r.user } },
  ...r.items.map((i): UpsertOp => ({ table: 'return_items', row: { return_id: r.id, product_id: i.productId, name: i.name, quantity: i.quantity, unit_price: i.unitPrice, total: i.total } })),
];

/** إعدادات الحالة العامة كصفوف settings */
export const stateSettingsOps = (s: AppState): UpsertOp[] => [
  settingRow('usd_rate', String(s.usdRate)),
  settingRow('theme_mode', s.themeMode),
  settingRow('theme_name', s.themeName),
  settingRow('setup_complete', s.setupComplete ? '1' : '0'),
  settingRow('logged_in_user', s.loggedInUser ?? ''),
];

/** تفكيك الحالة الكاملة إلى كل صفوف القاعدة (يُستخدم في replaceAll) */
export function stateToOps(s: AppState): UpsertOp[] {
  const cats = Array.from(new Set(s.products.map((p) => p.category).filter(Boolean)));
  return [
    ...s.products.map(productRow),
    ...cats.map(categoryRow),
    ...s.customers.map(customerRow),
    ...s.suppliers.map(supplierRow),
    ...s.customerTransactions.map(customerTxRow),
    ...s.supplierTransactions.map(supplierTxRow),
    ...s.sales.flatMap(saleOps),
    ...s.purchases.flatMap(purchaseOps),
    ...s.returns.flatMap(returnOps),
    ...s.expenses.map(expenseRow),
    ...s.shifts.map(shiftRow),
    ...s.audit.map(auditRow),
    userRow('admin', s.passwordHash, s.mustChangePassword),
    adminRoleRow(),
    storeProfileRow(s.storeProfile),
    ...stateSettingsOps(s),
  ];
}

// ── صفوف SQLite → كائنات ──
type Row = Record<string, any>;
export const rowToProduct = (r: Row): Product => ({ id: r.id, name: r.name, sku: r.sku ?? '', barcode: r.barcode ?? '', category: r.category ?? '', unit: r.unit ?? '', purchasePrice: r.purchase_price, salePrice: r.sale_price, wholesalePrice: r.wholesale_price, stock: r.stock, minimumStock: r.minimum_stock, shelf: r.shelf ?? '', active: !!r.active, usdLinked: !!r.usd_linked });
export const rowToCustomer = (r: Row): Customer => ({ id: r.id, name: r.name, phone: r.phone ?? '', address: r.address ?? '', balance: r.balance });
export const rowToSupplier = (r: Row): Supplier => ({ id: r.id, name: r.name, phone: r.phone ?? '', address: r.address ?? '', balance: r.balance });
export const rowToExpense = (r: Row): Expense => ({ id: r.id, title: r.title, category: r.category ?? '', amount: r.amount, createdAt: r.created_at });
export const rowToShift = (r: Row): Shift => ({ id: r.id, openedAt: r.opened_at, closedAt: r.closed_at ?? undefined, openingBalance: r.opening_balance, closingBalance: r.closing_balance ?? undefined, expectedBalance: r.expected_balance ?? undefined, salesTotal: r.sales_total, expensesTotal: r.expenses_total, purchasesTotal: r.purchases_total, cashIn: r.cash_in, cashOut: r.cash_out, status: r.status, user: r.user ?? 'admin', notes: r.notes ?? '' });
export const rowToAudit = (r: Row): AuditEntry => ({ id: r.id, action: r.action, detail: r.detail ?? '', createdAt: r.created_at, user: r.user ?? 'admin' });
export const rowToCustomerTx = (r: Row): LedgerEntry => ({ id: r.id, partyId: r.customer_id, kind: r.kind, amount: r.amount, ref: r.ref ?? '', createdAt: r.created_at, user: r.user ?? 'admin' });
export const rowToSupplierTx = (r: Row): LedgerEntry => ({ id: r.id, partyId: r.supplier_id, kind: r.kind, amount: r.amount, ref: r.ref ?? '', createdAt: r.created_at, user: r.user ?? 'admin' });
export const rowToStoreProfile = (r: Row): StoreProfile => ({ storeName: r.store_name ?? '', ownerName: r.owner_name ?? '', phone: r.phone ?? '', whatsapp: r.whatsapp ?? '', city: r.city ?? '', address: r.address ?? '', activityType: r.activity_type ?? '', email: r.email ?? '', logoUri: r.logo_uri ?? null });
export const rowToSale = (r: Row, items: Row[]): Sale => ({ id: r.id, invoiceNumber: r.invoice_number, createdAt: r.created_at, subtotal: r.subtotal, discount: r.discount, total: r.total, paid: r.paid, cashPaid: Number(r.cash_paid ?? 0), transferPaid: Number(r.transfer_paid ?? 0), paymentMethod: r.payment_method as PaymentMethod, customerId: r.customer_id ?? undefined, user: r.user ?? 'admin', returned: !!r.returned, items: items.map((i) => ({ productId: i.product_id, name: i.name, quantity: i.quantity, unitPrice: i.unit_price, costPrice: i.cost_price, total: i.total })) });
export const rowToPurchase = (r: Row, items: Row[]): Purchase => ({ id: r.id, invoiceNumber: r.invoice_number, createdAt: r.created_at, supplierId: r.supplier_id ?? undefined, supplierName: r.supplier_name ?? '', total: r.total, paid: r.paid, user: r.user ?? 'admin', items: items.map((i) => ({ productId: i.product_id, name: i.name, quantity: i.quantity, unitCost: i.unit_cost, total: i.total })) });
export const rowToReturn = (r: Row, items: Row[]): SaleReturn => ({ id: r.id, returnNumber: r.return_number, createdAt: r.created_at, saleId: r.sale_id, invoiceRef: r.invoice_ref ?? '', total: r.total, user: r.user ?? 'admin', items: items.map((i) => ({ productId: i.product_id, name: i.name, quantity: i.quantity, unitPrice: i.unit_price, total: i.total })) });

export const settingsToState = (settings: Record<string, string>) => ({
  usdRate: Number(settings.usd_rate ?? 4.85) || 4.85,
  themeMode: (settings.theme_mode ?? 'system') as ThemeMode,
  themeName: (settings.theme_name ?? 'classic') as ThemeName,
  setupComplete: settings.setup_complete === '1',
  loggedInUser: settings.logged_in_user ? settings.logged_in_user : null,
});
