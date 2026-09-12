# 0.9.9.0.16 — SINA UI Freeze Hotfix

علت هنگ نسخه 0.9.9.0.15، MutationObserver سراسری هویت «سینا» بود که کل document را با subtree=true
مشاهده می‌کرد و callback آن دوباره DOM را تغییر می‌داد. این چرخه می‌توانست main thread مرورگر را اشباع کند.

اصلاح:
- MutationObserver سراسری به‌طور کامل حذف شد.
- اعمال هویت فقط در نقاط محدود DOMContentLoaded، load و دو اجرای زمان‌بندی‌شده انجام می‌شود.
- sinaApplyIdentity idempotent شد و فقط در صورت تفاوت واقعی DOM را تغییر می‌دهد.
- هیچ‌یک از قابلیت‌های میز پژوهش، دانش کلان یا هویت سینا حذف نشده است.
