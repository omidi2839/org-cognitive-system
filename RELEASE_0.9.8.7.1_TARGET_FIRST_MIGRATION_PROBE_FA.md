# Release 0.9.8.7.1 — Target-first Migration Probe

این Hotfix روی 0.9.8.7 ساخته شده و تمام فایل‌های لازم برای جایگزینی را در خود دارد.

## هدف

Neon در وضعیت Data Transfer Quota قرار دارد و Probe ترکیبی 0.9.8.7 ابتدا Source را می‌خواند؛ بنابراین قبل از رسیدن به Supabase با خطای 500 متوقف می‌شد.

## تغییرات

- `probe-target`: فقط Supabase را بررسی می‌کند و هیچ اتصال/Query به Neon نمی‌زند.
- `probe-source`: فقط Source فعلی را بررسی می‌کند.
- `probe`: برای سازگاری حفظ شده اما اکنون Target-first است.
- `copy`: همان انتقال کنترل‌شده Snapshot است و تنها پس از باز شدن Source استفاده می‌شود.
- همه خطاهای Migration به JSON کنترل‌شده با `stage`, `code`, `message` تبدیل می‌شوند.
- هیچ API Function سطح بالای جدیدی اضافه نشده است؛ تعداد فایل‌های `api/*.js` همچنان 8 است.
- `public/index.html` و `vercel.json` کامل داخل بسته هستند؛ ویرایش دستی لازم نیست.

## Probe پیشنهادی بعد از Deploy

```js
fetch('/api/v1/knowledge/database-migration', {
  method:'POST',
  headers:{'content-type':'application/json','x-migration-secret':'YOUR_SECRET'},
  body:JSON.stringify({action:'probe-target'})
}).then(async r=>({status:r.status,body:await r.text()})).then(console.log)
```

در صورت موفقیت Target، انتظار می‌رود status=200 و body شامل `ok:true`, `stage:"target"` و آمار دیتابیس مقصد باشد.
