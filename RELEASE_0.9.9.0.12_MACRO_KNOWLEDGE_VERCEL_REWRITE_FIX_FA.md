# 0.9.9.0.12 — Macro Knowledge Vercel Rewrite Fix

## علت قطعی خطای «مسیر پیدا نشد»
در 0.9.9.0.10/11 handler مسیر دانش کلان داخل `api/knowledge-documents.js` اضافه شده بود، اما `vercel.json`
rewrite اختصاصی `/api/v1/knowledge/macro-knowledge` را نداشت. در نتیجه درخواست قبل از رسیدن به handler،
توسط rewrite عمومی `/api/v1/:path*` به `api/index.js` می‌رفت و پاسخ «مسیر پیدا نشد» برمی‌گشت.

## اصلاح
rewrite اختصاصی زیر قبل از generic route اضافه شد:
`/api/v1/knowledge/macro-knowledge` → `/api/knowledge-documents.js`

API جدید top-level ایجاد نشده و تعداد APIها همچنان 8 است.
