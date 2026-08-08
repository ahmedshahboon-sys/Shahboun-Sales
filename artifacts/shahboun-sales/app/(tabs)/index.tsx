import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { CartLine, Customer, PaymentMethod, Product, PurchaseLine, SaleReturn, StoreProfile, Supplier, ThemeMode, ThemeName, emptyStoreProfile, useApp } from '@/context/AppContext';
import { APP_BRAND } from '@/constants/appInfo';
import { useColors } from '@/hooks/useColors';
import { EmptyState, IconButton, LoadingState, Pill, PrimaryButton, SectionTitle, StatCard, Surface, TextField } from '@/components/ShahbounUi';

type ScreenKey = 'dashboard' | 'pos' | 'products' | 'inventory' | 'customers' | 'suppliers' | 'expenses' | 'reports' | 'settings' | 'users' | 'shifts' | 'purchases' | 'invoices' | 'returns' | 'audit';

const money = (v: number) => `${v.toFixed(2)} د.ل`;
const formatDate = (v: string) => new Intl.DateTimeFormat('ar', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(v));
const formatDateShort = (v: string) => new Intl.DateTimeFormat('ar', { day: 'numeric', month: 'short', year: '2-digit' }).format(new Date(v));

export default function AppHome() {
  const { state, loading } = useApp();
  if (loading) return <LoadingState />;
  if (!state.setupComplete) return <SetupScreen />;
  // يبقى المستخدم في شاشة الدخول حتى يغيّر كلمة المرور الافتراضية
  if (!state.loggedInUser || state.mustChangePassword) return <LoginScreen />;
  return <AuthenticatedApp />;
}

// ─── الإعداد الأولي (أول تشغيل فقط) ───────────────────────────────────────────
function SetupScreen() {
  const colors = useColors();
  const { completeSetup } = useApp();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<StoreProfile>(emptyStoreProfile());
  const [message, setMessage] = useState('');
  const set = (key: keyof StoreProfile) => (value: string) => setProfile((p) => ({ ...p, [key]: value }));

  const pickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled && result.assets[0]) setProfile((p) => ({ ...p, logoUri: result.assets[0].uri }));
  };

  const submit = () => {
    if (!profile.storeName.trim()) { setMessage('اسم النشاط مطلوب.'); return; }
    if (!profile.ownerName.trim()) { setMessage('اسم المالك مطلوب.'); return; }
    if (!profile.phone.trim()) { setMessage('رقم الهاتف مطلوب.'); return; }
    completeSetup({ ...profile, storeName: profile.storeName.trim(), ownerName: profile.ownerName.trim(), phone: profile.phone.trim() });
  };

  return <SafeAreaView style={[styles.loginRoot, { backgroundColor: colors.primary, paddingTop: insets.top + 10 }]}>
    <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
      <View style={styles.loginBrand}>
        <Image source={APP_BRAND.logo} style={{ width: 74, height: 74, borderRadius: 18 }} contentFit="contain" />
        <Text style={styles.loginTitle}>{APP_BRAND.name}</Text>
        <Text style={styles.loginSubtitle}>خطوة واحدة قبل البدء — سجّل بيانات متجرك</Text>
      </View>
      <View style={[styles.loginCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.loginCardTitle, { color: colors.foreground }]}>بيانات النشاط</Text>
        <Text style={[styles.loginCardHint, { color: colors.mutedForeground }]}>تظهر هذه البيانات في فواتيرك وتقاريرك، ويمكن تعديلها لاحقًا من الإعدادات.</Text>
        <TextField label="اسم النشاط / المتجر *" value={profile.storeName} onChangeText={set('storeName')} placeholder="مثال: متجر النخبة لقطع الغيار" />
        <TextField label="اسم المالك *" value={profile.ownerName} onChangeText={set('ownerName')} placeholder="الاسم الكامل" />
        <TextField label="رقم الهاتف *" value={profile.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder="09x xxx xxxx" />
        <TextField label="رقم واتساب (اختياري)" value={profile.whatsapp} onChangeText={set('whatsapp')} keyboardType="phone-pad" placeholder="إن كان مختلفًا عن الهاتف" />
        <TextField label="المدينة" value={profile.city} onChangeText={set('city')} placeholder="مثال: طرابلس" />
        <TextField label="العنوان" value={profile.address} onChangeText={set('address')} placeholder="الشارع / المنطقة" />
        <TextField label="نوع النشاط" value={profile.activityType} onChangeText={set('activityType')} placeholder="مثال: قطع غيار سيارات" />
        <TextField label="البريد الإلكتروني (اختياري)" value={profile.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" placeholder="name@example.com" />
        <Pressable onPress={pickLogo} style={[styles.settingRow, { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12 }]}>
          {profile.logoUri
            ? <Image source={{ uri: profile.logoUri }} style={{ width: 44, height: 44, borderRadius: 10 }} contentFit="cover" />
            : <View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}><Ionicons name="image-outline" size={20} color={colors.secondaryForeground} /></View>}
          <View style={styles.rowGrow}>
            <Text style={[styles.rowTitle, { color: colors.foreground }]}>شعار المتجر (اختياري)</Text>
            <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{profile.logoUri ? 'تم اختيار الشعار — اضغط للتغيير' : 'يظهر في فواتيرك، وليس شعار المنظومة'}</Text>
          </View>
        </Pressable>
        {message ? <Text style={[styles.loginMessage, { color: colors.destructive }]}>{message}</Text> : null}
        <PrimaryButton title="حفظ ومتابعة" icon="checkmark-circle-outline" onPress={submit} />
      </View>
    </ScrollView>
  </SafeAreaView>;
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginScreen() {
  const colors = useColors();
  const { state, login, changePassword } = useApp();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [changed, setChanged] = useState(false);
  // تظهر شاشة تغيير كلمة المرور إجباريًا بعد أول دخول ناجح
  const changing = !changed && !!state.loggedInUser && state.mustChangePassword;

  const submitLogin = async () => {
    const result = await login(username, password);
    setMessage(result.message);
  };
  const submitPassword = async () => {
    if (newPassword !== confirmPassword) { setMessage('كلمتا المرور غير متطابقتين.'); return; }
    const result = await changePassword(newPassword);
    setMessage(result.message);
    if (result.ok) setChanged(true);
  };

  return <SafeAreaView style={[styles.loginRoot, { backgroundColor: colors.primary, paddingTop: insets.top + 18 }]}>
    <View style={styles.loginGlowOne} /><View style={styles.loginGlowTwo} />
    <View style={styles.loginBrand}><Image source={APP_BRAND.logo} style={{ width: 74, height: 74, borderRadius: 18 }} contentFit="contain" /><Text style={styles.loginTitle}>{APP_BRAND.name}</Text><Text style={styles.loginSubtitle}>{state.storeProfile.storeName || 'إدارة المبيعات بوضوح وسرعة'}</Text></View>
    <View style={[styles.loginCard, { backgroundColor: colors.card }]}>
      {changing
        ? <><Text style={[styles.loginCardTitle, { color: colors.foreground }]}>تأمين حساب المدير</Text><Text style={[styles.loginCardHint, { color: colors.mutedForeground }]}>هذه أول مرة تدخل فيها. اختر كلمة مرور جديدة للمتابعة.</Text><TextField label="كلمة المرور الجديدة" value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="ستة أحرف على الأقل" autoCapitalize="none" /><TextField label="تأكيد كلمة المرور" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="أعد كتابة كلمة المرور" autoCapitalize="none" /><PrimaryButton title="حفظ ومتابعة" icon="shield-checkmark-outline" onPress={submitPassword} /></>
        : <><Text style={[styles.loginCardTitle, { color: colors.foreground }]}>تسجيل الدخول</Text><Text style={[styles.loginCardHint, { color: colors.mutedForeground }]}>ادخل إلى فرعك لإدارة المبيعات والمخزون</Text><TextField label="اسم المستخدم" value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="admin" /><TextField label="كلمة المرور" value={password} onChangeText={setPassword} secureTextEntry placeholder="admin" autoCapitalize="none" /><PrimaryButton title="دخول آمن" icon="arrow-forward-circle-outline" onPress={submitLogin} />{message ? <Text style={[styles.loginMessage, { color: colors.destructive }]}>{message}</Text> : null}<View style={styles.demoHint}><Ionicons name="information-circle-outline" size={17} color={colors.mutedForeground} /><Text style={[styles.demoHintText, { color: colors.mutedForeground }]}>بيانات الدخول الأولية: admin / admin</Text></View></>}
    </View>
    <Text style={styles.loginFooter}>نسخة محلية — جاهزة للعمل دون إنترنت</Text>
  </SafeAreaView>;
}

// ─── Authenticated shell ──────────────────────────────────────────────────────
function AuthenticatedApp() {
  const colors = useColors();
  const { state } = useApp();
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<ScreenKey>('dashboard');
  const [moreOpen, setMoreOpen] = useState(false);
  const [clock, setClock] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(t); }, []);

  const navigate = (key: ScreenKey) => { setScreen(key); setMoreOpen(false); Haptics.selectionAsync().catch(() => undefined); };
  const titles: Record<ScreenKey, string> = { dashboard: 'لوحة التحكم', pos: 'نقطة البيع', products: 'المنتجات', inventory: 'المخزون', customers: 'العملاء', suppliers: 'الموردون', expenses: 'المصروفات', reports: 'التقارير', settings: 'الإعدادات', users: 'المستخدمون', shifts: 'الورديات', purchases: 'المشتريات', invoices: 'سجل الفواتير', returns: 'المرتجعات', audit: 'سجل العمليات' };
  const activeShift = state.shifts.find((s) => s.status === 'open');

  return <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
    <View style={styles.topBar}>
      <View><Text style={[styles.topEyebrow, { color: colors.mutedForeground }]}>{state.storeProfile.storeName || APP_BRAND.name}</Text><Text style={[styles.topTitle, { color: colors.foreground }]}>{titles[screen]}</Text></View>
      <View style={styles.topActions}>
        <Text style={[styles.clock, { color: colors.foreground }]}>{clock.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</Text>
        {activeShift && <View style={[styles.shiftBadge, { backgroundColor: `${colors.success}20` }]}><Ionicons name="time-outline" size={12} color={colors.success} /><Text style={[styles.shiftBadgeText, { color: colors.success }]}>وردية</Text></View>}
        <IconButton name="notifications-outline" accessibilityLabel="التنبيهات" color={colors.foreground} onPress={() => Alert.alert('التنبيهات', `${state.products.filter((p) => p.stock <= p.minimumStock).length} منتجات وصلت للحد الأدنى.`)} />
        <View style={[styles.avatar, { backgroundColor: colors.secondary }]}><Text style={[styles.avatarText, { color: colors.secondaryForeground }]}>م</Text></View>
      </View>
    </View>
    <View style={styles.content}>
      {screen === 'dashboard' && <DashboardScreen onNavigate={navigate} />}
      {screen === 'pos' && <PosScreen />}
      {screen === 'products' && <ProductsScreen />}
      {screen === 'inventory' && <InventoryScreen />}
      {screen === 'customers' && <PeopleScreen kind="customers" />}
      {screen === 'suppliers' && <PeopleScreen kind="suppliers" />}
      {screen === 'expenses' && <ExpensesScreen />}
      {screen === 'reports' && <ReportsScreen onNavigate={navigate} />}
      {screen === 'settings' && <SettingsScreen />}
      {screen === 'users' && <UsersScreen />}
      {screen === 'shifts' && <ShiftsScreen />}
      {screen === 'purchases' && <PurchasesScreen />}
      {screen === 'invoices' && <InvoicesScreen />}
      {screen === 'returns' && <ReturnsScreen />}
      {screen === 'audit' && <AuditScreen />}
    </View>
    <View style={[styles.bottomBar, { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, 8) }]}>
      <BottomItem label="الرئيسية" icon="grid-outline" active={screen === 'dashboard'} onPress={() => navigate('dashboard')} />
      <BottomItem label="نقطة البيع" icon="cart-outline" active={screen === 'pos'} onPress={() => navigate('pos')} emphasized />
      <BottomItem label="المخزون" icon="cube-outline" active={screen === 'inventory'} onPress={() => navigate('inventory')} />
      <BottomItem label="المزيد" icon="menu-outline" active={moreOpen} onPress={() => setMoreOpen((v) => !v)} />
    </View>
    {moreOpen && <MoreMenu onNavigate={navigate} onClose={() => setMoreOpen(false)} />}
  </SafeAreaView>;
}

