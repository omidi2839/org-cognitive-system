# Hotfix 0.9.1.2 — Document Bank UI Freeze Fix

فقط فایل زیر را در Repository جایگزین کنید:

`public/document-bank-091.js`

علت خطا:
نسخه 0.9.1.1 روی `characterData` نیز MutationObserver داشت و تابع فارسی‌سازی خودش تغییر متن ایجاد می‌کرد. این وضعیت باعث حلقه متوالی Mutation و قفل شدن UI می‌شد.

اصلاح:
- حذف مشاهده `characterData`
- فارسی‌سازی فقط در صورت تغییر واقعی متن
- تجمیع Mutationها با `requestAnimationFrame`
- بدون تغییر API و Backend

پس از Commit، Vercel باید خودکار Deploy شود.
