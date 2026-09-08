# Recovery 0.9.5.8.5 — Final Source Cleanup

هدف: کاهش واقعی تعداد Vercel Functions در Source Repository.

## حذف‌های الزامی از GitHub
- api/document-bank-0958.js
- api/document-bank.js
- api/test-reset.js
- api/topic-suggestions-0958.js
- api/topic-suggestions.js

این فایل‌ها منسوخ/compatibility هستند. مسیرهای فعال در vercel.json به:
- api/document-bank-09582.js
- api/topic-suggestions-09582.js
اشاره می‌کنند.

## تغییرات بسته
- compatibility aliases حذف شده‌اند.
- Node روی 22.x قفل است.
- build-time deletion حذف شده است.
- Build Marker = 0.9.5.8.5
- PostgreSQL و داده‌ها دست‌نخورده می‌مانند.

## تست بعد از Deploy موفق
window.__DOCUMENT_BANK_BUILD__
window.__DOCUMENT_MEETING_COMMAND_BUILD__

هر دو باید 0.9.5.8.5 باشند.

همچنین:
https://<domain>/recovery-build.txt
باید Version: 0.9.5.8.5 را نشان دهد.
