# Build 0.9.0.6 — Cold-Boot Diagnostic Boundary

این نسخه هیچ import از لایه‌های برنامه را در بالای api/index.js ندارد.

هدف:
- اگر Serverless Function به علت import/module-evaluation crash می‌کند، خود /api/v1/health باید همچنان بالا بیاید.
- /api/v1/diagnostics/cold-boot هر import و constructor را یکی‌یکی و داخل try/catch اجرا می‌کند تا دقیقاً اولین مرحله خراب مشخص شود.

پس از Deploy:
1) /api/v1/health
2) /api/v1/diagnostics/cold-boot

اگر Health هم 500 بدهد، مشکل دیگر از کد application imports نیست و باید deployment/runtime configuration بررسی شود.
