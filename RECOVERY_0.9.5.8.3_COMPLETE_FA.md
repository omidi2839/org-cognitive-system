# Recovery Build 0.9.5.8.3 — Clean Vercel Build

این بسته برای آزمون یک Build تمیز طراحی شده است و داده‌های PostgreSQL را حذف یا تغییر نمی‌دهد.

## کاری که انجام می‌دهد
1. Node.js را روی `22.x` قفل می‌کند تا Vercel به صورت خودکار Node 24 را انتخاب نکند.
2. در زمان Build، اسکریپت `scripts/recovery-clean-build.js` فقط در checkout موقت Vercel اجرا می‌شود.
3. فایل‌های API و Frontend نسخه‌های قدیمی را از همان workspace موقت Build حذف می‌کند.
4. GitHub، PostgreSQL، DATABASE_URL و اطلاعات ثبت‌شده دست‌نخورده می‌مانند.
5. فقط Assetها و APIهای فعال فعلی برای خروجی Deployment باقی می‌مانند.
6. فایل `/recovery-build.txt` برای تشخیص قطعی Artifact جدید ایجاد می‌شود.

## بعد از Deploy موفق
در Console:
window.__DOCUMENT_BANK_BUILD__
window.__DOCUMENT_MEETING_COMMAND_BUILD__

هر دو باید:
0.9.5.8.3

و این آدرس نیز باید باز شود:
`/recovery-build.txt`

## نکته
اگر این Build نیز دقیقاً بعد از `Deploying outputs...` شکست بخورد، احتمال platform-side/finalization در Vercel بسیار تقویت می‌شود؛ چون Artifact خروجی عمداً کوچک و تمیز شده است.
