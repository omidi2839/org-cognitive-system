# SINA AI Gateway V1 — 0.9.9.1.0
Baseline: 0.9.9.0.35

## Environment Variables
- OPENAI_API_KEY = Secret Key کامل
- SINA_AI_ENABLED = true
- SINA_AI_PROVIDER = openai
- SINA_AI_MODEL = gpt-5.6-terra (اختیاری؛ اگر تعریف نشود همین مدل پیش‌فرض است)
- SINA_AI_MAX_OUTPUT_TOKENS = 800 (اختیاری)
- SINA_AI_TIMEOUT_MS = 45000 (اختیاری)

## Endpointهای تست
GET /api/v1/ai/status
POST /api/v1/ai/test
Body:
{"prompt":"در یک جمله خودت را به عنوان سینا معرفی کن."}

این نسخه فقط Gateway امن Backend و تست Provider را فعال می‌کند.
UI اصلی سینا هنوز به پاسخ آزاد مدل متصل نشده است؛ Tool Calling بانک اسناد مرحله بعدی است.
