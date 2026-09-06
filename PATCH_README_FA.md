# Build 0.9.0.4 — Stable API Boundary Restore

این نسخه به‌جای Patch کردن دوباره knowledgeDocuments، مرز معماری را به حالت پایدار برمی‌گرداند:

- API در زمان Boot فقط KnowledgeCognitiveService پایدار را import و instantiate می‌کند.
- CognitiveDocumentUnderstandingService و کل زنجیره 0.9 فقط هنگام فراخوانی endpointهای تحلیل شناختی، با dynamic import بارگذاری می‌شوند.
- بنابراین «مخزن اسناد»، داشبورد، افزودن سند و سایر مسیرهای پایه هیچ وابستگی Boot-time به موتور جدید 0.9 ندارند.
- endpointهای cognitive-analysis همچنان از موتور جدید 0.9 استفاده می‌کنند.

این طراحی عملاً Stable Core و Experimental Cognitive Layer را جدا می‌کند.

Health: 0.9.0.4
