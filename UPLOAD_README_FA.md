# Build 0.8.0 — Multimodal Organizational Knowledge Onboarding Foundation

اصلاح بحرانی: در 0.7.8 موتور تحلیل به doc.normalizedText مراجعه می‌کرد، اما uploadDocument متن واقعی را در normalizedDocuments ذخیره می‌کند. بنابراین DOCX سالم هم به‌اشتباه خالی ارزیابی می‌شد. 0.8.0 منبع canonical را اصلاح می‌کند.

- Quality Gate برای اسناد کوتاه فارسی بازطراحی شد.
- ورودی‌ها: DOCX/PDF/PPTX/XLSX/TXT/MD/PNG/JPG/JPEG/WEBP
- Word/PowerPoint/Excel: استخراج native structured
- PDF: فعلاً text-layer-lite؛ PDF پیچیده/اسکن‌شده نیازمند provider پیشرفته است.
- Image: به‌عنوان artifact شناخته می‌شود ولی بدون Vision/OCR واقعی، متن حدسی ساخته نمی‌شود.
- این Build foundation چندرسانه‌ای است؛ Vision/LLM واقعی هنوز باید در AI Gateway متصل شود.
