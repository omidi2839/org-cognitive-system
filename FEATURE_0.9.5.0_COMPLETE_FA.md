# Feature 0.9.5.0 COMPLETE — No Manual Edits

این بسته کامل است و هیچ ویرایش دستی در `index.html` یا `vercel.json` لازم ندارد.

فایل‌های آماده جایگزینی/افزودن:
- `public/index.html` — نسخه کامل و اصلاح‌شده
- `vercel.json` — نسخه کامل و اصلاح‌شده
- `public/document-meeting-command-0950.js`
- `public/document-meeting-command-0950.css`
- `api/document-query.js`

## رفتار نسخه
- شماره جلسه و تاریخ جلسه در فرم افزودن سند
- پایه اتصال آینده سند به Meeting با `meetingRef`
- فرمان جستجوی اسناد از میزکار شناختی
- پرس‌وجو بر اساس موضوع/متن/شماره جلسه
- باکس سوابق سند همیشه پیش‌فرض بسته
- فونت بزرگ‌تر برای سوابق
- چاپ کامل سند
- چاپ بخش انتخاب‌شده
- افزودن به «اسناد من»

## نصب
فقط ساختار همین ZIP را روی پروژه کپی/جایگزین کنید و Deploy بگیرید.
هیچ خطی در `index.html` یا `vercel.json` به‌صورت دستی اضافه نکنید.

نسخه فعلی `index.html` در این بسته، Enhancement قدیمی 0.9.4.5 را لود نمی‌کند و به‌جای آن 0.9.5.0 را بعد از 0.9.4.4 بارگذاری می‌کند.

Console check:
`window.__DOCUMENT_MEETING_COMMAND_BUILD__`
باید `0.9.5.0` باشد.
