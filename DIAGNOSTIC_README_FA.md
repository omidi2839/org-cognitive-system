# Build 0.9.0.5 — Repository Diagnostic Probe

این نسخه برای جلوگیری از Patch حدسی، یک endpoint تشخیصی مرحله‌ای اضافه می‌کند:

GET /api/v1/diagnostics/repository

خروجی، بدون نمایش secretها، این مراحل را جداگانه تست می‌کند:
1. repository.health
2. repository.all
3. shape داده runtime_state
4. service.knowledgeDocuments(upstream)

اگر Function حتی قبل از handler crash کند، همین endpoint هم پاسخ JSON نمی‌دهد؛ در آن صورت مشکل Boot/Platform است.
اگر JSON بدهد، دقیقاً مرحله خراب و message/code واقعی مشخص می‌شود.

هیچ منطق داده یا تحلیل شناختی در این Build تغییر نکرده است.
Health: 0.9.0.5
