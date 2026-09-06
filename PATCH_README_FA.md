# Build 0.9.0.3 — Repository / AI Isolation Hotfix

این Patch دو اصل را اعمال می‌کند:

1. مخزن اسناد دیگر در زمان Boot به ماژول‌های AI وابسته نیست.
   import مستقیم semanticProvider از بالای Service حذف شده و فقط هنگام «شروع تحلیل» به‌صورت dynamic import بارگذاری می‌شود.

2. knowledgeDocuments دیگر super.knowledgeDocuments را صدا نمی‌زند.
   فهرست مخزن مستقیماً و دفاعی از Repository خوانده می‌شود و برای آرایه‌های قدیمی/ناقص runtime_state نیز safe است.

هدف: باز شدن مخزن اسناد حتی اگر AI Provider یا لایه تحلیل شناختی اشکال جداگانه داشته باشد.

Health: 0.9.0.3