function BottomItem({ label, icon, active, emphasized, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; active: boolean; emphasized?: boolean; onPress: () => void }) {
  const colors = useColors();
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.bottomItem, pressed && { opacity: 0.7 }]}>
    <View style={[styles.bottomIcon, emphasized && { backgroundColor: colors.accent }, active && !emphasized && { backgroundColor: colors.secondary }]}>
      <Ionicons name={icon} size={emphasized ? 25 : 21} color={emphasized ? colors.accentForeground : active ? colors.secondaryForeground : colors.mutedForeground} />
    </View>
    <Text style={[styles.bottomLabel, { color: active ? colors.foreground : colors.mutedForeground }]}>{label}</Text>
  </Pressable>;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashboardScreen({ onNavigate }: { onNavigate: (key: ScreenKey) => void }) {
  const colors = useColors();
  const { state } = useApp();
  const salesToday = state.sales.filter((s) => new Date(s.createdAt).toDateString() === new Date().toDateString()).reduce((sum, s) => sum + s.total, 0);
  const lowStock = state.products.filter((p) => p.stock <= p.minimumStock);
  const receivables = state.customers.reduce((sum, c) => sum + c.balance, 0);
  const pendingSuppliers = state.suppliers.reduce((sum, s) => sum + s.balance, 0);
  const activeShift = state.shifts.find((s) => s.status === 'open');

  return <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <View style={[styles.welcomeCard, { backgroundColor: colors.primary }]}>
      <View><Text style={styles.welcomeSmall}>صباح الخير، مدير النظام</Text><Text style={styles.welcomeTitle}>جاهز لإدارة يومك؟</Text><Text style={styles.welcomeMeta}>{new Intl.DateTimeFormat('ar', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</Text></View>
      <View style={styles.welcomeOrnament}><Ionicons name="bar-chart" size={38} color={colors.accent} /><View style={styles.orbit} /></View>
    </View>
    {activeShift && <View style={[styles.shiftBanner, { backgroundColor: `${colors.success}14`, borderColor: `${colors.success}30` }]}><Ionicons name="time-outline" size={18} color={colors.success} /><Text style={[styles.shiftBannerText, { color: colors.success }]}>وردية مفتوحة منذ {formatDate(activeShift.openedAt)} — صندوق نقدي {money(activeShift.openingBalance + activeShift.cashIn - activeShift.cashOut)}</Text></View>}
    <View style={styles.statGrid}><StatCard icon="trending-up-outline" label="مبيعات اليوم" value={money(salesToday)} accent onPress={() => onNavigate('reports')} /><StatCard icon="wallet-outline" label="الذمم المدينة" value={money(receivables)} onPress={() => onNavigate('customers')} /></View>
    <View style={styles.statGrid}><StatCard icon="cube-outline" label="أصناف نشطة" value={String(state.products.filter((p) => p.active).length)} onPress={() => onNavigate('products')} /><StatCard icon="business-outline" label="مستحق للموردين" value={money(pendingSuppliers)} onPress={() => onNavigate('suppliers')} /></View>
    <SectionTitle title="إجراءات سريعة" />
    <View style={styles.quickGrid}>
      <QuickAction icon="cart-outline" label="بيع جديد" color={colors.accent} onPress={() => onNavigate('pos')} />
      <QuickAction icon="bag-add-outline" label="مشتريات" color={colors.primary} onPress={() => onNavigate('purchases')} />
      <QuickAction icon="people-outline" label="عميل جديد" color={colors.gold} onPress={() => onNavigate('customers')} />
      <QuickAction icon="receipt-outline" label="سجل الفواتير" color={colors.warning} onPress={() => onNavigate('invoices')} />
    </View>
    <SectionTitle title="تنبيهات" action={lowStock.length ? 'عرض الكل' : undefined} onAction={() => onNavigate('inventory')} />
    <Surface>{lowStock.length ? lowStock.slice(0, 3).map((p) => <View key={p.id} style={styles.alertRow}><View style={[styles.alertIcon, { backgroundColor: `${colors.warning}18` }]}><Ionicons name="warning-outline" size={18} color={colors.warning} /></View><View style={styles.rowGrow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{p.name}</Text><Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>المتبقي {p.stock} {p.unit} — الحد {p.minimumStock}</Text></View><Pill label="منخفض" tone="warning" /></View>) : <View style={styles.goodState}><Ionicons name="checkmark-circle" size={23} color={colors.success} /><Text style={[styles.goodText, { color: colors.foreground }]}>كل المخزونات ضمن الحدود الآمنة</Text></View>}</Surface>
    <SectionTitle title="آخر الفواتير" action="الكل" onAction={() => onNavigate('invoices')} />
    <Surface>{state.sales.slice(0, 4).map((sale) => <View key={sale.id} style={styles.saleRow}><View style={[styles.invoiceIcon, { backgroundColor: sale.returned ? `${colors.destructive}18` : colors.secondary }]}><Ionicons name="receipt-outline" size={18} color={sale.returned ? colors.destructive : colors.secondaryForeground} /></View><View style={styles.rowGrow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{sale.invoiceNumber}{sale.returned ? ' (مرتجع)' : ''}</Text><Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{formatDate(sale.createdAt)} — {sale.paymentMethod}</Text></View><Text style={[styles.saleAmount, { color: colors.foreground }]}>{money(sale.total)}</Text></View>)}</Surface>
  </ScrollView>;
}

function QuickAction({ icon, label, color, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; onPress: () => void }) {
  const colors = useColors();
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.78 : 1 }]}><View style={[styles.quickIcon, { backgroundColor: `${color}18` }]}><Ionicons name={icon} size={21} color={color} /></View><Text style={[styles.quickLabel, { color: colors.foreground }]}>{label}</Text></Pressable>;
}

// ─── POS ──────────────────────────────────────────────────────────────────────
function PosScreen() {
  const colors = useColors();
  const { state, completeSale } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('الكل');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('نقدي');
  const [paid, setPaid] = useState('');
  const [discount, setDiscount] = useState('');
  const [customerId, setCustomerId] = useState<string | undefined>();
  const categories = ['الكل', ...Array.from(new Set(state.products.map((p) => p.category)))];
  const filtered = state.products.filter((p) => p.active && (category === 'الكل' || p.category === category) && `${p.name} ${p.sku} ${p.barcode}`.toLowerCase().includes(query.toLowerCase()));
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const discountValue = Math.min(Number(discount) || 0, subtotal);
  const total = subtotal - discountValue;

  const addToCart = (product: Product) => {
    setCart((cur) => {
      const existing = cur.find((item) => item.productId === product.id);
      if (existing) return cur.map((item) => item.productId === product.id ? { ...item, quantity: Math.min(product.stock, item.quantity + 1), total: Math.min(product.stock, item.quantity + 1) * item.unitPrice } : item);
      return [...cur, { productId: product.id, name: product.name, quantity: 1, unitPrice: product.salePrice, total: product.salePrice }];
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };
  const changeQuantity = (line: CartLine, delta: number) => setCart((cur) => cur.flatMap((item) => {
    if (item.productId !== line.productId) return [item];
    const product = state.products.find((p) => p.id === line.productId);
    const quantity = Math.min(product?.stock ?? 999, Math.max(0, item.quantity + delta));
    return quantity === 0 ? [] : [{ ...item, quantity, total: quantity * item.unitPrice }];
  }));
  const finishSale = () => {
    const paidValue = paymentMethod === 'آجل' ? 0 : Number(paid || total);
    if (paymentMethod !== 'آجل' && paymentMethod !== 'مختلط' && paidValue < total) { Alert.alert('المبلغ غير مكتمل', 'أدخل المبلغ المدفوع أو اختر البيع الآجل.'); return; }
    if ((paymentMethod === 'آجل' || paymentMethod === 'مختلط') && !customerId) { Alert.alert('اختر العميل', 'يجب اختيار عميل للبيع الآجل أو المختلط.'); return; }
    completeSale({ items: cart, subtotal, discount: discountValue, total, paid: paidValue, paymentMethod, customerId });
    setCart([]); setPaymentOpen(false); setPaid(''); setDiscount(''); setCustomerId(undefined);
    Alert.alert('✓ تم حفظ الفاتورة', 'تم تحديث المخزون وتسجيل العملية.');
  };

  return <View style={styles.flex}>
    <ScrollView contentContainerStyle={styles.posContent} showsVerticalScrollIndicator={false}>
      <View style={styles.posSearchRow}><TextField value={query} onChangeText={setQuery} placeholder="ابحث بالاسم أو الكود أو الباركود" style={styles.searchInput} /><IconButton name="barcode-outline" accessibilityLabel="قراءة الباركود" color={colors.accent} onPress={() => setCameraOpen(true)} /></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{categories.map((cat) => <Pressable key={cat} onPress={() => setCategory(cat)} style={[styles.chip, { backgroundColor: category === cat ? colors.primary : colors.card, borderColor: category === cat ? colors.primary : colors.border }]}><Text style={[styles.chipText, { color: category === cat ? colors.primaryForeground : colors.mutedForeground }]}>{cat}</Text></Pressable>)}</ScrollView>
      <SectionTitle title="المنتجات" action={`${filtered.length} صنف`} />
      {filtered.length ? <View style={styles.productGrid}>{filtered.map((p) => <ProductTile key={p.id} product={p} onPress={() => addToCart(p)} />)}</View> : <Surface><EmptyState icon="search-outline" title="لا توجد نتائج" detail="جرّب تغيير عبارة البحث أو التصنيف." /></Surface>}
      {cart.length > 0 && <><SectionTitle title="سلة البيع" /><Surface>{cart.map((line) => <View key={line.productId} style={styles.cartLine}><View style={styles.rowGrow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{line.name}</Text><Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{money(line.unitPrice)} × {line.quantity}</Text></View><View style={styles.cartQtyRow}><IconButton name="remove-circle-outline" accessibilityLabel="تقليل" color={colors.destructive} size={20} onPress={() => changeQuantity(line, -1)} /><Text style={[styles.cartQtyText, { color: colors.foreground }]}>{line.quantity}</Text><IconButton name="add-circle-outline" accessibilityLabel="زيادة" color={colors.accent} size={20} onPress={() => changeQuantity(line, 1)} /></View><Text style={[styles.cartLineTotal, { color: colors.foreground }]}>{money(line.total)}</Text></View>)}</Surface></>}
    </ScrollView>
    <View style={[styles.cartDock, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View><Text style={[styles.cartLabel, { color: colors.mutedForeground }]}>سلة البيع</Text><Text style={[styles.cartTotal, { color: colors.foreground }]}>{money(total)}</Text></View>
      <View style={styles.cartActions}><Text style={[styles.cartCount, { color: colors.mutedForeground }]}>{cart.reduce((sum, item) => sum + item.quantity, 0)} أصناف</Text><PrimaryButton title="مراجعة الدفع" icon="arrow-back-circle-outline" onPress={() => cart.length ? setPaymentOpen(true) : Alert.alert('السلة فارغة', 'أضف منتجًا واحدًا على الأقل.')} disabled={!cart.length} /></View>
    </View>
    <Modal transparent animationType="slide" visible={paymentOpen} onRequestClose={() => setPaymentOpen(false)}>
      <View style={styles.modalBackdrop}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.modalCard, { backgroundColor: colors.card }]}>
        <View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: colors.foreground }]}>إتمام البيع</Text><IconButton name="close" accessibilityLabel="إغلاق" onPress={() => setPaymentOpen(false)} /></View>
        <Text style={[styles.modalSummary, { color: colors.mutedForeground }]}>الإجمالي <Text style={[styles.modalSummaryStrong, { color: colors.foreground }]}>{money(total)}</Text></Text>
        <TextField label="خصم (اختياري)" value={discount} onChangeText={setDiscount} keyboardType="decimal-pad" placeholder="0.00" />
        <Text style={[styles.fieldCaption, { color: colors.mutedForeground }]}>طريقة الدفع</Text>
        <View style={styles.paymentOptions}>{(['نقدي', 'حوالة', 'آجل', 'مختلط'] as PaymentMethod[]).map((method) => <Pressable key={method} onPress={() => setPaymentMethod(method)} style={[styles.paymentOption, { borderColor: paymentMethod === method ? colors.accent : colors.border, backgroundColor: paymentMethod === method ? colors.secondary : colors.card }]}><Ionicons name={method === 'نقدي' ? 'cash-outline' : method === 'حوالة' ? 'swap-horizontal-outline' : method === 'آجل' ? 'time-outline' : 'layers-outline'} size={19} color={paymentMethod === method ? colors.secondaryForeground : colors.mutedForeground} /><Text style={[styles.paymentText, { color: paymentMethod === method ? colors.secondaryForeground : colors.foreground }]}>{method}</Text></Pressable>)}</View>
        {(paymentMethod === 'آجل' || paymentMethod === 'مختلط') && <><Text style={[styles.fieldCaption, { color: colors.mutedForeground }]}>العميل *</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{state.customers.map((c) => <Pressable key={c.id} onPress={() => setCustomerId(c.id)} style={[styles.chip, { backgroundColor: customerId === c.id ? colors.secondary : colors.card, borderColor: customerId === c.id ? colors.accent : colors.border }]}><Text style={[styles.chipText, { color: customerId === c.id ? colors.secondaryForeground : colors.mutedForeground }]}>{c.name}</Text></Pressable>)}</ScrollView></>}
        {paymentMethod !== 'آجل' && <TextField label="المبلغ المدفوع" value={paid} onChangeText={setPaid} keyboardType="decimal-pad" placeholder={total.toFixed(2)} />}
        {paymentMethod === 'آجل' && <Text style={[styles.creditHint, { color: colors.warning }]}>سيتم تسجيل المبلغ كدين على العميل المختار.</Text>}
        <PrimaryButton title="تأكيد وحفظ الفاتورة" icon="checkmark-circle-outline" variant="success" onPress={finishSale} />
      </KeyboardAvoidingView></View>
    </Modal>
    <BarcodeScannerModal visible={cameraOpen} onClose={() => setCameraOpen(false)} onScanned={(value) => { setQuery(value); setCameraOpen(false); const match = state.products.find((p) => p.barcode === value); if (match) addToCart(match); else Alert.alert('لم يتم العثور على المنتج', `الباركود ${value} غير مسجل.`); }} />
  </View>;
}

function BarcodeScannerModal({ visible, onClose, onScanned }: { visible: boolean; onClose: () => void; onScanned: (v: string) => void }) {
  const colors = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  useEffect(() => { if (!visible) setLocked(false); }, [visible]);
  return <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
    <View style={[styles.cameraRoot, { backgroundColor: colors.primary }]}>
      {!permission ? <LoadingState /> : !permission.granted
        ? <View style={styles.cameraPermission}><Ionicons name="camera-outline" size={45} color={colors.accent} /><Text style={[styles.cameraTitle, { color: '#FFFFFF' }]}>نحتاج إذن الكاميرا</Text><Text style={[styles.cameraDetail, { color: 'rgba(255,255,255,0.7)' }]}>اسمح باستخدام الكاميرا لقراءة الباركود.</Text><PrimaryButton title="السماح" icon="camera-outline" onPress={() => requestPermission()} /><PrimaryButton title="إلغاء" variant="ghost" onPress={onClose} /></View>
        : <><CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'code128', 'code39', 'qr'] }} onBarcodeScanned={locked ? undefined : ({ data }) => { setLocked(true); onScanned(data); }} />
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraTop}><Text style={styles.cameraTopTitle}>قراءة الباركود</Text><IconButton name="close" accessibilityLabel="إغلاق الكاميرا" color="#FFFFFF" onPress={onClose} /></View>
            <View style={styles.scanFrame}><View style={styles.scanCornerTL} /><View style={styles.scanCornerTR} /><View style={styles.scanCornerBL} /><View style={styles.scanCornerBR} /></View>
            <Text style={styles.scanHint}>ضع الباركود داخل الإطار</Text>
          </View>
        </>}
    </View>
  </Modal>;
}

