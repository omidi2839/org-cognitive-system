# Build 0.9.0.2 — Minimal Repository Runtime Patch

این ZIP عمداً فقط دو فایل اجرایی تغییرکرده را دارد تا هیچ فایل دیگری از مخزن overwrite نشود.

علت‌های اصلاح‌شده:
1) مخزن اسناد دیگر به enrichment تحلیل وابسته نیست؛ اگر enrichment خطا بدهد، فهرست اسناد باید همچنان نمایش داده شود.
2) موتور 0.9 از repo.transact استفاده می‌کرد، در حالی که Repositoryهای پروژه قرارداد mutate دارند؛ این مورد اصلاح شد.
3) قرارداد قدیمی API برای analyze/answer/approve حفظ شده است.

Health: 0.9.0.2
