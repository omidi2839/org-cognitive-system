# Hotfix 0.9.8.8.4 — خواندن مستقیم Private Blob با SDK/OIDC

## مسئله
در 0.9.8.8.3، ساخت Signed GET انجام می‌شد اما `fetch()` سروری به URL امضاشده با `fetch failed` متوقف می‌شد و هیچ status HTTP دریافت نمی‌شد.

## اصلاح اصلی
`src/infrastructure/storage/vercelBlobStorage.js` دیگر برای خواندن فایل از مسیر `Signed GET -> fetch` استفاده نمی‌کند. خواندن اکنون مستقیماً با API رسمی `@vercel/blob` انجام می‌شود:

```js
const result = await get(pathname, {
  access: 'private',
  useCache: false
});
```

در Vercel، SDK از OIDC کوتاه‌عمر پروژه متصل به Blob Store استفاده می‌کند. `useCache:false` نیز خواندن تازه‌ترین محتوای فایل، بلافاصله پس از Direct PUT، را تضمین می‌کند.

## تبدیل Stream
خروجی `get()` به Buffer تبدیل می‌شود تا Parser فعلی Word/PDF بدون تغییر معماری ادامه پیدا کند. این تبدیل محلی است و درخواست شبکه دوم ایجاد نمی‌کند.

## امنیت
- Direct Upload مرورگر همچنان با Signed PUT کوتاه‌عمر انجام می‌شود.
- Backend فقط `blobPathname` اعتبارسنجی‌شده را می‌خواند.
- credential Blob به مرورگر ارسال نمی‌شود.
- جزئیات امضا در Logها redacted می‌شوند.

## مسیرهای تحت پوشش
- ثبت سند جدید
- جایگزینی فایل اصلی
- پیوست‌های متعدد Word/PDF

## استقرار
همه فایل‌های لازم در این بسته وجود دارند، از جمله `public/index.html` و `vercel.json`. ویرایش دستی لازم نیست.

پس از Deploy، markerهای frontend باید `0.9.8.8.4` باشند.
