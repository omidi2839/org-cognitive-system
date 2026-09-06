# Build 0.9.0 — Contextual Semantic Understanding & Cognitive Question Generation V1

## تغییر معماری
Rule Engine قبلی دیگر موتور اصلی پرسش نیست. Provider abstraction اضافه شد:
- AI_PROVIDER=openai → OpenAI Responses API + Structured Outputs
- AI_PROVIDER=deterministic → fallback محدود و صادقانه

## خروجی AI
Document Zones → Claims → Concepts/Roles → Relations → Ambiguities → Claim-specific Questions

## اصل سؤال
سؤال از ابهام و رابطه خاص همان گزاره تولید می‌شود، نه Template ثابت برای هر Concept.

## ساختار سند
مدل موظف است Title/Heading/Label/Ceremonial/Preamble را از Body جدا کند. فقط Body به Claim تبدیل می‌شود.
Fallback نیز «بسم الله»، «متن مصوبه:»، «رسالت ...:» و Headingهای مشابه را حذف می‌کند.

## UI
Evidence Accordion حفظ شد و از آبی تند به سبز-آبی بسیار ملایم تغییر کرد.

## فعال‌سازی AI واقعی
در Vercel Environment Variables:
AI_PROVIDER=openai
AI_MODEL=gpt-5.6-sol
AI_API_KEY=<secret>
AI_BASE_URL=https://api.openai.com/v1
بدون AI_API_KEY، سامانه عمداً به deterministic fallback می‌رود و ادعای AI واقعی ندارد.
