# Hotfix 0.9.8.9.1 — Deploy Routing & Auth Gate

این نسخه همه قابلیت‌های 0.9.8.9 را حفظ می‌کند و خطای انتشار پس از `Build Completed` را از مسیر روتینگ برطرف می‌کند.

## اصلاح اصلی
- Rewrite سراسری `/api/(.*) -> /api/auth-proxy.js` حذف شد چون خود `/api/auth-proxy.js` نیز با همان الگو Match می‌شد و یک مسیر بازنویسی خودارجاع ایجاد می‌کرد.
- Rewrite عمومی اکنون فقط روی `/api/v1/(.*)` اعمال می‌شود.
- مسیرهای تخصصی اسناد، بانک، روابط، ساختار، پیشنهاد موضوع، Reset و Knowledge قبل از این Rewrite قرار دارند و Handler خودشان کنترل Session را انجام می‌دهند.
- سایر APIهای V1 از `auth-proxy.js` عبور کرده و سپس به `api/index.js` می‌رسند.
- مسیر `/api/v1/auth/session` همچنان مستقیماً به `knowledge-documents.js` می‌رود تا Login قبل از داشتن Session قابل انجام باشد.

## قابلیت‌های حفظ‌شده
- Document Consolidation / اعمال اصلاحیه و الحاقیه در سند مادر
- پیوست‌های چندگانه و نمایش/بازکردن پیوست‌ها
- اصلاح Navigation میزکار شناختی
- صفحه ورود ادمین و Session HttpOnly
- Upload مقاوم 0.9.8.8.5، Private Blob و Supabase

## کنترل انتشار
- هیچ API جدیدی اضافه نشده است.
- `public/index.html` و `vercel.json` کامل در بسته قرار دارند.
- Markerهای رابط به `0.9.8.9.1` ارتقا یافته‌اند.
