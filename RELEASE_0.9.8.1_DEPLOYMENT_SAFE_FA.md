# نسخه 0.9.8.1 — Deployment Safe

این نسخه برای رفع خطای Deploy نسخه 0.9.8.0 ساخته شده است.

## تفاوت اصلی با 0.9.8.0
دو Function جدید زیر حذف شده‌اند:
- `api/document-governance.js`
- `api/collaborative-analysis.js`

منطق هر دو قابلیت داخل Function موجود `api/knowledge-documents.js` ادغام شده است.
بنابراین Routeهای زیر همچنان کار می‌کنند ولی Function جدیدی به تعداد Serverless Functionها اضافه نمی‌شود:
- `/api/v1/knowledge/document-governance`
- `/api/v1/knowledge/collaborative-analysis`

## قابلیت‌های حفظ‌شده
- تمام اصلاحات 0.9.7.5 مربوط به ماده، تبصره، بند، فیلتر مقدمه/امضاکننده و append/replace در نمای تلفیقی.
- ویرایش کنترل‌شده سند و Audit.
- شمارنده اسناد بالادستی، عمومی و کل بانک اسناد.
- فقط اسناد بالادستی در تحلیل شناختی.
- اسناد عمومی برای Reference/Citation.
- تحلیل مشارکتی چندمرحله‌ای خبرگان V1.

## نکته Deploy
این ZIP کامل است و `public/index.html` و `vercel.json` اصلاح‌شده را نیز دارد.
نیازی به ویرایش دستی فایل‌ها نیست.
