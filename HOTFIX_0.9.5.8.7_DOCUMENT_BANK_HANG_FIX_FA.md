# Hotfix 0.9.5.8.7 — رفع هنگ دانش و اسناد سازمان

علت هنگ نسخه 0.9.5.8.6:
MutationObserver روی تغییرات `class` و `childList` فعال بود و خود callback نیز
روی همان DOM دوباره `classList` و `textContent` می‌نوشت. این چرخه می‌توانست
Mutation جدید تولید کند و مرورگر را وارد حلقه سنگین کند.

اصلاح:
- مشاهده‌ی attribute/class کاملاً حذف شد.
- Observer فقط childList را می‌بیند.
- callback مستقیماً DOM را تغییر نمی‌دهد و فقط یک requestAnimationFrame زمان‌بندی می‌کند.
- اگر کارت «بانک اسناد» از قبل وجود داشته باشد هیچ نوشتن DOM انجام نمی‌شود.
- guardهای `scheduled` و `inserting` از اجرای تکراری جلوگیری می‌کنند.
- هیچ API، Function یا PostgreSQL تغییر نکرده است.

Build markers:
window.__DOCUMENT_BANK_BUILD__ = 0.9.5.8.7
window.__DOCUMENT_MEETING_COMMAND_BUILD__ = 0.9.5.8.7
window.__DOCUMENT_BANK_ENTRY_BUILD__ = 0.9.5.8.7
