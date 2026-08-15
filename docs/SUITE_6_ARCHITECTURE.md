# Shahboun Suite 6.0.0 — Architecture

## Product rule
Shahboun Suite is one product with three deliverables:
1. Windows Host + LAN/Web
2. Android Sales APK (Host or Client)
3. Android Licensing APK (owner-only)

The commercial/business behavior must remain feature-aligned between Web and Android. Platform-only capabilities may differ (Android camera/biometrics vs Windows services/printing).

## Host model
Exactly one primary host exists per store at a time.
- Windows Host: server + database + web UI
- Android Host: local server/database on Android
- Clients: Android app or browser on the same LAN
- iOS/iPadOS/macOS: browser client only

## Licensing
One licensing authority must issue licenses for Windows and Android hosts. Customer browser clients do not each require an independent host license. License payloads must include platform, device/host ID, store identity, validity, device allowance and signature metadata.

## Language and identity
- Arabic and English are unified across all deliverables.
- Arabic is default.
- One official Shahboun logo/brand source is used across Sales, Web, Setup and Licensing.
- UI terminology must be shared and consistent.

## Repository policy
- `suite-6.0.0` is the development branch for Suite 6.
- `main` remains the historical stable reference until Suite 6 is accepted.
- Replit-specific runtime/deployment configuration is not part of Suite 6.
- Source only in Git; generated APK/EXE/ZIP outputs belong in CI artifacts/releases, not source folders.
- Never commit the private licensing signing key.

## Release outputs
A release is not complete until all three deliverables build and pass validation:
- `Shahboun_Server_Setup_<version>.exe`
- `Shahboun_Sales_<version>.apk`
- `Shahboun_Licensing_<version>.apk`

The customer distribution ZIP must contain the three installables plus checksums/readme only; source code is distributed separately for development/backup.