function ProductTile({ product, onPress }: { product: Product; onPress: () => void }) {
  const colors = useColors();
  const low = product.stock <= product.minimumStock;
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.productTile, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.78 : 1 }]}>
    <View style={[styles.productThumb, { backgroundColor: colors.secondary }]}><Ionicons name="cube-outline" size={24} color={colors.secondaryForeground} /></View>
    <Text numberOfLines={2} style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text>
    <Text style={[styles.productCode, { color: colors.mutedForeground }]}>{product.sku}</Text>
    <View style={styles.productBottom}><Text style={[styles.productPrice, { color: colors.foreground }]}>{money(product.salePrice)}</Text><Pill label={`${product.stock} ${product.unit}`} tone={low ? 'warning' : 'success'} /></View>
  </Pressable>;
}

// ─── Products ─────────────────────────────────────────────────────────────────
function ProductsScreen() {
  const colors = useColors();
  const { state, addProduct } = useApp();
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [price, setPrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [stock, setStock] = useState('');
  const [minimum, setMinimum] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('قطعة');
  const filtered = state.products.filter((p) => `${p.name} ${p.sku} ${p.barcode}`.toLowerCase().includes(query.toLowerCase()));
  const save = () => {
    if (!name.trim() || !price) { Alert.alert('بيانات ناقصة', 'اكتب اسم المنتج وسعر البيع.'); return; }
    addProduct({ name: name.trim(), sku: sku.trim() || `SH-${1000 + state.products.length}`, barcode: barcode.trim(), category: category.trim() || 'عام', unit: unit.trim() || 'قطعة', purchasePrice: Number(purchasePrice) || Number(price) * 0.7, salePrice: Number(price), wholesalePrice: Number(price) * 0.9, stock: Number(stock) || 0, minimumStock: Number(minimum) || 3, shelf: '', usdLinked: false });
    setName(''); setSku(''); setBarcode(''); setPrice(''); setPurchasePrice(''); setStock(''); setMinimum(''); setCategory(''); setUnit('قطعة'); setModalOpen(false);
  };
  return <View style={styles.flex}>
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.toolbar}><View style={styles.toolbarSearch}><TextField value={query} onChangeText={setQuery} placeholder="ابحث عن منتج..." style={styles.searchInput} /></View><IconButton name="add" accessibilityLabel="إضافة منتج" color={colors.accent} style={[styles.roundAction, { backgroundColor: colors.secondary }]} onPress={() => setModalOpen(true)} /></View>
      <View style={styles.productSummary}><Text style={[styles.summaryNumber, { color: colors.foreground }]}>{state.products.length}</Text><Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>إجمالي المنتجات</Text><View style={[styles.summaryDivider, { backgroundColor: colors.border }]} /><Text style={[styles.summaryNumber, { color: colors.warning }]}>{state.products.filter((p) => p.stock <= p.minimumStock).length}</Text><Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>تحتاج طلبًا</Text></View>
      {filtered.map((p) => <Surface key={p.id} style={styles.listCard}><View style={styles.listMain}><View style={[styles.listAvatar, { backgroundColor: colors.secondary }]}><Ionicons name="cube-outline" size={21} color={colors.secondaryForeground} /></View><View style={styles.rowGrow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{p.name}</Text><Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{p.sku} · {p.category} · {p.shelf || 'بلا رف'}</Text></View><Pill label={p.stock <= p.minimumStock ? 'منخفض' : 'متوفر'} tone={p.stock <= p.minimumStock ? 'warning' : 'success'} /></View><View style={styles.productMeta}><Text style={[styles.metaText, { color: colors.foreground }]}>بيع <Text style={styles.metaStrong}>{money(p.salePrice)}</Text></Text><Text style={[styles.metaText, { color: colors.mutedForeground }]}>شراء <Text style={styles.metaStrong}>{money(p.purchasePrice)}</Text></Text><Text style={[styles.metaText, { color: colors.mutedForeground }]}>مخزون <Text style={styles.metaStrong}>{p.stock} {p.unit}</Text></Text></View></Surface>)}
      {!filtered.length && <EmptyState icon="cube-outline" title="لم تضف منتجات بعد" detail="ابدأ بإضافة منتجاتك لتظهر في نقطة البيع." />}
    </ScrollView>
    <Modal transparent animationType="slide" visible={modalOpen} onRequestClose={() => setModalOpen(false)}>
      <View style={styles.modalBackdrop}><ScrollView style={[styles.formModal, { backgroundColor: colors.card }]} contentContainerStyle={styles.formModalContent}>
        <View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: colors.foreground }]}>إضافة منتج</Text><IconButton name="close" accessibilityLabel="إغلاق" onPress={() => setModalOpen(false)} /></View>
        <TextField label="اسم المنتج *" value={name} onChangeText={setName} placeholder="مثال: فلتر زيت" />
        <View style={styles.formRow}><View style={styles.formHalf}><TextField label="كود داخلي" value={sku} onChangeText={setSku} placeholder="SH-1006" /></View><View style={styles.formHalf}><TextField label="باركود" value={barcode} onChangeText={setBarcode} placeholder="628..." keyboardType="numeric" /></View></View>
        <View style={styles.formRow}><View style={styles.formHalf}><TextField label="سعر البيع *" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0.00" /></View><View style={styles.formHalf}><TextField label="سعر الشراء" value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="decimal-pad" placeholder="0.00" /></View></View>
        <View style={styles.formRow}><View style={styles.formHalf}><TextField label="المخزون الافتتاحي" value={stock} onChangeText={setStock} keyboardType="decimal-pad" placeholder="0" /></View><View style={styles.formHalf}><TextField label="الحد الأدنى" value={minimum} onChangeText={setMinimum} keyboardType="decimal-pad" placeholder="3" /></View></View>
        <View style={styles.formRow}><View style={styles.formHalf}><TextField label="التصنيف" value={category} onChangeText={setCategory} placeholder="عام" /></View><View style={styles.formHalf}><TextField label="الوحدة" value={unit} onChangeText={setUnit} placeholder="قطعة" /></View></View>
        <PrimaryButton title="حفظ المنتج" icon="checkmark-outline" variant="success" onPress={save} />
      </ScrollView></View>
    </Modal>
  </View>;
}

