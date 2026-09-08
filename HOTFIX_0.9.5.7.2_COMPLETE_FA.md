# Hotfix 0.9.5.7.2 — Topic Extraction Parser Recovery

علت خطا مشخص شد:
در parser نسخه 0.9.5.7 دو بار توابع `docxAlignment` و `docxInlineParts` تعریف شده بودند.
این باعث می‌شد import واقعی parser در runtime با خطای
`Identifier 'docxAlignment' has already been declared`
متوقف شود.

نتیجه:
- بانک اسناد با 0.9.5.7.1 باز می‌شد چون مسیر آن از parser جدا شده بود.
- اما تحلیل حوزه موضوعی همچنان parser را import می‌کرد و خطا می‌داد.

در 0.9.5.7.2:
- declaration تکراری حذف شده است.
- قابلیت استخراج حوزه موضوعی دوباره فعال است.
- تغییرات 0.9.5.7.1 و همه قابلیت‌های 0.9.5.7 حفظ شده‌اند.
- هیچ ویرایش دستی در index.html یا vercel.json لازم نیست.

Build:
window.__DOCUMENT_MEETING_COMMAND_BUILD__
=> 0.9.5.7.2
