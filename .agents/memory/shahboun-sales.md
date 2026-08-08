---
name: Shahboun Sales App
description: Key decisions and quirks for the منظومة شهبون للمبيعات Expo app.
---

## Architecture
- Single `app/(tabs)/index.tsx` holds ALL screens (login, dashboard, POS, products, inventory, customers, suppliers, purchases, invoices, returns, shifts, expenses, reports, audit, settings, users).
- `context/AppContext.tsx` is the sole state store; persisted to AsyncStorage under key `@shahboun_sales_state_v2`.
- Storage key was bumped from v1 → v2 when Purchase/Return/Shift types were added; old v1 data will be lost on upgrade (by design — seed data covers demo use).

**Why:** Monolithic file avoids cross-file import complexity in Expo Router; state in one context avoids prop drilling across 15 screens.

## expo-camera
- Must use `expo-camera@~17.0.10` (not 16.x) to match current Expo SDK. Version 16 causes Metro _tmp_ folder watch errors.
- `CameraView` + `useCameraPermissions` from `expo-camera` — NOT the old `Camera` class.

**Why:** Expo SDK upgrades broke the older API; pinning to ~17.0.10 resolved Metro startup issues.

## State Design
- `AppState.version` is currently `2`.
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
