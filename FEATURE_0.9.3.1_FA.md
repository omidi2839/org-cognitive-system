# Feature 0.9.3.1 — نسخه اصلاح‌شده و قابل مشاهده

علت دیده نشدن نسخه 0.9.3.0 مشخص شد: در Repository فعلی `public/index.html` هنوز فایل‌های `document-amendments-093.js/css` را لود نمی‌کرد؛ بنابراین UI ثبت ارتباط اصلاً اجرا نمی‌شد.

در این نسخه دیگر Patch دستی لازم نیست. فایل کامل `public/index.html` داخل بسته قرار دارد.

## فایل‌ها
- public/index.html
- public/document-amendments-093.js
- public/document-amendments-093.css
- api/document-relations.js
- vercel.json

## تست
پس از Deploy و Ctrl+F5:
1. Console: `window.__DOCUMENT_AMENDMENT_BUILD__` باید `0.9.3.1` باشد.
2. یک سند را باز کنید.
3. ابتدای متن Popup باید بلوک «اصلاحات و سوابق این سند» نمایش داده شود.
4. بخش «+ ثبت اصلاحیه یا ارتباط جدید» به صورت باز دیده می‌شود.
5. از فهرست «سند مرتبط» یکی از اسناد بانک را انتخاب و رابطه را ثبت کنید.
