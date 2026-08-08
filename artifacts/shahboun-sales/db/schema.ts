// مخطط قاعدة بيانات SQLite — المصدر الوحيد للبنية والإصدار
export const SCHEMA_VERSION = 1;
export const BACKUP_APP_MARKER = 'shahboun-sales-backup';
export const DB_NAME = 'shahboun_sales.db';

// DDL — كل الجداول التجارية
export const CREATE_TABLES: string[] = [
  `CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, sku TEXT, barcode TEXT, category TEXT, unit TEXT,
    purchase_price REAL NOT NULL DEFAULT 0, sale_price REAL NOT NULL DEFAULT 0, wholesale_price REAL NOT NULL DEFAULT 0,
    stock REAL NOT NULL DEFAULT 0, minimum_stock REAL NOT NULL DEFAULT 0, shelf TEXT,
    active INTEGER NOT NULL DEFAULT 1, usd_linked INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS categories (name TEXT PRIMARY KEY)`,
  `CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT, address TEXT, balance REAL NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS customer_transactions (
    id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, kind TEXT NOT NULL, amount REAL NOT NULL,
    ref TEXT, created_at TEXT NOT NULL, user TEXT)`,
  `CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT, address TEXT, balance REAL NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS supplier_transactions (
    id TEXT PRIMARY KEY, supplier_id TEXT NOT NULL, kind TEXT NOT NULL, amount REAL NOT NULL,
    ref TEXT, created_at TEXT NOT NULL, user TEXT)`,
  `CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY, invoice_number TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL,
    subtotal REAL NOT NULL, discount REAL NOT NULL DEFAULT 0, total REAL NOT NULL,
    paid REAL NOT NULL DEFAULT 0, payment_method TEXT NOT NULL, customer_id TEXT, user TEXT,
    returned INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS sale_items (
    sale_id TEXT NOT NULL, product_id TEXT NOT NULL, name TEXT NOT NULL,
    quantity REAL NOT NULL, unit_price REAL NOT NULL,
    cost_price REAL NOT NULL DEFAULT 0, -- تكلفة المنتج المثبتة لحظة البيع
    total REAL NOT NULL,
    PRIMARY KEY (sale_id, product_id))`,
  `CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY, invoice_number TEXT NOT NULL, created_at TEXT NOT NULL,
    supplier_id TEXT, supplier_name TEXT, total REAL NOT NULL, paid REAL NOT NULL DEFAULT 0, user TEXT)`,
  `CREATE TABLE IF NOT EXISTS purchase_items (
    purchase_id TEXT NOT NULL, product_id TEXT NOT NULL, name TEXT NOT NULL,
    quantity REAL NOT NULL, unit_cost REAL NOT NULL, total REAL NOT NULL,
    PRIMARY KEY (purchase_id, product_id))`,
  `CREATE TABLE IF NOT EXISTS returns (
    id TEXT PRIMARY KEY, return_number TEXT NOT NULL, created_at TEXT NOT NULL,
    sale_id TEXT NOT NULL, invoice_ref TEXT, total REAL NOT NULL, user TEXT)`,
  `CREATE TABLE IF NOT EXISTS return_items (
    return_id TEXT NOT NULL, product_id TEXT NOT NULL, name TEXT NOT NULL,
    quantity REAL NOT NULL, unit_price REAL NOT NULL, total REAL NOT NULL,
    PRIMARY KEY (return_id, product_id))`,
  `CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT, amount REAL NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS shifts (
    id TEXT PRIMARY KEY, opened_at TEXT NOT NULL, closed_at TEXT, opening_balance REAL NOT NULL,
    closing_balance REAL, expected_balance REAL, sales_total REAL NOT NULL DEFAULT 0,
    expenses_total REAL NOT NULL DEFAULT 0, purchases_total REAL NOT NULL DEFAULT 0,
    cash_in REAL NOT NULL DEFAULT 0, cash_out REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL, user TEXT, notes TEXT)`,
  `CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY, password_hash TEXT NOT NULL,
    must_change_password INTEGER NOT NULL DEFAULT 1, role TEXT NOT NULL DEFAULT 'admin',
    active INTEGER NOT NULL DEFAULT 1)`,
  `CREATE TABLE IF NOT EXISTS roles (name TEXT PRIMARY KEY, title TEXT, permissions TEXT)`,
  `CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY, action TEXT NOT NULL, detail TEXT, created_at TEXT NOT NULL, user TEXT)`,
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`,
  `CREATE TABLE IF NOT EXISTS store_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1), store_name TEXT, owner_name TEXT, phone TEXT, whatsapp TEXT,
    city TEXT, address TEXT, activity_type TEXT, email TEXT, logo_uri TEXT)`,
  `CREATE TABLE IF NOT EXISTS counters (name TEXT PRIMARY KEY, value INTEGER NOT NULL DEFAULT 0)`,
  `CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id)`,
  `CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id)`,
  `CREATE INDEX IF NOT EXISTS idx_return_items_return ON return_items(return_id)`,
  `CREATE INDEX IF NOT EXISTS idx_ct_customer ON customer_transactions(customer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_st_supplier ON supplier_transactions(supplier_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at)`,
];

// أعمدة كل جدول بالترتيب — تُستخدم لتوليد INSERT OR REPLACE
export const TABLE_COLUMNS: Record<string, string[]> = {
  products: ['id', 'name', 'sku', 'barcode', 'category', 'unit', 'purchase_price', 'sale_price', 'wholesale_price', 'stock', 'minimum_stock', 'shelf', 'active', 'usd_linked'],
  categories: ['name'],
  customers: ['id', 'name', 'phone', 'address', 'balance'],
  customer_transactions: ['id', 'customer_id', 'kind', 'amount', 'ref', 'created_at', 'user'],
  suppliers: ['id', 'name', 'phone', 'address', 'balance'],
  supplier_transactions: ['id', 'supplier_id', 'kind', 'amount', 'ref', 'created_at', 'user'],
  sales: ['id', 'invoice_number', 'created_at', 'subtotal', 'discount', 'total', 'paid', 'payment_method', 'customer_id', 'user', 'returned'],
  sale_items: ['sale_id', 'product_id', 'name', 'quantity', 'unit_price', 'cost_price', 'total'],
  purchases: ['id', 'invoice_number', 'created_at', 'supplier_id', 'supplier_name', 'total', 'paid', 'user'],
  purchase_items: ['purchase_id', 'product_id', 'name', 'quantity', 'unit_cost', 'total'],
  returns: ['id', 'return_number', 'created_at', 'sale_id', 'invoice_ref', 'total', 'user'],
  return_items: ['return_id', 'product_id', 'name', 'quantity', 'unit_price', 'total'],
  expenses: ['id', 'title', 'category', 'amount', 'created_at'],
  shifts: ['id', 'opened_at', 'closed_at', 'opening_balance', 'closing_balance', 'expected_balance', 'sales_total', 'expenses_total', 'purchases_total', 'cash_in', 'cash_out', 'status', 'user', 'notes'],
  users: ['username', 'password_hash', 'must_change_password', 'role', 'active'],
  roles: ['name', 'title', 'permissions'],
  audit_log: ['id', 'action', 'detail', 'created_at', 'user'],
  settings: ['key', 'value'],
  store_profile: ['id', 'store_name', 'owner_name', 'phone', 'whatsapp', 'city', 'address', 'activity_type', 'email', 'logo_uri'],
  counters: ['name', 'value'],
};

export type TableName = keyof typeof TABLE_COLUMNS;

/** عملية كتابة واحدة داخل معاملة */
export interface UpsertOp {
  table: TableName;
  row: Record<string, unknown>;
}

export const upsertSql = (table: TableName): string => {
  const cols = TABLE_COLUMNS[table];
  return `INSERT OR REPLACE INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;
};

export const rowValues = (table: TableName, row: Record<string, unknown>): (string | number | null)[] =>
  TABLE_COLUMNS[table].map((c) => {
    const v = row[c];
    if (v === undefined || v === null) return null;
    if (typeof v === 'boolean') return v ? 1 : 0;
    return v as string | number;
  });
