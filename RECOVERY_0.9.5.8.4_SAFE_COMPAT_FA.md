# Recovery 0.9.5.8.4 — Safe Compatibility Build

لاگ نسخه 0.9.5.8.3 علت مشخصی نشان داد:
Vercel پس از حذف فایل‌های قدیمی هنوز هنگام Function Discovery دنبال
`api/document-bank-0958.js`
می‌گشت و با ENOENT متوقف شد.

این نسخه:
- هیچ فایل API یا public را در Build حذف نمی‌کند.
- Node را روی 22.x نگه می‌دارد.
- aliasهای سازگاری برای نام‌های قدیمی document-bank/topic-suggestions ایجاد می‌کند.
- PostgreSQL و داده‌ها را لمس نمی‌کند.
- vercel-build فقط وجود فایل‌های فعال را کنترل می‌کند.
