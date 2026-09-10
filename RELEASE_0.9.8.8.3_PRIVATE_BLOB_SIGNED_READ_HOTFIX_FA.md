# Hotfix 0.9.8.8.3 — خواندن پایدار Private Blob با Signed GET

## علت قطعی خطا
در 0.9.8.8.2 آپلود مستقیم و اعتبارسنجی `blobPathname` عبور می‌کرد، اما `VercelBlobStorage.get()` از `@vercel/blob.get()` استفاده می‌کرد و در محیط واقعی نتیجه فاقد stream بود؛ بنابراین فقط `BLOB_READ_FAILED` ثبت می‌شد و خطای provider نیز پوشانده می‌شد.

## اصلاح اصلی
- خواندن فایل Private Blob از همان الگوی رسمی OIDC + Signed URL استفاده می‌کند که برای Direct PUT استفاده شده است.
- سرور برای pathname دقیق، یک Signed GET کوتاه‌عمر می‌سازد و سپس فایل را server-side دریافت می‌کند.
- هیچ credential یا token به مرورگر یا metadata سند منتقل نمی‌شود.
- `useCache:false` برای read-after-write جدید فعال است.
- برای 404 بلافاصله پس از آپلود، retry کوتاه و محدود اضافه شده است.

## مشاهده‌پذیری
اگر provider دوباره خطا بدهد، Log دیگر فقط `BLOB_READ_FAILED` نیست و کد/status/detail کنترل‌شده ثبت می‌شود:
- `BLOB_SIGNED_READ_URL_MISSING`
- `BLOB_SIGNED_READ_FETCH_FAILED`
- `BLOB_SIGNED_READ_HTTP_FAILED`
- `BLOB_READ_PROVIDER_ERROR`

Query parameters امضاشده در Log redacted می‌شوند.

## دامنه اصلاح
این Storage Adapter مشترک است، بنابراین اصلاح روی هر سه مسیر اعمال می‌شود:
1. ثبت سند جدید
2. جایگزینی فایل اصلی
3. پیوست‌های Word/PDF

## نکات استقرار
- هیچ Environment Variable جدید لازم نیست.
- Blob Store/OIDC/Supabase تغییر نکند.
- فایل‌های بسته به‌صورت کامل جایگزین شوند؛ `public/index.html` و `vercel.json` داخل بسته هستند.
- Markerهای frontend پس از Deploy باید `0.9.8.8.3` باشند.
