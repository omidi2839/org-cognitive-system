# Build 0.8.3.1 — GitHub-Aligned Evidence Grouping Fix
این Patch برای همان ساختار فعلی مخزن آنلاین ساخته شده است.
- renderUnderstanding بازنویسی شده: پرسش‌ها ابتدا با evidenceGroupId/evidence گروه‌بندی می‌شوند.
- شاهد سند فقط یک بار بالای هر بسته نمایش داده می‌شود.
- همه پرسش‌های همان گزاره زیر همان شاهد قرار می‌گیرند.
- شاهد بزرگ‌تر، قرمز و Bold است.
- محدودیت‌های 120 جمله، 12 پرسش، 24 semantic unit و 60 concept حذف شده‌اند.
- semanticTerms نیز وارد discoverConcepts می‌شوند.
نکته: استخراج عمومی مفاهیم ناشناخته هنوز deterministic است و در Build بعدی باید با semantic provider واقعی جایگزین شود.
