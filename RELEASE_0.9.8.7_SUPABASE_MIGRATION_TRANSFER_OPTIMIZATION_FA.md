# Release 0.9.8.7 — Supabase Migration & Database Transfer Optimization

این نسخه ادامه مستقیم 0.9.8.6 است و Direct-to-Private-Blob Upload را حفظ می‌کند، اما لایه PostgreSQL را برای کاهش شدید انتقال داده و مهاجرت کنترل‌شده Neon → Supabase اصلاح می‌کند.

## تغییرات اصلی

1. `runtime_state_v2` با `payload_gzip bytea` اضافه شده است.
   - State برنامه قبل از ذخیره با GZIP فشرده می‌شود.
   - اولین دسترسی در صورت وجود `runtime_state` قدیمی، فقط یک‌بار State قدیمی را می‌خواند و نسخه فشرده V2 می‌سازد.
   - جدول قدیمی حذف یا overwrite نمی‌شود و به‌عنوان rollback source باقی می‌ماند.

2. Cache نسخه‌ای داخل هر Function instance اضافه شده است.
   - `all()` ابتدا فقط `version` را می‌خواند.
   - اگر نسخه تغییر نکرده باشد، State از حافظه همان instance بازگردانده می‌شود و payload دوباره از PostgreSQL منتقل نمی‌شود.
   - `DB_POOL_MAX` پیش‌فرض از 5 به 2 کاهش یافته تا با محیط Serverless/Pooler سازگارتر باشد.

3. مهاجرت ایمن Neon → Supabase بدون فایل واسط اضافه شده است.
   - مسیر جدید: `/api/v1/knowledge/database-migration`
   - همان Function موجود `api/knowledge-documents.js` استفاده می‌شود؛ هیچ Function جدیدی اضافه نشده است.
   - متغیرهای موقت لازم:
     - `MIGRATION_TARGET_DATABASE_URL` = Supabase **Session Pooler** URI برای مرحله مهاجرت
     - `MIGRATION_ADMIN_SECRET` = یک secret تصادفی و موقت
   - `action=probe` وضعیت Source/Target را مقایسه می‌کند.
   - `action=copy` فقط اگر Target خالی باشد State را منتقل می‌کند و شمارش داده‌ها را بعد از انتقال صحت‌سنجی می‌کند.

4. ابزار CLI پشتیبان:
   - `scripts/migrate-neon-to-supabase.mjs`
   - با `SOURCE_DATABASE_URL` و `TARGET_DATABASE_URL` اجرا می‌شود.
   - Source فقط یک Snapshot منطقی خوانده می‌شود.

5. Direct Blob Upload نسخه 0.9.8.6 حفظ شده است.
   - Word/PDF مستقیماً از Browser به Vercel Private Blob می‌روند.
   - فایل خام وارد Function payload یا PostgreSQL نمی‌شود.

## ترتیب صحیح مهاجرت

1. Neon را حذف نکنید.
2. این Release را deploy کنید در حالی‌که `DATABASE_URL` هنوز Neon است.
3. در Vercel فقط دو env موقت مهاجرت را اضافه کنید: `MIGRATION_TARGET_DATABASE_URL` و `MIGRATION_ADMIN_SECRET`.
4. وقتی Neon دوباره حداقل یک Read را اجازه داد، ابتدا `probe` و سپس `copy` اجرا شود.
5. بعد از تأیید شمارش اسناد/روابط/تحلیل‌ها، `DATABASE_URL` به Supabase **Transaction Pooler** تغییر کند.
6. envهای موقت مهاجرت حذف شوند.
7. Neon تا پایان تست Production حذف نشود.

## نکته مهم درباره quota فعلی Neon

اگر Neon همچنان خطای `data transfer quota exceeded` بدهد، هیچ نرم‌افزاری نمی‌تواند داده‌ای را که Provider اجازه Read آن را نمی‌دهد استخراج کند. این نسخه باعث می‌شود به محض بازشدن quota، انتقال با یک Snapshot انجام شود و ترافیک اضافی ایجاد نشود.

## وضعیت API Functionها

تعداد فایل‌های top-level در `api/` همچنان 8 عدد است و محدودیت Vercel Hobby رعایت شده است.
