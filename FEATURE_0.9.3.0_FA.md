# Feature 0.9.3.0 — Document Version & Amendment Graph

## هدف
ایجاد شبکه نسخه، اصلاحیه، جایگزینی، لغو، تمدید و سایر روابط حقوقی/سازمانی بین اسناد.

مثال:
مصوبه ۲۱۵ ← اصلاح‌شده توسط ۲۸۰، ۲۹۰، ۳۲۱، ۳۴۴

## مدل رابطه
هر رابطه مستقل از Version Number داخلی سند است و شامل این فیلدهاست:
- sourceDocumentRef
- targetDocumentRef
- relationType
- targetLocator: section / article / clause
- changeType
- effectiveFrom / effectiveTo
- legalEffect
- note / evidence
- confidence
- audit timestamps

معنای `amends`:
source = سند اصلاحیه
target = سند پایه

UI از دید هر سند inverse relation را هم می‌سازد؛ بنابراین سند پایه «اصلاح‌شده توسط» و سند اصلاحیه «اصلاح‌کننده» را می‌بیند.

## رفتار بانک اسناد
در Popup سند یک بلوک جدید «اصلاحات و سوابق این سند» اضافه می‌شود:
- وضعیت: بدون اصلاحیه / معتبر با اصلاحات / جایگزین‌شده / لغوشده
- آخرین تغییر ثبت‌شده
- اصلاحات بعدی
- اسنادی که این سند تغییر داده است
- سایر روابط
- کلیک روی سند مرتبط و باز کردن Popup همان سند
- ثبت ارتباط جدید
- حذف ارتباط اشتباه

## جستجو
متن و فراداده اسناد مرتبط نیز وارد haystack جستجو می‌شود. بنابراین اگر رابطه مصوبه ۲۱۵ با ۲۸۰ ثبت شده باشد، جستجوی اطلاعات اصلاحیه می‌تواند سند پایه را هم بازیابی کند.

## Persistence
با توجه به Repository فعلی، PostgreSQL هنوز state را در `runtime_state.payload` به صورت JSONB نگه می‌دارد؛ بنابراین `documentRelations` به صورت additive داخل همان state پایدار ذخیره می‌شود و برای این Build SQL migration اجباری نیست. هنگام Cutover کامل Database V1 می‌توان آن را به جدول relational `document_relations` منتقل کرد.

## فایل‌ها
- api/document-bank-core.js (جایگزین)
- public/document-amendments-093.js (جدید)
- public/document-amendments-093.css (جدید)
- PATCH_0.9.3.0_FA.txt

## تست پذیرش نمونه
1. مصوبه ۲۱۵ را باز کنید.
2. «ثبت اصلاحیه یا ارتباط جدید» را باز کنید.
3. نوع = «اصلاح‌شده توسط»
4. سند مرتبط = مصوبه ۲۸۰
5. ماده/بند و نوع تغییر را ثبت کنید.
6. همین کار را برای ۲۹۰، ۳۲۱ و ۳۴۴ تکرار کنید.
7. با باز کردن ۲۱۵، همه اصلاحات باید در همان Popup دیده شوند.
8. با کلیک روی ۲۸۰، Popup اصلاحیه باز شود و نشان دهد این سند اصلاح‌کننده ۲۱۵ است.
