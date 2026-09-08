# Hotfix 0.9.5.8.9 — رفع خطای x-org-id در جستجوی بانک اسناد

علت:
در `api/document-bank-09582.js` برای ساخت Facetهای موضوع/جلسه یک request داخلی با
`{...req}` ساخته می‌شد. در Vercel/Node، `req.headers` روی IncomingMessage لزوماً enumerable
نیست و با spread منتقل نمی‌شود. بنابراین request داخلی بدون `headers` وارد
`buildDocumentBankResponse` می‌شد و خطای زیر ایجاد می‌کرد:

Cannot read properties of undefined (reading 'x-org-id')

اصلاح:
- request داخلی اکنون `headers:req.headers||{}` را صریحاً منتقل می‌کند.
- `document-bank-core.js` نیز برای تمام header accessها defensive شده است.
- هیچ Function جدیدی اضافه نشده است.
- PostgreSQL و داده‌ها تغییر نکرده‌اند.