// ─── Inventory ────────────────────────────────────────────────────────────────
function InventoryScreen() {
  const colors = useColors();
  const { state } = useApp();
  const low = state.products.filter((p) => p.stock <= p.minimumStock);
  const totalStock = state.products.reduce((sum, p) => sum + p.stock, 0);
  const stockValue = state.products.reduce((sum, p) => sum + p.stock * p.purchasePrice, 0);
  return <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <View style={styles.statGrid}><StatCard icon="cube-outline" label="إجمالي الوحدات" value={String(totalStock)} /><StatCard icon="cash-outline" label="قيمة المخزون" value={money(stockValue)} /></View>
    <SectionTitle title="أصناف تحتاج إعادة طلب" />
    <Surface>{low.length ? low.map((p) => <View key={p.id} style={styles.alertRow}><View style={[styles.alertIcon, { backgroundColor: `${colors.destructive}18` }]}><Ionicons name="alert-outline" size={18} color={colors.destructive} /></View><View style={styles.rowGrow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{p.name}</Text><Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>المتوفر {p.stock} — الحد الأدنى {p.minimumStock}</Text></View><Text style={[styles.lowNumber, { color: colors.destructive }]}>{p.stock}</Text></View>) : <EmptyState icon="checkmark-done-outline" title="المخزون بحالة ممتازة" detail="لا توجد أصناف تحت الحد الأدنى." />}</Surface>
    <SectionTitle title="كل المنتجات" />
    <Surface>{state.products.map((p) => <View key={p.id} style={styles.inventoryRow}><View style={styles.rowGrow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{p.name}</Text><Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{p.category} · {p.shelf || 'بدون رف'}</Text></View><View style={{ alignItems: 'flex-end' }}><Text style={[styles.inventoryStock, { color: p.stock <= p.minimumStock ? colors.warning : colors.success }]}>{p.stock} <Text style={[styles.stockUnit, { color: colors.mutedForeground }]}>{p.unit}</Text></Text><Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>قيمة {money(p.stock * p.purchasePrice)}</Text></View></View>)}</Surface>
  </ScrollView>;
}

// ─── Customers / Suppliers ────────────────────────────────────────────────────
function PeopleScreen({ kind }: { kind: 'customers' | 'suppliers' }) {
  const colors = useColors();
  const { state, addCustomer, addSupplier, collectFromCustomer, payToSupplier } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [payModal, setPayModal] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const items = kind === 'customers' ? state.customers : state.suppliers;
  const icon: keyof typeof Ionicons.glyphMap = kind === 'customers' ? 'people-outline' : 'business-outline';
  const save = () => {
    if (!name.trim()) { Alert.alert('اسم مطلوب', `اكتب اسم ${kind === 'customers' ? 'العميل' : 'المورد'}.`); return; }
    if (kind === 'customers') addCustomer({ name: name.trim(), phone, address }); else addSupplier({ name: name.trim(), phone, address });
    setName(''); setPhone(''); setAddress(''); setModalOpen(false);
  };
  const handlePay = () => {
    const amount = Number(payAmount);
    if (!amount || amount <= 0) { Alert.alert('مبلغ غير صحيح', 'أدخل مبلغًا صحيحًا.'); return; }
    if (kind === 'customers') collectFromCustomer(payModal!, amount);
    else payToSupplier(payModal!, amount);
    setPayModal(null); setPayAmount('');
    Alert.alert('✓ تم التسجيل', kind === 'customers' ? 'تم تسجيل الدفعة وتخفيض رصيد العميل.' : 'تم تسجيل سداد المورد.');
  };
  const selectedPerson = items.find((i) => i.id === payModal);

  return <View style={styles.flex}>
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.pageIntro}><View><Text style={[styles.pageIntroNumber, { color: colors.foreground }]}>{items.length}</Text><Text style={[styles.pageIntroLabel, { color: colors.mutedForeground }]}>{kind === 'customers' ? 'العملاء' : 'الموردون'} المسجلون</Text></View><PrimaryButton title={`إضافة ${kind === 'customers' ? 'عميل' : 'مورد'}`} icon="add" onPress={() => setModalOpen(true)} /></View>
      {items.map((item) => <Surface key={item.id} style={styles.listCard}>
        <View style={styles.listMain}><View style={[styles.listAvatar, { backgroundColor: kind === 'customers' ? colors.secondary : `${colors.gold}22` }]}><Ionicons name={icon} size={21} color={kind === 'customers' ? colors.secondaryForeground : colors.gold} /></View><View style={styles.rowGrow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.name}</Text><Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{item.phone || 'لا يوجد هاتف'} · {item.address || 'بدون عنوان'}</Text></View><View style={styles.balanceBlock}><Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>{kind === 'customers' ? 'الرصيد' : 'مستحق'}</Text><Text style={[styles.balanceValue, { color: item.balance ? colors.warning : colors.success }]}>{money(item.balance)}</Text></View></View>
        {item.balance > 0 && <PrimaryButton title={kind === 'customers' ? 'تسجيل دفعة' : 'تسجيل سداد'} icon="cash-outline" variant="success" onPress={() => { setPayModal(item.id); setPayAmount(''); }} />}
      </Surface>)}
      {!items.length && <EmptyState icon={icon} title={`لا يوجد ${kind === 'customers' ? 'عملاء' : 'موردون'}`} detail="أضف سجلًا جديدًا ليظهر هنا." />}
    </ScrollView>
    <Modal transparent animationType="slide" visible={modalOpen} onRequestClose={() => setModalOpen(false)}>
      <View style={styles.modalBackdrop}><ScrollView style={[styles.formModal, { backgroundColor: colors.card }]} contentContainerStyle={styles.formModalContent}>
        <View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: colors.foreground }]}>إضافة {kind === 'customers' ? 'عميل' : 'مورد'}</Text><IconButton name="close" accessibilityLabel="إغلاق" onPress={() => setModalOpen(false)} /></View>
        <TextField label="الاسم *" value={name} onChangeText={setName} placeholder="الاسم الكامل أو اسم المنشأة" />
        <TextField label="رقم الهاتف" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="091..." />
        <TextField label="العنوان" value={address} onChangeText={setAddress} placeholder="المدينة / العنوان" />
        <PrimaryButton title="حفظ السجل" icon="checkmark-outline" variant="success" onPress={save} />
      </ScrollView></View>
    </Modal>
    <Modal transparent animationType="slide" visible={!!payModal} onRequestClose={() => setPayModal(null)}>
      <View style={styles.modalBackdrop}><View style={[styles.modalCard, { backgroundColor: colors.card }]}>
        <View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: colors.foreground }]}>{kind === 'customers' ? 'تسجيل دفعة' : 'سداد للمورد'}</Text><IconButton name="close" accessibilityLabel="إغلاق" onPress={() => setPayModal(null)} /></View>
        <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{selectedPerson?.name} — الرصيد الحالي {money(selectedPerson?.balance ?? 0)}</Text>
        <TextField label="المبلغ المدفوع" value={payAmount} onChangeText={setPayAmount} keyboardType="decimal-pad" placeholder="0.00" />
        <PrimaryButton title="تأكيد التسجيل" icon="checkmark-circle-outline" variant="success" onPress={handlePay} />
      </View></View>
    </Modal>
  </View>;
}

// ─── Expenses ─────────────────────────────────────────────────────────────────
function ExpensesScreen() {
  const colors = useColors();
  const { state, addExpense } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const total = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  const save = () => {
    if (!title.trim() || !amount) { Alert.alert('بيانات ناقصة', 'اكتب وصف المصروف وقيمته.'); return; }
    addExpense({ title: title.trim(), amount: Number(amount), category: category.trim() || 'عام' });
    setTitle(''); setAmount(''); setCategory(''); setModalOpen(false);
  };
  return <View style={styles.flex}>
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={[styles.expenseHero, { backgroundColor: colors.primary }]}><View><Text style={styles.expenseLabel}>إجمالي المصروفات المسجلة</Text><Text style={styles.expenseTotal}>{money(total)}</Text></View><View style={styles.expenseHeroIcon}><Ionicons name="wallet-outline" size={28} color={colors.accent} /></View></View>
      <SectionTitle title="الحركات الأخيرة" action="إضافة مصروف" onAction={() => setModalOpen(true)} />
      {state.expenses.map((e) => <Surface key={e.id} style={styles.listCard}><View style={styles.listMain}><View style={[styles.listAvatar, { backgroundColor: `${colors.destructive}18` }]}><Ionicons name="arrow-down-outline" size={21} color={colors.destructive} /></View><View style={styles.rowGrow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{e.title}</Text><Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{e.category} · {formatDate(e.createdAt)}</Text></View><Text style={[styles.expenseAmount, { color: colors.destructive }]}>-{money(e.amount)}</Text></View></Surface>)}
      {!state.expenses.length && <EmptyState icon="wallet-outline" title="لا توجد مصروفات" detail="سجل مصروفات الصندوق لتظهر في التقارير." />}
    </ScrollView>
    <Modal transparent animationType="slide" visible={modalOpen} onRequestClose={() => setModalOpen(false)}>
      <View style={styles.modalBackdrop}><View style={[styles.formModal, { backgroundColor: colors.card }]}>
        <View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: colors.foreground }]}>إضافة مصروف</Text><IconButton name="close" accessibilityLabel="إغلاق" onPress={() => setModalOpen(false)} /></View>
        <TextField label="الوصف *" value={title} onChangeText={setTitle} placeholder="مثال: مصاريف نقل" />
        <TextField label="المبلغ *" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" />
        <TextField label="التصنيف" value={category} onChangeText={setCategory} placeholder="تشغيل" />
        <PrimaryButton title="حفظ المصروف" icon="checkmark-outline" variant="success" onPress={save} />
      </View></View>
    </Modal>
  </View>;
}

