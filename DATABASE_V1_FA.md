# Database V1 — Organizational Knowledge & Cognitive Data Foundation

## تصمیم معماری

از این مرحله، `runtime_state.payload` دیگر مقصد نهایی داده‌های عملیاتی نیست. ساختار فعلی فقط برای سازگاری و مهاجرت تدریجی حفظ می‌شود. مقصد رسمی، PostgreSQL رابطه‌ای + متن قابل جستجو + واحدهای شواهدی قابل ارجاع است.

## چرا الان؟

در وضعیت فعلی، `PostgresRepository` کل state را در یک JSONB نگه می‌دارد. این روش برای Prototype مناسب بود، اما برای بانک اسناد واقعی، جستجوی متن، نسخه‌بندی، provenance، audit، RAG، citation و گراف شناختی مقیاس‌پذیر نیست.

## لایه‌های اصلی Database V1

1. `documents`: هویت و فراداده جاری سند
2. `document_versions`: تاریخچه نسخه‌ها
3. `document_artifacts`: فایل‌های اصلی و محل ذخیره
4. `document_texts`: متن Canonical استخراج‌شده در هر نسخه
5. `document_text_units`: صفحه/بند/اسلاید/سلول برای Evidence و Citation
6. `document_relations`: روابط مستقیم بین اسناد
7. `extraction_jobs`: وضعیت و کیفیت استخراج
8. `cognitive_entities`: هسته موجودیت‌های شناختی
9. `cognitive_relations`: روابط many-to-many همراه با confidence، evidence و provenance
10. `document_bank_search_v1`: نمای اولیه بانک اسناد

## خط لوله رسمی سند

Original File
→ Artifact Storage
→ Extraction
→ Extraction Quality
→ Canonical Normalized Text
→ Addressable Text Units
→ Search Index
→ Cognitive Processing
→ Evidence / Provenance / Reasoning

## جستجوی فارسی

نسخه V1 دو مسیر مکمل دارد:

- GIN/tsvector با پیکربندی `simple`
- trigram (`pg_trgm`) برای تطابق بخشی و فارسی

در Application Layer همچنان باید normalization فارسی انجام شود:
`ي/ى → ی`، `ك → ک`، حذف اعراب، یکسان‌سازی نیم‌فاصله و فاصله‌های اضافی.

## مهاجرت بدون ریسک

### Phase A — Additive
فایل `004_database_v1_foundation.sql` فقط ساختار جدید را اضافه می‌کند و `runtime_state` را حذف نمی‌کند.

### Phase B — Backfill
فایل `005_runtime_state_backfill.sql` داده فعلی را از JSONB به جداول جدید منتقل می‌کند.

### Phase C — Dual Read Verification
برای یک دوره کوتاه:
- خواندن از ساختار جدید
- مقایسه تعداد/شناسه/متن با runtime_state
- عدم حذف runtime_state

### Phase D — Repository Cutover
Repository جدید به‌صورت مستقیم از جداول V1 بخواند/بنویسد.

### Phase E — Legacy Freeze
`runtime_state` فقط read-only/backup شود.

## شرط Cutover

قبل از تغییر Repository باید این تست‌ها سبز باشند:

- تعداد اسناد در هر دو ساختار برابر
- `documentRef` و `normalized text` برای همه اسناد موجود
- جستجوی عبارت داخل متن PDF/DOCX حداقل روی اسناد دارای extraction معتبر نتیجه دهد
- فیلترهای تاریخ/اعتبار/مرجع همچنان کار کنند
- هیچ سندی با سطح دسترسی بالاتر از clearance کاربر نمایش داده نشود

## مسئله فعلی PDF

Parser فعلی PDF یک parser سبک است و برای PDF فارسی قابل اتکا نیست. بنابراین Database V1 عمداً `extraction_method` و شاخص‌های کیفیت را در `document_texts` و `extraction_jobs` پیش‌بینی کرده است.

مرحله بعدی فنی:
Provider-based Extraction:
1. Native PDF text extraction
2. Advanced PDF parser
3. Vision/OCR fallback

و ذخیره امتیازهای:
- `extraction_quality`
- `character_quality`
- `text_coverage`
- `layout_confidence`

## اصل تثبیت‌شده

بانک اسناد یک جزیره مستقل نیست؛ نخستین نمای عملیاتی از «Organizational Knowledge & Cognitive Data Foundation» است. Anchor، Problem، Decision، Meeting، Action، Capacity، Warning، Outcome و Learning باید در ادامه روی همین foundation قرار بگیرند.
