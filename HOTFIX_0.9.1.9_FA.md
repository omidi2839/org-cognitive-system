# Hotfix 0.9.1.9 — Document Preview Route Fix

## علت «مسیر پیدا نشد»

در نسخه 0.9.1.8، پنجره مشاهده سند از Route جدید زیر استفاده می‌کرد:

`/api/v1/knowledge/document-bank/:documentId`

اما `api/index.js` فعلی شما هنوز آن Route را ثبت نکرده بود؛ بنابراین 404 کاملاً قابل انتظار بود.

## راه‌حل این نسخه

دیگر Route جدیدی اضافه نمی‌کنیم.

پنجره مشاهده سند از همان Route تثبیت‌شده و موجود استفاده می‌کند:

`/api/v1/knowledge/document-bank?documentId=DOC:...&detail=1`

بنابراین:
- نیازی به تغییر `api/index.js` نیست.
- نیازی به تغییر `vercel.json` نیست.
- مشکل 404 جزئیات سند حذف می‌شود.
- مجوز مشاهده سند همچنان از همان `canSee()` عبور می‌کند.
- متن کامل فقط برای همان سند انتخاب‌شده برگردانده می‌شود، نه برای کل نتایج بانک.

## فایل‌های جایگزین

- `api/document-bank-core.js`
- `public/document-bank-091.js`
- `public/document-bank-091.css`

## ماندگاری اطلاعات

هشدار `ephemeral-memory` مستقل از مشکل Route است و صحیح است.

برای نگهداری اسناد بعد از Deploy باید در Vercel همان Project/Environment یک PostgreSQL واقعی متصل شود و Environment Variable زیر وجود داشته باشد:

`DATABASE_URL`

کد فعلی Repository بر اساس وجود همین متغیر بین PostgreSQL و MemoryRepository انتخاب می‌کند.

### در Vercel

1. Project را باز کنید.
2. یک PostgreSQL از Marketplace (برای مثال Provider سازگار با PostgreSQL) متصل کنید یا Connection String PostgreSQL موجود را استفاده کنید.
3. در Settings → Environment Variables مطمئن شوید `DATABASE_URL` وجود دارد.
4. Scope آن را حداقل برای **Preview** فعال کنید؛ اگر Production هم دارید، برای Production نیز فعال شود.
5. Redeploy کنید.
6. بانک اسناد را باز کنید. پیام باید از هشدار نارنجی به:
   `ذخیره‌سازی پایدار فعال است · PostgreSQL`
   تغییر کند.

اگر Integration متغیری با نامی مثل `POSTGRES_URL` یا Provider-specific ایجاد کرد، یک `DATABASE_URL` با همان Connection String بسازید؛ چون Repository فعلی مشخصاً `DATABASE_URL` را می‌خواند.

## تست پذیرش

- بانک اسناد بدون هشدار ماندگاری موقت باز شود.
- یک سند بارگذاری شود.
- Deploy جدید انجام شود.
- سند پس از Deploy همچنان وجود داشته باشد.
- روی «مشاهده سند» کلیک شود.
- Modal بدون 404 باز شود و متن کامل نمایش داده شود.
