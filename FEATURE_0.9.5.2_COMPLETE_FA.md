# Feature 0.9.5.2 COMPLETE — Safe Test Data Reset

بسته کامل و بدون ویرایش دستی.

پس از Deploy روی «مدیریت سامانه» کلیک کنید. پنجره «داده‌های آزمایشی» باز می‌شود و ابتدا تعداد رکوردهای قابل حذف را نشان می‌دهد. برای حذف، تأیید اول را انجام دهید و سپس عبارت DELETE TEST DATA را دقیقاً وارد کنید. فقط داده‌های مرتبط با ORG:SYN-001 حذف می‌شوند؛ PostgreSQL، runtime_state، DATABASE_URL و تنظیمات Vercel حفظ می‌شوند.

Console: window.__DOCUMENT_MEETING_COMMAND_BUILD__ => 0.9.5.2
