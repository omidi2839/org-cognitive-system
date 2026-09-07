# Hotfix 0.9.1.4 — Document Bank Route Registration

علت خطا:
`vercel.json` درخواست بانک اسناد را به `api/index.js` می‌فرستاد اما `api/index.js`
هنوز Route مربوط به `/api/v1/knowledge/document-bank` را نداشت و پاسخ «مسیر پیدا نشد» می‌داد.

اصلاح:
- افزودن import هسته بانک اسناد به `api/index.js`
- ثبت مستقیم Route بانک اسناد در همان Runtime اصلی
- استفاده از همان Repository مشترک با مخزن اسناد
- حفظ `vercel.json` عمومی و جلوگیری از Serverless Function جداگانه

پس از Deploy باید:
1. بانک اسناد بدون 404 باز شود.
2. اسناد موجود در مخزن را نشان دهد.
3. جستجو و فیلترها کار کنند.
