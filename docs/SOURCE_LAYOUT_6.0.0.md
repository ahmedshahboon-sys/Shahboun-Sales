# Shahboun Suite 6.0.0 source layout

- `apps/android-current/` — complete Android source baseline copied from the existing repository tree for continuity.
- `apps/android-sales/` — Suite 6 Android overlay/new architecture (Host bridge, embedded web client, unified versioning). This directory is progressively replacing the legacy baseline.
- `server/` — shared Windows/Web host services and unified licensing.
- `windows/installer/` — self-contained Windows installer/bootstrap scripts.
- `shared/` — common contracts, versioning, localization and branding.

Generated APK/EXE outputs are not committed to source folders. CI artifacts/releases are the distribution channel.