// ─── Purchases ────────────────────────────────────────────────────────────────
function PurchasesScreen() {
  const colors = useColors();
  const { state, addPurchase } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [lines, setLines] = useState<PurchaseLine[]>([]);
  const [selProduct, setSelProduct] = useState('');
  const [lineQty, setLineQty] = useState('1');
  const [lineCost, setLineCost] = useState('');
  const [paid, setPaid] = useState('');
  const [query, setQuery] = useState('');
  const total = lines.reduce((sum, l) => sum + l.total, 0);
  const filtered = state.products.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8);

  const addLine = () => {
    const product = state.products.find((p) => p.id === selProduct);
    if (!product || !lineQty || !lineCost) { Alert.alert('بيانات ناقصة', 'اختر منتجًا واملأ الكمية والسعر.'); return; }
    const qty = Number(lineQty); const cost = Number(lineCost);
    setLines((cur) => { const existing = cur.find((l) => l.productId === product.id); if (existing) return cur.map((l) => l.productId === product.id ? { ...l, quantity: l.quantity + qty, total: (l.quantity + qty) * l.unitCost } : l); return [...cur, { productId: product.id, name: product.name, quantity: qty, unitCost: cost, total: qty * cost }]; });
    setSelProduct(''); setLineQty('1'); setLineCost('');
  };
  const save = () => {
    if (!lines.length) { Alert.alert('لا توجد أصناف', 'أضف صنفًا واحدًا على الأقل.'); return; }
    const supplier = state.suppliers.find((s) => s.id === supplierId);
    addPurchase({ supplierId: supplierId || undefined, supplierName: supplier?.name || supplierName || 'غير محدد', items: lines, total, paid: Number(paid) || 0 });
    setLines([]); setPaid(''); setSupplierId(''); setSupplierName(''); setModalOpen(false);
    Alert.alert('✓ تم حفظ المشتريات', 'تم تحديث المخزون وتسجيل فاتورة المشتريات.');
  };

  return <View style={styles.flex}>
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.statGrid}><StatCard icon="bag-add-outline" label="فواتير المشتريات" value={String(state.purchases.length)} /><StatCard icon="business-outline" label="مستحق للموردين" value={money(state.suppliers.reduce((sum, s) => sum + s.balance, 0))} /></View>
      <SectionTitle title="سجل المشتريات" action="فاتورة جديدة" onAction={() => setModalOpen(true)} />
      {state.purchases.length ? state.purchases.map((p) => <Surface key={p.id} style={styles.listCard}><View style={styles.listMain}><View style={[styles.listAvatar, { backgroundColor: `${colors.primary}18` }]}><Ionicons name="bag-add-outline" size={21} color={colors.primary} /></View><View style={styles.rowGrow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{p.invoiceNumber} — {p.supplierName}</Text><Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{formatDate(p.createdAt)} · {p.items.length} أصناف</Text></View><Text style={[styles.saleAmount, { color: colors.foreground }]}>{money(p.total)}</Text></View></Surface>) : <EmptyState icon="bag-add-outline" title="لا توجد مشتريات" detail="أضف فاتورة مشتريات جديدة لتحديث المخزون." />}
    </ScrollView>
    <Modal transparent animationType="slide" visible={modalOpen} onRequestClose={() => setModalOpen(false)}>
      <View style={styles.modalBackdrop}><ScrollView style={[styles.formModal, { backgroundColor: colors.card }]} contentContainerStyle={styles.formModalContent}>
        <View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: colors.foreground }]}>فاتورة مشتريات</Text><IconButton name="close" accessibilityLabel="إغلاق" onPress={() => setModalOpen(false)} /></View>
        <Text style={[styles.fieldCaption, { color: colors.mutedForeground }]}>المورد</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{state.suppliers.map((s) => <Pressable key={s.id} onPress={() => { setSupplierId(s.id); setSupplierName(s.name); }} style={[styles.chip, { backgroundColor: supplierId === s.id ? colors.secondary : colors.card, borderColor: supplierId === s.id ? colors.accent : colors.border }]}><Text style={[styles.chipText, { color: supplierId === s.id ? colors.secondaryForeground : colors.mutedForeground }]}>{s.name}</Text></Pressable>)}</ScrollView>
        {!supplierId && <TextField label="اسم المورد (يدوي)" value={supplierName} onChangeText={setSupplierName} placeholder="اسم المورد إن لم يكن مسجلًا" />}
        <View style={[styles.sectionDiv, { backgroundColor: colors.border }]} />
        <Text style={[styles.fieldCaption, { color: colors.mutedForeground }]}>إضافة صنف</Text>
        <TextField value={query} onChangeText={setQuery} placeholder="ابحث عن منتج..." />
        {query.length > 0 && <Surface>{filtered.map((p) => <Pressable key={p.id} onPress={() => { setSelProduct(p.id); setLineCost(String(p.purchasePrice)); setQuery(''); }} style={({ pressed }) => [styles.productPickRow, pressed && { opacity: 0.7 }]}><Text style={[styles.rowTitle, { color: selProduct === p.id ? colors.accent : colors.foreground }]}>{p.name}</Text><Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>آخر سعر شراء: {money(p.purchasePrice)}</Text></Pressable>)}</Surface>}
        {selProduct ? <View style={styles.formRow}><View style={styles.formHalf}><TextField label="الكمية" value={lineQty} onChangeText={setLineQty} keyboardType="decimal-pad" placeholder="1" /></View><View style={styles.formHalf}><TextField label="سعر التكلفة" value={lineCost} onChangeText={setLineCost} keyboardType="decimal-pad" placeholder="0.00" /></View></View> : null}
        <PrimaryButton title="إضافة الصنف للفاتورة" icon="add-circle-outline" onPress={addLine} />
        {lines.length > 0 && <><View style={[styles.sectionDiv, { backgroundColor: colors.border }]} /><SectionTitle title={`الأصناف (${lines.length})`} />{lines.map((l) => <View key={l.productId} style={styles.cartLine}><View style={styles.rowGrow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{l.name}</Text><Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{money(l.unitCost)} × {l.quantity}</Text></View><Text style={[styles.cartLineTotal, { color: colors.foreground }]}>{money(l.total)}</Text><IconButton name="trash-outline" accessibilityLabel="حذف" color={colors.destructive} size={18} onPress={() => setLines((cur) => cur.filter((x) => x.productId !== l.productId))} /></View>)}<Text style={[styles.totalLine, { color: colors.foreground }]}>الإجمالي: {money(total)}</Text><TextField label="المبلغ المدفوع (0 = آجل كامل)" value={paid} onChangeText={setPaid} keyboardType="decimal-pad" placeholder={total.toFixed(2)} /><PrimaryButton title="حفظ فاتورة المشتريات" icon="checkmark-circle-outline" variant="success" onPress={save} /></>}
      </ScrollView></View>
    </Modal>
  </View>;
}

// ─── Invoices ─────────────────────────────────────────────────────────────────
function InvoicesScreen() {
  const colors = useColors();
  const { state } = useApp();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const filtered = state.sales.filter((s) => `${s.invoiceNumber} ${s.paymentMethod}`.toLowerCase().includes(query.toLowerCase()));
  return <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <TextField value={query} onChangeText={setQuery} placeholder="ابحث برقم الفاتورة أو طريقة الدفع..." style={styles.searchInput} />
    <View style={styles.statGrid}><StatCard icon="receipt-outline" label="إجمالي الفواتير" value={String(state.sales.length)} /><StatCard icon="trending-up-outline" label="إجمالي المبيعات" value={money(state.sales.reduce((sum, s) => sum + s.total, 0))} /></View>
    {filtered.map((sale) => {
      const customer = state.customers.find((c) => c.id === sale.customerId);
      const isOpen = expanded === sale.id;
      return <Surface key={sale.id} style={styles.listCard}>
        <Pressable onPress={() => setExpanded(isOpen ? null : sale.id)} style={styles.listMain}>
          <View style={[styles.listAvatar, { backgroundColor: sale.returned ? `${colors.destructive}18` : colors.secondary }]}><Ionicons name="receipt-outline" size={21} color={sale.returned ? colors.destructive : colors.secondaryForeground} /></View>
          <View style={styles.rowGrow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{sale.invoiceNumber}{sale.returned ? ' — مرتجع' : ''}</Text><Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{formatDate(sale.createdAt)} · {sale.paymentMethod}{customer ? ` · ${customer.name}` : ''}</Text></View>
          <View style={{ alignItems: 'flex-end' }}><Text style={[styles.saleAmount, { color: colors.foreground }]}>{money(sale.total)}</Text><Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={14} color={colors.mutedForeground} /></View>
        </Pressable>
        {isOpen && <View style={[styles.invoiceDetails, { borderTopColor: colors.border }]}>
          <View style={[styles.invoiceDetailRow, { alignItems: 'center', gap: 8, marginBottom: 6 }]}>
            {state.storeProfile.logoUri ? <Image source={{ uri: state.storeProfile.logoUri }} style={{ width: 30, height: 30, borderRadius: 8 }} contentFit="cover" /> : null}
            <View style={styles.rowGrow}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>{state.storeProfile.storeName || APP_BRAND.name}</Text>
              <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{[state.storeProfile.phone, state.storeProfile.city, state.storeProfile.address].filter(Boolean).join(' · ')}</Text>
            </View>
          </View>
          {sale.items.map((item) => <View key={item.productId} style={styles.invoiceDetailRow}><Text style={[styles.rowGrow, styles.rowSubtitle, { color: colors.foreground }]}>{item.name}</Text><Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{item.quantity} × {money(item.unitPrice)}</Text><Text style={[styles.rowSubtitle, { color: colors.foreground, fontWeight: '800' }]}>{money(item.total)}</Text></View>)}
          {sale.discount > 0 && <View style={styles.invoiceDetailRow}><Text style={[styles.rowGrow, styles.rowSubtitle, { color: colors.mutedForeground }]}>خصم</Text><Text style={[styles.rowSubtitle, { color: colors.destructive }]}>-{money(sale.discount)}</Text></View>}
          <View style={[styles.invoiceDetailRow, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 6, paddingTop: 6 }]}><Text style={[styles.rowGrow, styles.rowTitle, { color: colors.foreground }]}>الإجمالي</Text><Text style={[styles.saleAmount, { color: colors.foreground }]}>{money(sale.total)}</Text></View>
          <View style={styles.invoiceDetailRow}><Text style={[styles.rowGrow, styles.rowSubtitle, { color: colors.mutedForeground }]}>المدفوع</Text><Text style={[styles.rowSubtitle, { color: colors.success }]}>{money(sale.paid)}</Text></View>
          {sale.total - sale.paid > 0 && <View style={styles.invoiceDetailRow}><Text style={[styles.rowGrow, styles.rowSubtitle, { color: colors.mutedForeground }]}>المتبقي (دين)</Text><Text style={[styles.rowSubtitle, { color: colors.warning }]}>{money(sale.total - sale.paid)}</Text></View>}
        </View>}
      </Surface>;
    })}
    {!filtered.length && <EmptyState icon="receipt-outline" title="لا توجد فواتير" detail="ابدأ بتسجيل مبيعات لتظهر هنا." />}
  </ScrollView>;
}

