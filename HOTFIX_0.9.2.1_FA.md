# Hotfix 0.9.2.1 — Persian Text Normalization + Navigation Lifecycle Fix

این نسخه دو مشکل را همزمان رفع می‌کند.

## 1. متن فارسی و جستجو
Pipeline جدید `normalizePersianText()` به Parser اضافه شده و قبل از ذخیره normalizedDocuments اجرا می‌شود:
- Unicode NFC
- ي / ى → ی
- ك → ک
- حذف Tatweel و bidi/control characters
- یکسان‌سازی فاصله‌ها
- اصلاح الگوی رایج «ی» جداشده در PDF extraction
- اصلاح فاصله علائم نگارشی

Bank backend نیز همین Normalizer را هنگام Search و Preview روی متن‌های موجود اعمال می‌کند؛ بنابراین حتی قبل از بازپردازش دائمی، نمایش و Search بهتر می‌شود.

دکمه «بازپردازش متن فارسی» در بالای بانک اسناد اضافه شده است. با آن، normalizedDocuments موجود در PostgreSQL به‌صورت دائمی با پروفایل `fa-v1` بازنرمال‌سازی می‌شوند.

محدودیت مهم: parser فعلی PDF همچنان `text-layer-lite` است. اگر خود PDF فونت/encoding داخلی غیر استاندارد داشته باشد، Normalization همه خطاهای PDF را نمی‌تواند بازسازی کند. مرحله معماری بعدی باید Provider-based PDF extraction باشد.

## 2. خالی شدن صفحه با منوی سمت چپ
Bank در Focus Mode کلاس `k91-hidden-workspace` را روی Workspace اصلی می‌گذاشت. هنگام کلیک روی Sidebar، Workspace جدید render می‌شد ولی آن کلاس باقی می‌ماند؛ در نتیجه محتوای جدید وجود داشت اما مخفی بود.

0.9.2.1 در Capture Phase قبل از Navigation:
- Modal را می‌بندد
- `k91-hidden-workspace` را حذف می‌کند
- Bank shell را حذف می‌کند
- سپس handler اصلی Sidebar بدون اختلال ادامه پیدا می‌کند

## فایل‌های جایگزین
- src/processing/parser.js
- api/document-bank-core.js
- public/document-bank-091.js
- public/document-bank-091.css

همچنین `PATCH_0.9.2.1_FA.txt` را برای تغییر api/index.js و public/index.html اعمال کنید.

## ترتیب تست
1. Deploy
2. Ctrl+F5
3. Console: `window.__DOCUMENT_BANK_BUILD__` باید `0.9.2.1` باشد.
4. بانک اسناد → «بازپردازش متن فارسی»
5. Preview یک سند و بررسی «ی»
6. Search همان واژه
7. بانک اسناد → کلیک روی «جهت‌گیری سازمان» یا «مسائل سازمان» در Sidebar؛ صفحه نباید خالی شود.
