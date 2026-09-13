# Cloudflare backend compatibility patch — SINA 0.9.9.1.9

این Patch برای اجرای همان APIهای فعلی Vercel روی Cloudflare Workers طراحی شده است.

فایل‌ها:
- `worker.js`: آداپتور Request/Response کلادفلر به handlerهای فعلی `api/*.js`
- `wrangler.jsonc`: اجرای Worker قبل از Static Assets برای `/api/*` و `/diag/*`

## متغیرهای محیطی که باید در Cloudflare ثبت شوند

مقادیر را از Vercel قبلی کپی کنید؛ مقدار Secretها را داخل GitHub ننویسید.

ضروری برای وضعیت فعلی:
- `SUPABASE_DATABASE_URL` (یا در صورت استفاده قدیمی `DATABASE_URL`)
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `APP_AUTH_SECRET`
- `OPENAI_API_KEY`
- `BLOB_READ_WRITE_TOKEN`

متغیرهای اختیاری/وابسته به قابلیت:
- `BLOB_STORE_ID`
- `OPENAI_BASE_URL`
- `SINA_AI_MODEL`
- `SINA_AI_MAX_OUTPUT_TOKENS`
- `SINA_AI_TIMEOUT_MS`
- `REQUIRE_DURABLE_SERVICES`
- `MIGRATION_ADMIN_SECRET`
- `MIGRATION_TARGET_DATABASE_URL`

## روش اعمال
این دو فایل باید در ریشه Repository `omidi2839/org-cognitive-system` قرار گیرند.
اگر `wrangler.jsonc` از قبل وجود دارد، آن را با نسخه Patch جایگزین کنید.

پس از Commit روی `main`، Cloudflare باید به صورت خودکار Build/Deploy جدید انجام دهد.

## تست اولیه
1. `/api/v1/auth/session` باید دیگر 404 نباشد؛ قبل از ورود باید 401 برگرداند.
2. فرم ورود باید POST به همان route بزند و Cookie سشن دریافت کند.
3. پس از ورود، بانک اسناد و APIهای دانش تست شوند.

نکته: Vercel Blob هنوز در این Patch حفظ شده است تا مهاجرت رفتاری حداقلی باشد. در مرحله بعد می‌توان Storage را مستقل از Vercel کرد.