// ─── Returns ──────────────────────────────────────────────────────────────────
function ReturnsScreen() {
  const colors = useColors();
  const { state, addReturn } = useApp();
  const [selSale, setSelSale] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const sale = state.sales.find((s) => s.id === selSale);
  const filteredSales = state.sales.filter((s) => !s.returned && `${s.invoiceNumber}`.toLowerCase().includes(query.toLowerCase()));

  const processReturn = () => {
    if (!sale) return;
    const items = sale.items.flatMap((item) => {
      const qty = Number(quantities[item.productId] || 0);
      if (!qty) return [];
      return [{ productId: item.productId, name: item.name, quantity: qty, unitPrice: item.unitPrice, total: qty * item.unitPrice }];
    });
    if (!items.length) { Alert.alert('لا توجد أصناف', 'حدد كميات للمرتجع.'); return; }
    const total = items.reduce((sum, i) => sum + i.total, 0);
    addReturn({ saleId: sale.id, invoiceRef: sale.invoiceNumber, items, total });
    setSelSale(null); setQuantities({});
    Alert.alert('✓ تم تسجيل المرتجع', 'تم إعادة الكميات للمخزون.');
  };

  return <View style={styles.flex}>
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.statGrid}><StatCard icon="arrow-undo-outline" label="المرتجعات" value={String(state.returns.length)} /><StatCard icon="cash-outline" label="إجمالي المرتجعات" value={money(state.returns.reduce((sum, r) => sum + r.total, 0))} /></View>
      {!selSale ? <>
        <SectionTitle title="اختر فاتورة للمرتجع" />
        <TextField value={query} onChangeText={setQuery} placeholder="ابحث برقم الفاتورة..." style={styles.searchInput} />
        {filteredSales.map((s) => <Pressable key={s.id} onPress={() => setSelSale(s.id)} style={({ pressed }) => [styles.reportRow, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.75 : 1 }]}><View style={[styles.reportIcon, { backgroundColor: colors.secondary }]}><Ionicons name="receipt-outline" size={19} color={colors.secondaryForeground} /></View><View style={styles.rowGrow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{s.invoiceNumber}</Text><Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{formatDateShort(s.createdAt)} · {money(s.total)}</Text></View><Ionicons name="chevron-back" size={18} color={colors.mutedForeground} /></Pressable>)}
        {!filteredSales.length && <EmptyState icon="arrow-undo-outline" title="لا توجد فواتير" detail="أنشئ فواتير مبيعات أولًا لتتمكن من إرجاعها." />}
      </> : <>
        <View style={styles.listMain}><IconButton name="arrow-forward" accessibilityLabel="رجوع" onPress={() => setSelSale(null)} color={colors.primary} /><Text style={[styles.modalTitle, { color: colors.foreground }]}>مرتجع {sale?.invoiceNumber}</Text></View>
        <SectionTitle title="حدد الكميات المرتجعة" />
        {sale?.items.map((item) => <Surface key={item.productId} style={styles.listCard}><View style={styles.listMain}><View style={styles.rowGrow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.name}</Text><Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>كمية الفاتورة: {item.quantity} · {money(item.unitPrice)}</Text></View><View style={{ width: 80 }}><TextInput style={[styles.qtyInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={quantities[item.productId] || ''} onChangeText={(v) => setQuantities((cur) => ({ ...cur, [item.productId]: v }))} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.mutedForeground} textAlign="center" /></View></View></Surface>)}
        <PrimaryButton title="تأكيد المرتجع" icon="arrow-undo-outline" variant="danger" onPress={processReturn} />
      </>}
      {state.returns.length > 0 && <><SectionTitle title="المرتجعات المسجلة" />{state.returns.map((r) => <Surface key={r.id} style={styles.listCard}><View style={styles.listMain}><View style={[styles.listAvatar, { backgroundColor: `${colors.destructive}18` }]}><Ionicons name="arrow-undo-outline" size={21} color={colors.destructive} /></View><View style={styles.rowGrow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{r.returnNumber} — مرتجع {r.invoiceRef}</Text><Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{formatDate(r.createdAt)} · {r.items.length} أصناف</Text></View><Text style={[styles.saleAmount, { color: colors.destructive }]}>{money(r.total)}</Text></View></Surface>)}</>}
    </ScrollView>
  </View>;
}

// ─── Shifts ───────────────────────────────────────────────────────────────────
function ShiftsScreen() {
  const colors = useColors();
  const { state, openShift, closeShift } = useApp();
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [notes, setNotes] = useState('');
  const activeShift = state.shifts.find((s) => s.status === 'open');

  return <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    {activeShift ? <>
      <View style={[styles.shiftActiveBanner, { backgroundColor: `${colors.success}12`, borderColor: `${colors.success}30` }]}>
        <View style={styles.listMain}><View style={[styles.listAvatar, { backgroundColor: `${colors.success}20` }]}><Ionicons name="time-outline" size={22} color={colors.success} /></View><View style={styles.rowGrow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>وردية مفتوحة</Text><Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>منذ {formatDate(activeShift.openedAt)} · {activeShift.user}</Text></View></View>
      </View>
      <View style={styles.statGrid}><StatCard icon="cash-outline" label="رصيد الافتتاح" value={money(activeShift.openingBalance)} /><StatCard icon="trending-up-outline" label="مبيعات الوردية" value={money(activeShift.salesTotal)} /></View>
      <View style={styles.statGrid}><StatCard icon="arrow-up-circle-outline" label="نقدي وارد" value={money(activeShift.cashIn)} /><StatCard icon="arrow-down-circle-outline" label="نقدي صادر" value={money(activeShift.cashOut)} /></View>
      <Surface><Text style={[styles.rowTitle, { color: colors.foreground }]}>الرصيد النقدي المتوقع</Text><Text style={[styles.pageIntroNumber, { color: colors.accent, textAlign: 'right', marginTop: 5 }]}>{money(activeShift.openingBalance + activeShift.cashIn - activeShift.cashOut)}</Text></Surface>
      <SectionTitle title="إغلاق الوردية" />
      <TextField label="الرصيد الختامي الفعلي" value={closingBalance} onChangeText={setClosingBalance} keyboardType="decimal-pad" placeholder="0.00" />
      <TextField label="ملاحظات" value={notes} onChangeText={setNotes} placeholder="ملاحظات الإغلاق (اختياري)" />
      <PrimaryButton title="إغلاق الوردية" icon="stop-circle-outline" variant="danger" onPress={() => Alert.alert('تأكيد إغلاق الوردية', 'لا يمكن التراجع عن هذه العملية.', [{ text: 'إلغاء', style: 'cancel' }, { text: 'إغلاق', style: 'destructive', onPress: () => { closeShift(Number(closingBalance) || 0, notes); setClosingBalance(''); setNotes(''); } }])} />
    </> : <>
      <Surface style={styles.shiftHero}>
        <View style={[styles.shiftIcon, { backgroundColor: colors.secondary }]}><Ionicons name="time-outline" size={28} color={colors.secondaryForeground} /></View>
        <Text style={[styles.shiftTitle, { color: colors.foreground }]}>لا توجد وردية مفتوحة</Text>
        <Text style={[styles.shiftDetail, { color: colors.mutedForeground }]}>افتح وردية جديدة لتتبع رصيد الصندوق وتسويته.</Text>
      </Surface>
      <SectionTitle title="فتح وردية جديدة" />
      <TextField label="الرصيد الافتتاحي" value={openingBalance} onChangeText={setOpeningBalance} keyboardType="decimal-pad" placeholder="0.00" />
      <PrimaryButton title="فتح الوردية" icon="play-outline" variant="success" onPress={() => { openShift(Number(openingBalance) || 0); setOpeningBalance(''); Alert.alert('✓ تم فتح الوردية', 'يمكنك الآن بدء العمل وتسجيل المبيعات.'); }} />
    </>}
    {state.shifts.filter((s) => s.status === 'closed').length > 0 && <><SectionTitle title="الورديات المغلقة" />{state.shifts.filter((s) => s.status === 'closed').map((s) => <Surface key={s.id} style={styles.listCard}><View style={styles.listMain}><View style={[styles.listAvatar, { backgroundColor: colors.secondary }]}><Ionicons name="checkmark-done-outline" size={20} color={colors.secondaryForeground} /></View><View style={styles.rowGrow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{formatDateShort(s.openedAt)}</Text><Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>افتتاح {money(s.openingBalance)} · مبيعات {money(s.salesTotal)}</Text></View><View style={{ alignItems: 'flex-end' }}><Text style={[styles.rowTitle, { color: s.closingBalance! >= (s.expectedBalance ?? 0) ? colors.success : colors.warning }]}>{money(s.closingBalance ?? 0)}</Text><Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>ختامي</Text></View></View>{s.notes ? <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{s.notes}</Text> : null}</Surface>)}</>}
  </ScrollView>;
}

// ─── Reports ──────────────────────────────────────────────────────────────────
function ReportsScreen({ onNavigate }: { onNavigate: (key: ScreenKey) => void }) {
  const colors = useColors();
  const { state } = useApp();
  const sales = state.sales.reduce((sum, s) => sum + s.total, 0);
  const cashCollected = state.sales.reduce((sum, s) => sum + s.paid, 0);
  const costs = state.sales.reduce((sum, s) => sum + s.items.reduce((acc, item) => { const p = state.products.find((x) => x.id === item.productId); return acc + (p?.purchasePrice ?? 0) * item.quantity; }, 0), 0);
  const expenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  const purchases = state.purchases.reduce((sum, p) => sum + p.total, 0);
  const profit = sales - costs - expenses;
  const shareReport = () => Share.share({ message: `تقرير ${state.storeProfile.storeName || APP_BRAND.name}\n${[state.storeProfile.ownerName, state.storeProfile.phone].filter(Boolean).join(' · ')}\n\nإجمالي المبيعات: ${money(sales)}\nالمحصل: ${money(cashCollected)}\nتكلفة البضاعة: ${money(costs)}\nالمصروفات: ${money(expenses)}\nصافي الربح: ${money(profit)}\nالمشتريات: ${money(purchases)}\nعدد الفواتير: ${state.sales.length}\nالمرتجعات: ${state.returns.length}` }).catch(() => undefined);
  return <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <View style={styles.reportHeader}><View><Text style={[styles.reportKicker, { color: colors.mutedForeground }]}>ملخص شامل</Text><Text style={[styles.reportTitle, { color: colors.foreground }]}>أداء المنظومة</Text></View><IconButton name="share-social-outline" accessibilityLabel="مشاركة التقرير" color={colors.accent} onPress={shareReport} /></View>
    <View style={styles.reportGrid}><ReportMetric label="المبيعات" value={money(sales)} icon="trending-up-outline" tone="green" /><ReportMetric label="صافي الربح" value={money(profit)} icon="stats-chart-outline" tone="navy" /><ReportMetric label="المحصل" value={money(cashCollected)} icon="cash-outline" tone="gold" /><ReportMetric label="المشتريات" value={money(purchases)} icon="bag-add-outline" tone="red" /></View>
    <SectionTitle title="تقارير تفصيلية" />
    {[{ label: 'سجل الفواتير', key: 'invoices' as ScreenKey, icon: 'receipt-outline' }, { label: 'المشتريات', key: 'purchases' as ScreenKey, icon: 'bag-add-outline' }, { label: 'المرتجعات', key: 'returns' as ScreenKey, icon: 'arrow-undo-outline' }, { label: 'سجل العمليات', key: 'audit' as ScreenKey, icon: 'list-outline' }, { label: 'الورديات', key: 'shifts' as ScreenKey, icon: 'time-outline' }].map((item) => <Pressable key={item.key} onPress={() => onNavigate(item.key)} style={({ pressed }) => [styles.reportRow, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.75 : 1 }]}><View style={[styles.reportIcon, { backgroundColor: colors.secondary }]}><Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={19} color={colors.secondaryForeground} /></View><Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.label}</Text><Ionicons name="chevron-back" size={18} color={colors.mutedForeground} /></Pressable>)}
  </ScrollView>;
}

function ReportMetric({ label, value, icon, tone }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; tone: 'green' | 'navy' | 'gold' | 'red' }) {
  const colors = useColors();
  const palette = { green: colors.success, navy: colors.primary, gold: colors.gold, red: colors.destructive };
  return <Surface style={styles.reportMetric}><View style={[styles.reportMetricIcon, { backgroundColor: `${palette[tone]}18` }]}><Ionicons name={icon} size={19} color={palette[tone]} /></View><Text style={[styles.reportMetricLabel, { color: colors.mutedForeground }]}>{label}</Text><Text style={[styles.reportMetricValue, { color: colors.foreground }]}>{value}</Text></Surface>;
}

