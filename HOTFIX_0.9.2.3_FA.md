# Hotfix 0.9.2.3 — Corrected Search Disclosure + Back Button

دو اصلاح هدفمند:

1. Selector قبلی برای «نمایش ... محل تطابق دیگر» با DOM واقعی منطبق نبود. در این نسخه Selector دقیق `.k91more > summary` استفاده شده و متن قرمز، Bold و واضح است.

2. دکمه «بازگشت به دانش و اسناد سازمان» دارای `inline-flex`، حداقل عرض/ارتفاع، line-height، padding و overflow صحیح شده تا متن کامل و در مرکز دکمه دیده شود.

بعد از Deploy:
- `public/index.html` باید فایل‌ها را با `?v=0.9.2.3` لود کند.
- یک بار Ctrl+F5 بزنید.
- Console: `window.__DOCUMENT_BANK_BUILD__` باید `0.9.2.3` باشد.
