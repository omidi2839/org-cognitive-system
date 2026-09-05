# Build 0.7.6.3 — Knowledge Zone & Classification Fix

علت خطا:
فرم 0.7.6 مقدار `organization` برای knowledgeZone ارسال می‌کرد، در حالی که Backend فقط `organizational` را معتبر می‌داند.

اصلاحات:
- knowledgeZone به `organizational` اصلاح شد.
- طبقه‌بندی `public` به قرارداد Backend اضافه شد تا گزینه «عمومی» فرم هم معتبر باشد.
- «محرمانه» همچنان به `confidential` نگاشت می‌شود.
- Build به 0.7.6.3 افزایش یافت.

این ZIP Full Replacement است.