// ─── Audit Log ────────────────────────────────────────────────────────────────
function AuditScreen() {
  const colors = useColors();
  const { state } = useApp();
  const [filter, setFilter] = useState('');
  const filtered = state.audit.filter((e) => `${e.action} ${e.detail} ${e.user}`.toLowerCase().includes(filter.toLowerCase()));
  const actionColors: Record<string, string> = { 'تسجيل دخول': colors.success, 'بيع': colors.accent, 'مشتريات': colors.primary, 'مرتجع': colors.destructive, 'مصروف': colors.warning, 'تحصيل دين': colors.gold, 'سداد لمورد': colors.mutedForeground };
  return <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <TextField value={filter} onChangeText={setFilter} placeholder="ابحث في السجل..." style={styles.searchInput} />
    <View style={[styles.auditSummary, { backgroundColor: colors.secondary, borderColor: colors.border }]}><Text style={[styles.summaryNumber, { color: colors.foreground }]}>{state.audit.length}</Text><Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>عملية مسجلة</Text></View>
    {filtered.length ? filtered.map((entry) => <Surface key={entry.id} style={styles.auditRow}>
      <View style={[styles.auditDot, { backgroundColor: actionColors[entry.action] ?? colors.mutedForeground }]} />
      <View style={styles.rowGrow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{entry.action}</Text><Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{entry.detail}</Text><Text style={[styles.auditTime, { color: colors.mutedForeground }]}>{formatDate(entry.createdAt)} · {entry.user}</Text></View>
    </Surface>) : <EmptyState icon="list-outline" title="لا توجد عمليات" detail="ستظهر هنا كل العمليات المسجلة في النظام." />}
  </ScrollView>;
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function SettingsScreen() {
  const colors = useColors();
  const { state, setTheme, setUsdRate, shareBackupText, logout, updateStoreProfile } = useApp();
  const [rate, setRate] = useState(String(state.usdRate));
  const [mode, setMode] = useState<ThemeMode>(state.themeMode);
  const [theme, setThemeName] = useState<ThemeName>(state.themeName);
  const [profile, setProfile] = useState<StoreProfile>(state.storeProfile);
  const setP = (key: keyof StoreProfile) => (value: string) => setProfile((p) => ({ ...p, [key]: value }));
  const saveRate = () => { const n = Number(rate); if (!n) { Alert.alert('قيمة غير صحيحة', 'أدخل سعر الدولار.'); return; } setUsdRate(n); Alert.alert('تم الحفظ', 'تم تحديث سعر الدولار.'); };
  const backup = () => Share.share({ message: shareBackupText() }).catch(() => undefined);
  const pickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled && result.assets[0]) { setProfile((p) => ({ ...p, logoUri: result.assets[0].uri })); updateStoreProfile({ logoUri: result.assets[0].uri }); }
  };
  const saveProfile = () => {
    if (!profile.storeName.trim() || !profile.ownerName.trim() || !profile.phone.trim()) { Alert.alert('بيانات ناقصة', 'اسم النشاط واسم المالك ورقم الهاتف مطلوبة.'); return; }
    updateStoreProfile(profile);
    Alert.alert('تم الحفظ', 'تم تحديث بيانات المتجر.');
  };
  return <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <Surface>
      <SectionTitle title="بيانات المتجر" />
      <Text style={[styles.fieldCaption, { color: colors.mutedForeground }]}>تظهر في الفواتير والتقارير. اسم البرنامج «{APP_BRAND.name}» ثابت ولا يتأثر بهذه البيانات.</Text>
      <TextField label="اسم النشاط / المتجر *" value={profile.storeName} onChangeText={setP('storeName')} placeholder="اسم متجرك" />
      <TextField label="اسم المالك *" value={profile.ownerName} onChangeText={setP('ownerName')} placeholder="الاسم الكامل" />
      <TextField label="رقم الهاتف *" value={profile.phone} onChangeText={setP('phone')} keyboardType="phone-pad" placeholder="09x xxx xxxx" />
      <TextField label="رقم واتساب" value={profile.whatsapp} onChangeText={setP('whatsapp')} keyboardType="phone-pad" placeholder="اختياري" />
      <TextField label="المدينة" value={profile.city} onChangeText={setP('city')} placeholder="المدينة" />
      <TextField label="العنوان" value={profile.address} onChangeText={setP('address')} placeholder="الشارع / المنطقة" />
      <TextField label="نوع النشاط" value={profile.activityType} onChangeText={setP('activityType')} placeholder="مثال: قطع غيار" />
      <TextField label="البريد الإلكتروني" value={profile.email} onChangeText={setP('email')} keyboardType="email-address" autoCapitalize="none" placeholder="اختياري" />
      <Pressable onPress={pickLogo} style={[styles.settingRow, { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12 }]}>
        {profile.logoUri
          ? <Image source={{ uri: profile.logoUri }} style={{ width: 44, height: 44, borderRadius: 10 }} contentFit="cover" />
          : <View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}><Ionicons name="image-outline" size={20} color={colors.secondaryForeground} /></View>}
        <View style={styles.rowGrow}>
          <Text style={[styles.rowTitle, { color: colors.foreground }]}>شعار المتجر</Text>
          <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{profile.logoUri ? 'اضغط للتغيير' : 'اختياري — يظهر في فواتيرك فقط'}</Text>
        </View>
      </Pressable>
      <PrimaryButton title="حفظ بيانات المتجر" icon="save-outline" onPress={saveProfile} />
    </Surface>
    <Surface>
      <SectionTitle title="المظهر" />
      <Text style={[styles.fieldCaption, { color: colors.mutedForeground }]}>الوضع</Text>
      <View style={styles.settingOptions}>{(['system', 'light', 'dark'] as ThemeMode[]).map((item) => <Pressable key={item} onPress={() => { setMode(item); setTheme(item, theme); }} style={[styles.settingOption, { backgroundColor: mode === item ? colors.secondary : colors.background, borderColor: mode === item ? colors.accent : colors.border }]}><Ionicons name={item === 'system' ? 'phone-portrait-outline' : item === 'light' ? 'sunny-outline' : 'moon-outline'} size={18} color={mode === item ? colors.secondaryForeground : colors.mutedForeground} /><Text style={[styles.settingText, { color: mode === item ? colors.secondaryForeground : colors.foreground }]}>{item === 'system' ? 'تلقائي' : item === 'light' ? 'فاتح' : 'مظلم'}</Text></Pressable>)}</View>
      <Text style={[styles.fieldCaption, { color: colors.mutedForeground }]}>النمط</Text>
      <View style={styles.settingOptions}>{(['classic', 'mint', 'midnight'] as ThemeName[]).map((item) => <Pressable key={item} onPress={() => { setThemeName(item); setTheme(mode, item); }} style={[styles.themeChoice, { borderColor: theme === item ? colors.accent : colors.border }]}><View style={[styles.themeSwatch, { backgroundColor: item === 'classic' ? colors.primary : item === 'mint' ? colors.success : '#0D1B2A' }]} /><Text style={[styles.settingText, { color: colors.foreground }]}>{item === 'classic' ? 'كلاسيكي' : item === 'mint' ? 'نعناع' : 'ليلي'}</Text></Pressable>)}</View>
    </Surface>
    <Surface>
      <SectionTitle title="التسعير" />
      <TextField label="سعر الدولار الحالي" value={rate} onChangeText={setRate} keyboardType="decimal-pad" placeholder="4.85" />
      <PrimaryButton title="حفظ سعر الدولار" icon="save-outline" onPress={saveRate} />
    </Surface>
    <Surface>
      <SectionTitle title="البيانات والحماية" />
      <SettingRow icon="cloud-download-outline" title="نسخة احتياطية محلية" detail="مشاركة نسخة JSON من بياناتك" onPress={backup} />
      <SettingRow icon="information-circle-outline" title="عن المنظومة" detail={`الإصدار ${APP_BRAND.version} — محلي · بدون إنترنت`} onPress={() => Alert.alert(APP_BRAND.name, `إصدار ${APP_BRAND.version}\nتطبيق محلي لإدارة المبيعات والمخزون والعملاء والمصروفات والورديات.`)} />
    </Surface>
    <PrimaryButton title="تسجيل الخروج" icon="log-out-outline" variant="danger" onPress={() => Alert.alert('تسجيل الخروج', 'هل تريد إنهاء الجلسة الحالية؟', [{ text: 'إلغاء', style: 'cancel' }, { text: 'خروج', style: 'destructive', onPress: logout }])} />
  </ScrollView>;
}

function SettingRow({ icon, title, detail, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; detail: string; onPress: () => void }) {
  const colors = useColors();
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.settingRow, pressed && { opacity: 0.7 }]}><View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}><Ionicons name={icon} size={20} color={colors.secondaryForeground} /></View><View style={styles.rowGrow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{detail}</Text></View><Ionicons name="chevron-back" size={18} color={colors.mutedForeground} /></Pressable>;
}

