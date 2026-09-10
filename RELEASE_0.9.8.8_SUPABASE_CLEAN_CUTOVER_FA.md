# نسخه 0.9.8.8 — Supabase Clean Cutover

این نسخه برای قطع وابستگی عملیاتی سامانه از Neon و اجرای مستقیم آخرین ساختار نرم‌افزار روی PostgreSQL در Supabase آماده شده است. داده‌های قبلی Neon در این مسیر مهاجرت نمی‌شوند و دیتابیس Supabase می‌تواند از وضعیت خالی آغاز شود.

## تغییر اصلی

Repository حالا اتصال دیتابیس را با این اولویت انتخاب می‌کند:

1. `SUPABASE_DATABASE_URL`
2. `DATABASE_URL`
3. حافظه موقت در صورت نبود هر دو

در نتیجه، حتی اگر Neon Integration در Vercel همچنان متغیر `DATABASE_URL` را به‌صورت خودکار مدیریت کند، وجود `SUPABASE_DATABASE_URL` باعث می‌شود برنامه به Supabase متصل شود و Neon در مسیر Runtime استفاده نشود.

## ساختار دیتابیس

`PostgresRepository` همچنان ساختار فشرده `runtime_state_v2` را حفظ می‌کند و در اولین اتصال موفق، جدول موردنیاز و State اولیه را به‌صورت خودکار ایجاد می‌کند. نیازی به ساخت دستی جدول در Supabase نیست.

## تنظیم موردنیاز در Vercel

یک Environment Variable دستی با نام زیر بسازید:

`SUPABASE_DATABASE_URL`

مقدار آن باید URI کامل **Supabase Transaction Pooler** باشد (برای این پروژه پورت 6543). آن را برای Production و Preview فعال کنید و سپس Redeploy انجام دهید.

## درباره Neon و Migration

- متغیرهای خودکار Neon لازم نیست فعلاً حذف یا ویرایش شوند.
- Migration داده Neon برای این Cutover لازم نیست.
- مسیر Migration قدیمی در این بسته صرفاً برای سازگاری باقی مانده ولی Runtime عادی برنامه آن را فراخوانی نمی‌کند.
- پس از تأیید کامل Supabase، می‌توان Cleanup مستقل Neon/Migration را در نسخه بعد انجام داد.

## فایل‌های مهم این نسخه

- `src/infrastructure/repositoryFactory.js` — افزوده‌شده به بسته و دارای اولویت `SUPABASE_DATABASE_URL`.
- `src/infrastructure/postgresRepository.js` — سازگار با همان اولویت برای ساخت مستقیم Repository.
- `public/index.html` — کامل و با cache marker نسخه `0.9.8.8`.
- `vercel.json` — کامل، بدون افزایش تعداد Serverless Functionها.

## آزمون پیشنهادی بعد از Deploy

1. در Console بررسی شود:
   `window.__DOCUMENT_MEETING_COMMAND_BUILD__`
   و
   `window.__DOCUMENT_BANK_BUILD__`
   باید `0.9.8.8` باشند.
2. بانک اسناد باید بدون خطای quota Neon باز شود؛ خالی بودن آن طبیعی است.
3. یک سند آزمایشی ثبت شود.
4. صفحه Refresh شود و ماندگاری سند بررسی شود.
5. در Supabase وجود جدول `runtime_state_v2` بررسی شود.
