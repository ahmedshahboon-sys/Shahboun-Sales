---
name: Shahboun Sales App
description: Key decisions and quirks for the منظومة شهبون للمبيعات Expo app.
---

## Architecture
- Single `app/(tabs)/index.tsx` holds ALL screens (login, dashboard, POS, products, inventory, customers, suppliers, purchases, invoices, returns, shifts, expenses, reports, audit, settings, users).
- `context/AppContext.tsx` is the sole state store; persisted to AsyncStorage under key `@shahboun_sales_state_v3` (v2 auto-migrates: data kept, `businessName` dropped, setup wizard shown once; migrated state written to v3 key immediately).
- Program identity is fixed in `constants/appInfo.ts` (`APP_BRAND`: name, version, package `com.shahboun.sales`, logo) — single source for the version shown in UI; customer store data lives in `state.storeProfile` (edited in setup wizard + settings), shown in header/invoices/reports.

**Why:** Monolithic file avoids cross-file import complexity in Expo Router; state in one context avoids prop drilling across 15 screens.

## expo-camera
- Must use `expo-camera@~17.0.10` (not 16.x) to match current Expo SDK. Version 16 causes Metro _tmp_ folder watch errors.
- `CameraView` + `useCameraPermissions` from `expo-camera` — NOT the old `Camera` class.

**Why:** Expo SDK upgrades broke the older API; pinning to ~17.0.10 resolved Metro startup issues.

## Gotchas (learned the hard way)
- Root gate must keep rendering `LoginScreen` while `mustChangePassword` is true — otherwise a successful login unmounts the login screen before the forced password-change form can show. `changing` is derived from state, not a local flag.
- `Alert.alert` is a no-op on RN-web: success dialogs won't appear in browser tests but work on Android. Don't fail web e2e tests on missing alerts.
- Commercial build starts empty: no seed/demo data; only admin/admin (forced change on first login).

## State Design
- `AppState.version` is currently `3`.
- Purchases increase stock + update `purchasePrice` on the product.
- Returns restore stock and mark `sale.returned = true`.
- Active shift tracks `cashIn`, `cashOut`, `salesTotal`, `purchasesTotal` — updated automatically on completeSale/addPurchase/addReturn/addExpense calls.
- `collectFromCustomer` and `payToSupplier` reduce balances and increment shift `cashIn`/`cashOut`.

## TypeScript
- Typecheck passes cleanly: `pnpm --filter @workspace/shahboun-sales run typecheck`
- All StyleSheet keys used in JSX must exist in the `styles` object — camera styles (cameraRoot, cameraPermission, etc.) must be kept.

## Pending (not yet implemented)
- PDF invoice generation (A4/thermal)
- Real multi-user accounts (only admin exists)
- License / device binding
- Google Drive / cloud sync
- APK build pipeline (needs EAS or similar cloud builder)