// ─── Users ────────────────────────────────────────────────────────────────────
function UsersScreen() {
  const colors = useColors();
  const { state } = useApp();
  return <ScrollView contentContainerStyle={styles.scrollContent}>
    <Surface><View style={styles.listMain}><View style={[styles.listAvatar, { backgroundColor: colors.secondary }]}><Ionicons name="shield-checkmark-outline" size={22} color={colors.secondaryForeground} /></View><View style={styles.rowGrow}><Text style={[styles.rowTitle, { color: colors.foreground }]}>admin</Text><Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>مدير عام · كل الصلاحيات</Text></View><Pill label="نشط" tone="success" /></View></Surface>
    <SectionTitle title="الصلاحيات المدعومة" />
    <View style={styles.permissionGrid}>{['المبيعات', 'المنتجات', 'المخزون', 'العملاء', 'الموردون', 'المشتريات', 'المرتجعات', 'التقارير', 'المصروفات', 'الورديات', 'الإعدادات', 'سجل العمليات'].map((item) => <View key={item} style={[styles.permissionChip, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="checkmark-circle" size={15} color={colors.success} /><Text style={[styles.permissionText, { color: colors.foreground }]}>{item}</Text></View>)}</View>
    <Surface><Text style={[styles.rowTitle, { color: colors.foreground }]}>سجل النشاط</Text><Text style={[styles.rowSubtitle, { color: colors.mutedForeground, marginTop: 5 }]}>{state.audit.length} عملية محفوظة محليًا مع اسم المستخدم والوقت.</Text></Surface>
  </ScrollView>;
}

// ─── More Menu ────────────────────────────────────────────────────────────────
function MoreMenu({ onNavigate, onClose }: { onNavigate: (key: ScreenKey) => void; onClose: () => void }) {
  const colors = useColors();
  const items: { key: ScreenKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'customers', label: 'العملاء', icon: 'people-outline' },
    { key: 'suppliers', label: 'الموردون', icon: 'business-outline' },
    { key: 'purchases', label: 'المشتريات', icon: 'bag-add-outline' },
    { key: 'invoices', label: 'الفواتير', icon: 'receipt-outline' },
    { key: 'returns', label: 'المرتجعات', icon: 'arrow-undo-outline' },
    { key: 'expenses', label: 'المصروفات', icon: 'wallet-outline' },
    { key: 'shifts', label: 'الورديات', icon: 'time-outline' },
    { key: 'reports', label: 'التقارير', icon: 'bar-chart-outline' },
    { key: 'audit', label: 'سجل العمليات', icon: 'list-outline' },
    { key: 'users', label: 'المستخدمون', icon: 'shield-checkmark-outline' },
    { key: 'settings', label: 'الإعدادات', icon: 'settings-outline' },
  ];
  return <Pressable style={styles.moreOverlay} onPress={onClose}>
    <View style={[styles.morePanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {items.map((item) => <Pressable key={item.key} onPress={() => onNavigate(item.key)} style={({ pressed }) => [styles.moreItem, pressed && { opacity: 0.7 }]}>
        <View style={[styles.moreItemIcon, { backgroundColor: colors.secondary }]}><Ionicons name={item.icon} size={19} color={colors.secondaryForeground} /></View>
        <Text style={[styles.moreItemText, { color: colors.foreground }]}>{item.label}</Text>
      </Pressable>)}
    </View>
  </Pressable>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 130, gap: 16 },
  topBar: { minHeight: 76, paddingHorizontal: 17, paddingTop: 8, paddingBottom: 10, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  topEyebrow: { fontSize: 12, fontWeight: '600', textAlign: 'right' },
  topTitle: { fontSize: 24, fontWeight: '800', textAlign: 'right', marginTop: 3 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  clock: { fontSize: 12, fontWeight: '800', marginRight: 4 },
  shiftBadge: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 3 },
  shiftBadgeText: { fontSize: 10, fontWeight: '800' },
  avatar: { width: 37, height: 37, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
  avatarText: { fontSize: 16, fontWeight: '800' },
  bottomBar: { minHeight: 74, borderTopWidth: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-around', paddingTop: 7 },
  bottomItem: { alignItems: 'center', justifyContent: 'center', minWidth: 68, gap: 2 },
  bottomIcon: { width: 37, height: 31, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bottomLabel: { fontSize: 11, fontWeight: '700' },
  welcomeCard: { minHeight: 158, borderRadius: 24, padding: 20, overflow: 'hidden', flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  welcomeSmall: { color: 'rgba(255,255,255,0.68)', textAlign: 'right', fontSize: 13, fontWeight: '700' },
  welcomeTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', textAlign: 'right', marginTop: 9 },
  welcomeMeta: { color: 'rgba(255,255,255,0.68)', textAlign: 'right', marginTop: 11, fontSize: 12 },
  welcomeOrnament: { width: 83, height: 83, borderRadius: 30, backgroundColor: 'rgba(19,184,122,0.14)', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }] },
  orbit: { position: 'absolute', width: 120, height: 42, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(19,184,122,0.25)', transform: [{ rotate: '35deg' }] },
  shiftBanner: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 9 },
  shiftBannerText: { fontSize: 12, fontWeight: '700', flex: 1, textAlign: 'right' },
  statGrid: { flexDirection: 'row-reverse', gap: 10 },
  quickGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  quickAction: { width: '48%', minHeight: 83, borderRadius: 18, borderWidth: 1, padding: 12, flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  quickIcon: { width: 39, height: 39, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 13, fontWeight: '800', flexShrink: 1, textAlign: 'right' },
  alertRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingVertical: 9 },
  alertIcon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rowGrow: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 14, fontWeight: '800', textAlign: 'right' },
  rowSubtitle: { fontSize: 12, textAlign: 'right', lineHeight: 18 },
  goodState: { alignItems: 'center', flexDirection: 'row-reverse', justifyContent: 'center', gap: 8, paddingVertical: 17 },
  goodText: { fontSize: 13, fontWeight: '700' },
  saleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingVertical: 9 },
  invoiceIcon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  saleAmount: { fontSize: 13, fontWeight: '800' },
  loginRoot: { flex: 1, alignItems: 'center', paddingHorizontal: 22, overflow: 'hidden' },
  loginGlowOne: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(19,184,122,0.12)', top: -90, right: -100 },
  loginGlowTwo: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(212,168,78,0.09)', bottom: 80, left: -110 },
  loginBrand: { alignItems: 'center', marginTop: 34, marginBottom: 26 },
  logoMark: { width: 69, height: 69, borderRadius: 24, backgroundColor: 'rgba(19,184,122,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(19,184,122,0.35)' },
  loginTitle: { color: '#FFFFFF', fontSize: 29, fontWeight: '900', marginTop: 15 },
  loginSubtitle: { color: 'rgba(255,255,255,0.68)', fontSize: 14, marginTop: 5 },
  loginCard: { width: '100%', maxWidth: 440, borderRadius: 25, padding: 21, gap: 14 },
  loginCardTitle: { fontSize: 22, fontWeight: '900', textAlign: 'right' },
  loginCardHint: { fontSize: 13, textAlign: 'right', lineHeight: 21, marginTop: -7 },
  loginMessage: { textAlign: 'center', fontSize: 13, fontWeight: '700' },
  demoHint: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: -3 },
  demoHintText: { fontSize: 11, fontWeight: '600' },
  loginFooter: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 22 },
  posContent: { padding: 16, paddingBottom: 130, gap: 14 },
  posSearchRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7 },
  searchInput: { flex: 1 },
  chips: { flexDirection: 'row-reverse', gap: 8, paddingVertical: 2 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 50, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '800' },
  productGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  productTile: { width: '48%', minHeight: 193, borderRadius: 18, borderWidth: 1, padding: 11, gap: 6 },
  productThumb: { height: 72, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  productName: { fontSize: 13, fontWeight: '800', textAlign: 'right', minHeight: 35 },
  productCode: { fontSize: 11, textAlign: 'right' },
  productBottom: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', gap: 3 },
  productPrice: { fontSize: 12, fontWeight: '900', flexShrink: 1 },
  cartLine: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 9, gap: 7, borderBottomWidth: 1, borderBottomColor: 'rgba(113,128,150,0.12)' },
  cartQtyRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cartQtyText: { fontSize: 15, fontWeight: '900', minWidth: 24, textAlign: 'center' },
  cartLineTotal: { fontSize: 12, fontWeight: '800', minWidth: 64, textAlign: 'left' },
  cartDock: { position: 'absolute', bottom: 0, left: 0, right: 0, minHeight: 94, borderTopWidth: 1, padding: 13, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cartLabel: { fontSize: 11, textAlign: 'right' },
  cartTotal: { fontSize: 20, fontWeight: '900', textAlign: 'right', marginTop: 3 },
  cartActions: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, flexShrink: 1 },
  cartCount: { fontSize: 11, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(5,12,28,0.56)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 15 },
  formModal: { maxHeight: '92%', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  formModalContent: { padding: 20, gap: 15, paddingBottom: 30 },
  modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: '900', textAlign: 'right' },
  modalSummary: { fontSize: 14, textAlign: 'right' },
  modalSummaryStrong: { fontWeight: '900', fontSize: 18 },
  fieldCaption: { fontSize: 13, fontWeight: '800', textAlign: 'right' },
  paymentOptions: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  paymentOption: { flexGrow: 1, minWidth: '46%', borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7 },
  paymentText: { fontSize: 13, fontWeight: '800' },
  creditHint: { fontSize: 13, textAlign: 'right', lineHeight: 21 },
  toolbar: { flexDirection: 'row-reverse', alignItems: 'center', gap: 9 },
  toolbarSearch: { flex: 1 },
  roundAction: { width: 47, height: 47, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  productSummary: { borderRadius: 18, padding: 15, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-around', backgroundColor: 'rgba(19,184,122,0.08)' },
  summaryNumber: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  summaryLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center', marginHorizontal: 3 },
  summaryDivider: { width: 1, height: 36 },
  listCard: { padding: 13, gap: 12 },
  listMain: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  listAvatar: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  productMeta: { flexDirection: 'row-reverse', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(113,128,150,0.14)', paddingTop: 10 },
  metaText: { fontSize: 11, textAlign: 'right' },
  metaStrong: { fontWeight: '900' },
  lowNumber: { fontSize: 18, fontWeight: '900' },
  inventoryRow: { minHeight: 57, flexDirection: 'row-reverse', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(113,128,150,0.13)', gap: 10 },
  inventoryStock: { fontSize: 17, fontWeight: '900' },
  stockUnit: { fontSize: 10, fontWeight: '600' },
  pageIntro: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  pageIntroNumber: { fontSize: 28, fontWeight: '900', textAlign: 'right' },
  pageIntroLabel: { fontSize: 12, textAlign: 'right' },
  balanceBlock: { alignItems: 'flex-end', gap: 3 },
  balanceLabel: { fontSize: 10 },
  balanceValue: { fontSize: 12, fontWeight: '900' },
  expenseHero: { minHeight: 124, borderRadius: 22, padding: 19, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  expenseLabel: { color: 'rgba(255,255,255,0.68)', fontSize: 13, textAlign: 'right' },
  expenseTotal: { color: '#FFFFFF', fontSize: 27, fontWeight: '900', textAlign: 'right', marginTop: 8 },
  expenseHeroIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(19,184,122,0.16)' },
  expenseAmount: { fontSize: 12, fontWeight: '900' },
  formRow: { flexDirection: 'row-reverse', gap: 10 },
  formHalf: { flex: 1 },
  sectionDiv: { height: 1, marginVertical: 4 },
  productPickRow: { paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(113,128,150,0.12)' },
  totalLine: { fontSize: 16, fontWeight: '900', textAlign: 'right' },
  invoiceDetails: { borderTopWidth: 1, paddingTop: 10, gap: 6 },
  invoiceDetailRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  qtyInput: { borderWidth: 1, borderRadius: 12, height: 42, fontSize: 16, fontWeight: '800' },
  shiftActiveBanner: { borderRadius: 17, borderWidth: 1, padding: 14 },
  shiftHero: { alignItems: 'center', gap: 11, paddingVertical: 27 },
  shiftIcon: { width: 65, height: 65, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  shiftTitle: { fontSize: 20, fontWeight: '900' },
  shiftDetail: { fontSize: 13, lineHeight: 21, textAlign: 'center' },
  reportHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  reportKicker: { fontSize: 12, textAlign: 'right' },
  reportTitle: { fontSize: 26, fontWeight: '900', textAlign: 'right', marginTop: 3 },
  reportGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  reportMetric: { width: '48%', minHeight: 126, gap: 8 },
  reportMetricIcon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  reportMetricLabel: { fontSize: 12, fontWeight: '700', textAlign: 'right' },
  reportMetricValue: { fontSize: 16, fontWeight: '900', textAlign: 'right' },
  reportRow: { minHeight: 62, borderRadius: 17, borderWidth: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: 11, paddingHorizontal: 13 },
  reportIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  auditSummary: { borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  auditRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10, padding: 12 },
  auditDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5, flexShrink: 0 },
  auditTime: { fontSize: 10, textAlign: 'right', marginTop: 2 },
  settingOptions: { flexDirection: 'row-reverse', gap: 8, marginBottom: 16 },
  settingOption: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 14, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 5 },
  settingText: { fontSize: 12, fontWeight: '800' },
  themeChoice: { flex: 1, minHeight: 58, borderWidth: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 5 },
  themeSwatch: { width: 30, height: 16, borderRadius: 8 },
  settingRow: { minHeight: 62, flexDirection: 'row-reverse', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(113,128,150,0.13)' },
  settingIcon: { width: 39, height: 39, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  permissionGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  permissionChip: { width: '48%', minHeight: 43, borderRadius: 14, borderWidth: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 11 },
  permissionText: { fontSize: 12, fontWeight: '700' },
  moreOverlay: { position: 'absolute', top: 0, right: 0, bottom: 74, left: 0, backgroundColor: 'rgba(5,12,28,0.12)', justifyContent: 'flex-end' },
  morePanel: { margin: 12, borderRadius: 22, borderWidth: 1, padding: 10, flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 7, elevation: 10, shadowColor: '#08142E', shadowOpacity: 0.2, shadowRadius: 15, shadowOffset: { width: 0, height: 4 } },
  moreItem: { width: '30%', minHeight: 72, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 5, padding: 6 },
  moreItemIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  moreItemText: { fontSize: 11, fontWeight: '800', textAlign: 'center' },
  // Camera
  cameraRoot: { flex: 1 },
  cameraPermission: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 },
  cameraTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center' },
  cameraDetail: { fontSize: 13, lineHeight: 21, textAlign: 'center' },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 52 },
  cameraTop: { width: '100%', flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
  cameraTopTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  scanFrame: { width: 240, height: 240, position: 'relative' },
  scanCornerTL: { position: 'absolute', top: 0, left: 0, width: 32, height: 32, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#13B87A', borderTopLeftRadius: 6 },
  scanCornerTR: { position: 'absolute', top: 0, right: 0, width: 32, height: 32, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#13B87A', borderTopRightRadius: 6 },
  scanCornerBL: { position: 'absolute', bottom: 0, left: 0, width: 32, height: 32, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#13B87A', borderBottomLeftRadius: 6 },
  scanCornerBR: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#13B87A', borderBottomRightRadius: 6 },
  scanHint: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '700' },
  stepRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, minHeight: 50 },
  stepNumber: { width: 33, height: 33, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontSize: 13, fontWeight: '900' },
});
