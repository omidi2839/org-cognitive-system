# Hotfix 0.9.1.8 — Persistence Visibility + Visual Hierarchy + Document Preview

## 1) ماندگاری اسناد

کد فعلی Repository فقط در صورت وجود `DATABASE_URL` از PostgreSQL استفاده می‌کند.
اگر این متغیر برای Environment جاری Vercel وجود نداشته باشد، Runtime به `ephemeral-memory` برمی‌گردد و پاک شدن داده بعد از Deploy/Cold Start طبیعی است، ولی برای محصول قابل قبول نیست.

این Hotfix در بانک اسناد وضعیت Runtime را از `/api/v1/health/ready` می‌خواند:
- PostgreSQL → پیام سبز «ذخیره‌سازی پایدار فعال است»
- ephemeral-memory → هشدار نارنجی

### تنظیم لازم در Vercel
در Project Settings > Environment Variables:
- `DATABASE_URL` باید برای همان Environment که تست می‌کنید فعال باشد (Preview و/یا Production).
- اگر فایل‌های اصلی نیز باید پایدار بمانند، Storage Provider پایدار پروژه نیز باید در همان Environment تنظیم باشد.
- پس از افزودن/اصلاح Environment Variable حتماً Redeploy انجام شود.

نکته: Hotfix نمی‌تواند مقدار واقعی DATABASE_URL حساب Vercel شما را از داخل Repository ایجاد کند؛ آن مقدار یک Secret محیطی است.

## 2) اصلاح بصری نتایج
کارت سند دو لایه شده:
- عنوان و Badgeها: سفید
- اطلاعات زیر عنوان، مرجع و snippetها: پس‌زمینه خاکستری-آبی ملایم
این تغییر یکنواختی بصری را کاهش می‌دهد.

## 3) مشاهده متن کامل سند
یک Endpoint جدید برای جزئیات سند اضافه می‌شود:
`GET /api/v1/knowledge/document-bank/:documentId`

عنوان سند و دکمه «مشاهده سند» قابل کلیک‌اند و Modal باز می‌شود.
Modal شامل:
- عنوان، نوع، مرجع، وضعیت، طبقه‌بندی، تاریخ، نسخه
- متن استخراج‌شده کامل سند
- Highlight عبارت جستجو شده
- اسکرول خودکار به اولین Highlight
- بستن با ×، کلیک بیرون Modal، یا Escape

## فایل‌ها
- api/document-bank-core.js
- public/document-bank-091.js
- public/document-bank-091.css
- PATCH_API_INDEX_0.9.1.8.js.txt

## تغییر api/index.js
دو تغییر کوچک لازم است و در `PATCH_API_INDEX_0.9.1.8.js.txt` آمده است.
