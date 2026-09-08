# Hotfix 0.9.5.7.1 — Document Repository Recovery

این بسته کامل و بدون ویرایش دستی است.

علت هدف‌گیری این Hotfix:
بخش «اسناد بالادستی» و «اسناد عمومی» برای دریافت فهرست اسناد به مسیر
`/api/v1/knowledge/documents`
وابسته‌اند. در این نسخه این مسیر از boot کامل API جدا شده و مستقیماً و فقط از Repository خوانده می‌شود.
بنابراین خطای یک ماژول پردازش/Parser نباید مانع نمایش بانک اسناد شود.

مسیر جدید امن:
GET /api/v1/knowledge/documents -> /api/knowledge-documents.js

Diagnostic:
GET /api/v1/diagnostics/document-repository

هیچ داده‌ای حذف یا تغییر داده نمی‌شود.

Build:
window.__DOCUMENT_MEETING_COMMAND_BUILD__
=> 0.9.5.7.1
