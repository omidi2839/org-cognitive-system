# Hotfix 0.9.4.2 — Relation Display Source Fix

علت اصلی این بار مشخص شد:

`api/document-bank-core.js` در پاسخ Detail خودِ سند، همین حالا `relations` و `relationSummary` را برمی‌گرداند. یعنی Popup برای نمایش رابطه نیازی به API دوم ندارد.

اما Frontend نسخه‌های 0.9.4.0 و 0.9.4.1 همچنان برای نمایش روابط به:
`/api/v1/knowledge/document-relations`
درخواست جداگانه می‌زدند. این دو مسیر می‌توانستند از نظر timing/routing با هم ناهماهنگ شوند.

در 0.9.4.2:
- سوابق از همان endpoint اصلی Popup خوانده می‌شوند:
  `/api/v1/knowledge/document-bank?documentId=...&detail=1`
- `x.relations` مستقیماً نمایش داده می‌شود.
- اگر برای سازگاری با روابط قدیمی چیزی در Detail نبود، API قدیمی فقط به عنوان fallback بررسی می‌شود.
- Popup همیشه یکی از سه حالت را نشان می‌دهد:
  1) لیست واقعی ارتباطات
  2) «هیچ ارتباطی ثبت نشده»
  3) خطای صریح دریافت سوابق
  و دیگر سکوت/عدم نمایش نداریم.

## نصب
فایل `public/document-relations-preview-fix-0942.js` را اضافه کنید.

در `public/index.html` خط 0.9.4.1 را حذف کنید:
`<script src="./document-relations-preview-fix-0941.js?v=0.9.4.1"></script>`

و جای آن بگذارید:
`<script src="./document-relations-preview-fix-0942.js?v=0.9.4.2"></script>`

همچنین CSS زیر را می‌توانید به انتهای `document-amendments-093.css` اضافه کنید یا فایل overlay جداگانه لود کنید:
`document-relations-preview-fix-0942.css?v=0.9.4.2`

## تست
Console:
`window.__DOCUMENT_RELATION_PREVIEW_FIX__`
باید `0.9.4.2` باشد.

سپس سند را باز کنید. بالای متن سند حتماً بخش «اصلاحات و سوابق این سند» ظاهر می‌شود.
