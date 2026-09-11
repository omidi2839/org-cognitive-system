# 0.9.9.0.11 — Macro Knowledge Route Fix

رفع خطای «مسیر پیدا نشد» در صفحه دانش کلان.

علت: رابط کاربری مسیر `/api/v1/knowledge/macro-knowledge` را فراخوانی می‌کرد، اما در برخی شکل‌های dispatch موجود، مسیر داخل handler به شکل کوتاه‌شده `/macro-knowledge` یا `macro-knowledge` می‌رسید و شرط نسخه 0.9.9.0.10 آن را نمی‌پذیرفت.

اصلاح:
- route matcher دانش کلان با هر سه شکل canonical/full/stripped سازگار شد.
- API top-level جدید اضافه نشده است.
- همه قابلیت‌های 0.9.9.0.10 حفظ شده‌اند.
