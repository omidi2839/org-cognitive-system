# Hotfix 0.9.8.8.1 — مسیر امن ASCII برای Vercel Blob

## علت خطا
در نسخه 0.9.8.8 نام فارسی فایل مستقیماً داخل `pathname` امضاشده Vercel Blob قرار می‌گرفت. در برخی مسیرهای Signed Token، نمایش/encoding یونیکد نام فارسی در scope توکن با pathname مصرف‌شده یکسان نبود و Vercel خطای `Blob path does not match the signed token scope` برمی‌گرداند.

## اصلاح
- نام اصلی فایل (فارسی/عربی/Unicode) برای نمایش، metadata، provenance و پردازش حفظ می‌شود.
- نام اصلی دیگر در object key فیزیکی Blob استفاده نمی‌شود.
- Blob pathname فقط از قطعات ASCII canonical ساخته می‌شود: سازمان، تاریخ، نقش فایل، nonce و پسوند `docx` یا `pdf`.
- همان متغیر `pathname` بدون بازسازی هم برای `issueSignedToken` و هم برای `presignUrl` استفاده می‌شود.
- این مسیر مشترک برای فایل اصلی، جایگزینی فایل اصلی و همه پیوست‌هاست.

نمونه مسیر جدید:
`ORG-SYN-001/direct/2026-09-10/primary-mtv6....docx`

نام نمایشی همچنان می‌تواند مثلاً `اصلاحیه 42 حقوق و مزایا.docx` باشد.

## زیرساخت
هیچ Environment Variable جدیدی لازم نیست. Blob Store خصوصی و OIDC فعلی باید بدون تغییر باقی بمانند.

## استقرار
این بسته شامل فایل کامل `public/index.html` و `vercel.json` است و ویرایش دستی نیاز ندارد.
