# Hotfix 0.9.5.8.8 — بازگردانی کامل ظاهر بانک اسناد

علت:
فایل `document-bank-09582.css` فقط شامل اصلاحات تکمیلی نسخه‌های جدید بود و
استایل پایه بانک اسناد هنوز در `document-bank-091.css` قرار داشت. بعد از پاکسازی
و حذف ارجاع نسخه قدیمی از `index.html`، منطق بانک فعال ماند ولی ظاهر اصلی آن
بدون CSS پایه نمایش داده شد.

اصلاح:
- تمام استایل پایدار پایه بانک اسناد از نسخه 0.9.2.3 داخل `document-bank-09582.css` ادغام شد.
- فایل 09582 اکنون self-contained است و دیگر برای ظاهر بانک به CSS قدیمی وابسته نیست.
- Hotfix هنگ 0.9.5.8.7 حفظ شده است.
- هیچ API یا Vercel Function اضافه نشده است.
- PostgreSQL و داده‌ها تغییر نکرده‌اند.

Build markers:
window.__DOCUMENT_BANK_BUILD__ = 0.9.5.8.8
window.__DOCUMENT_MEETING_COMMAND_BUILD__ = 0.9.5.8.8
window.__DOCUMENT_BANK_ENTRY_BUILD__ = 0.9.5.8.8
