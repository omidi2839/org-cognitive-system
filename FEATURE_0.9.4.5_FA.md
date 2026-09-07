# Feature 0.9.4.5 — Collapsible Relations + In-Text Amendments

این نسخه روی 0.9.4.4 سوار می‌شود و منطق ثبت Relation را تغییر نمی‌دهد.

## تغییرات
- باکس «اصلاحات و سوابق این سند» جمع‌شونده شد.
- اگر تعداد Relationها بیشتر از ۳ مورد باشد، باکس به‌صورت پیش‌فرض جمع‌شده نمایش داده می‌شود.
- فونت تیتر، نام سند مرتبط، نوع ارتباط، شرح مواد و تبصره‌ها بزرگ‌تر شد.
- اصلاحات ثبت‌شده روی سند اصلی داخل متن خود سند نیز Highlight می‌شوند.
- برای `amended_by` برچسب «اصلاح‌شده»، برای `clarified_by` برچسب «دارای استفسار» و برای `repealed_by` برچسب «ملغی‌شده» نمایش داده می‌شود.
- Tooltip هر Highlight، عنوان سند مرتبط و شرح تغییر را نشان می‌دهد.

## نحوه تشخیص داخل متن
اگر در Relation برای مثال `article = 6` ثبت شده باشد، عبارت‌هایی مانند «ماده 6»، «ماده ۶» یا «ماده ٦» در متن اصلی پیدا و رنگی می‌شوند.
برای تبصره/بند نیز ارقام فارسی، عربی و لاتین پشتیبانی می‌شود.

## نصب
فایل‌های زیر را به public اضافه کنید:
- `document-relations-enhancement-0945.js`
- `document-relations-enhancement-0945.css`

این دو فایل باید AFTER نسخه 0.9.4.4 لود شوند:

<link rel="stylesheet" href="./document-relations-ui-0944.css?v=0.9.4.4">
<link rel="stylesheet" href="./document-relations-enhancement-0945.css?v=0.9.4.5">

<script src="./document-relations-ui-0944.js?v=0.9.4.4"></script>
<script src="./document-relations-enhancement-0945.js?v=0.9.4.5"></script>

Console:
window.__DOCUMENT_RELATION_ENHANCEMENT_BUILD__
=> 0.9.4.5

## نکته
Highlight فقط زمانی ممکن است که شماره ماده/تبصره در Relation ثبت شده باشد و عبارت متناظر واقعاً در متن استخراج‌شده سند وجود داشته باشد.
