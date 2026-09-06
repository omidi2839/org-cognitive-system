# Build 0.9.0.10 — Normalized Document Reference Contract Fix

اصلاح خطای DOCUMENT_TEXT_NOT_AVAILABLE:
- متن نرمال‌شده در Upload با documentRef ذخیره می‌شود.
- تحلیل شناختی اکنون ابتدا documentRef را می‌خواند.
- documentId برای سازگاری عقب‌رو به‌عنوان fallback باقی مانده است.

پس از Deploy:
مخزن اسناد → سند آپلودشده → ورود به تحلیل
