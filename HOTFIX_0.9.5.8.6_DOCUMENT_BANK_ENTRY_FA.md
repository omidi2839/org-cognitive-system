# Hotfix 0.9.5.8.6 — بازگردانی بانک اسناد به فهرست

مشکل:
نسخه 0.9.5.8.5 فعال شد و موضوع‌بندی درست کار کرد، اما کارت «بانک اسناد» در صفحه
«دانش و اسناد سازمان» ظاهر نمی‌شد.

راه‌حل:
- یک overlay مستقل و idempotent اضافه شد.
- پس از ورود به workspace دانش، کارت «بانک اسناد» در بخش «اسناد سازمان» تضمینی درج می‌شود.
- با MutationObserver و چند retry کوتاه، رندر مجدد workspace دیگر کارت را حذف نمی‌کند.
- کلیک روی کارت همان document-bank-09582 فعال را باز می‌کند.
- هیچ API یا PostgreSQL تغییر نکرده است.
- تعداد Vercel Functions افزایش پیدا نمی‌کند، چون فقط فایل‌های static public اضافه شده‌اند.

Build markers:
window.__DOCUMENT_BANK_BUILD__ = 0.9.5.8.6
window.__DOCUMENT_MEETING_COMMAND_BUILD__ = 0.9.5.8.6
window.__DOCUMENT_BANK_ENTRY_BUILD__ = 0.9.5.8.6
