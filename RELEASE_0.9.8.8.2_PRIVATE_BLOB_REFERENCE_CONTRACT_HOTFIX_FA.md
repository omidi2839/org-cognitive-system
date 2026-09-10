# Hotfix 0.9.8.8.2 — قرارداد امن مرجع Private Blob

## مسئله رفع‌شده
پس از رفع ناسازگاری Unicode در Signed Path نسخه 0.9.8.8.1، فایل مستقیماً در Vercel Blob آپلود می‌شد اما مرحله ثبت سند با خطای `BLOB_URL_INVALID` متوقف می‌شد. علت، اعتبارسنجی قدیمی hostname در `_materializeIncomingFile` بود؛ در حالی که Private Blob/OIDC باید از pathname همان Store متصل‌شده به پروژه خوانده شود و شکل URL نباید مرجع اعتماد باشد.

## اصلاح معماری
- `blobPathname` اکنون مرجع اصلی بازیابی فایل Direct Upload است.
- Backend فقط pathnameهایی را می‌پذیرد که در namespace همان سازمان و الگوی Direct Upload تولیدشده توسط سرور باشند.
- خواندن فایل فقط از Private Blob Store متصل به پروژه و از طریق `@vercel/blob`/OIDC انجام می‌شود؛ URL خارجی دلخواه هرگز دانلود نمی‌شود.
- `blobUrl` فقط به‌عنوان metadata کمکی نگهداری می‌شود و برای اعتماد/بازیابی استفاده نمی‌شود.
- اندازه فایل دریافت‌شده با `size` اعلام‌شده کنترل می‌شود.

## پوشش سه مسیر فایل
این Hotfix قرارداد واحد Direct Blob را برای هر سه سناریو اصلاح می‌کند:
1. ثبت سند جدید با فایل اصلی؛
2. جایگزینی فایل اصلی یک سند موجود؛
3. افزودن یک یا چند پیوست Word/PDF.

همچنین فیلتر پیوست‌ها که قبلاً فقط `contentBase64` را می‌پذیرفت اصلاح شده و `blobPathname/blobUrl` را نیز می‌پذیرد. مسیر Replace Primary نیز همه فیلدهای Blob (`blobUrl`, `blobPathname`, `size`) را به لایه ذخیره‌سازی منتقل می‌کند.

## امنیت
برای رفع خطا، validation باز نشده است. مسیر Blob باید:
- زیر prefix سازمان جاری باشد؛
- traversal مانند `..` نداشته باشد؛
- با الگوی `primary|attachment` و پسوند `docx|pdf` منطبق باشد.

## استقرار
- بسته کامل تغییرات است و `public/index.html` و `vercel.json` را نیز شامل می‌شود.
- فایل‌ها را جایگزین و Redeploy کنید.
- پس از استقرار، markerهای زیر باید `0.9.8.8.2` باشند:
  - `window.__DOCUMENT_MEETING_COMMAND_BUILD__`
  - `window.__DOCUMENT_BANK_BUILD__`
