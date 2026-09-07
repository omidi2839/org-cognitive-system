# Build 0.9.1.3 — Shared Runtime Repository Fix

علت ریشه‌ای:
در Vercel، مسیر `/api/v1/knowledge/document-bank` به یک Serverless Function مستقل (`api/document-bank.js`) Rewrite شده بود.
مخزن فعلی سامانه `ephemeral-memory` است. بنابراین Function بانک اسناد حافظه مستقل داشت و اسنادی را که از `api/index.js`
وارد شده بودند نمی‌دید.

راه‌حل صحیح:
بانک اسناد باید تا زمان مهاجرت به PostgreSQL از همان `api/index.js` و همان Repository بوت‌شده استفاده کند.

این بسته شامل:
- `api/document-bank-core.js`
- `api/document-bank.js`
- `PATCH_API_INDEX.txt`
- `vercel.json`

در PATCH_API_INDEX.txt تغییر دقیق `api/index.js` آمده است.
