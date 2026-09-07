# Hotfix 0.9.4.3 — Preview Capture Fix + Safe Test Reset

## علت واقعی عدم نمایش Relation
Listener نسخه‌های 0.9.4.1 و 0.9.4.2 روی document/bubble بود.
Bank اصلی برای Preview یک handler خودش دارد و می‌تواند propagation را در سطح document متوقف کند؛ در نتیجه overlay اصلاً click را نمی‌دید.

0.9.4.3 click را روی `window` در capture phase می‌گیرد؛ یعنی قبل از handler بانک.
سپس فقط شناسه سند را نگه می‌دارد و وقتی `.k91modalbody` ساخته شد، Relation را از همان detail endpoint بانک اسناد می‌خواند.

## نصب Preview
فایل‌های 0941 و 0942 را از index.html حذف کنید.
اضافه کنید:
<link rel="stylesheet" href="./document-relations-preview-fix-0943.css?v=0.9.4.3">
<script src="./document-relations-preview-fix-0943.js?v=0.9.4.3"></script>

Console:
window.__DOCUMENT_RELATION_PREVIEW_FIX__
=> 0.9.4.3

## پاکسازی رکوردهای آزمایشی
فایل `api/test-reset.js` را اضافه کنید و Rewrite موجود در `VERCEL_PATCH_0.9.4.3.txt` را اعمال کنید.

بعد از Deploy، فقط یک بار در Console مرورگر اجرا کنید:

fetch('/api/v1/admin/test-reset',{
  method:'POST',
  headers:{
    'content-type':'application/json',
    'x-org-id':'ORG:SYN-001',
    'x-reset-confirm':'DELETE_TEST_DOCUMENTS'
  },
  body:'{}'
}).then(r=>r.json()).then(console.log)

این کار فقط داده‌های document-related سازمان ORG:SYN-001 را پاک می‌کند و سایر داده‌های سامانه را دست نمی‌زند.
بعد از موفقیت، endpoint را می‌توانید از Deploy بعدی حذف کنید.
