# Build 0.9.0.7 — Isolated Serverless Probe

این Patch هیچ بخشی از موتور شناختی یا Repository را تغییر نمی‌دهد.

دو فایل دارد:
- api/ping.js
- vercel.json

مسیر تست:
GET /diag/ping

این مسیر به یک Serverless Function کاملاً مستقل با صفر import و صفر وابستگی به DB/Storage/AI می‌رود.
اگر /diag/ping نیز FUNCTION_INVOCATION_FAILED بدهد، مشکل از خود Project/Runtime/Deployment configuration است.
اگر /diag/ping پاسخ JSON بدهد، Runtime سالم است و مشکل مشخصاً در api/index.js یا bundling مسیر اصلی است.
