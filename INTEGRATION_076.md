# 0.7.6 Integration
در index.html و public/index.html:
- بعد از workspace-shell-075.css این را اضافه کنید: <link rel="stylesheet" href="./knowledge-workspace-076.css">
- بعد از workspace-shell-075.js این را اضافه کنید: <script src="./knowledge-workspace-076.js"></script>

در workspace-shell-075.js و public/workspace-shell-075.js دو مورد «اسناد بالادستی» و «اسناد عمومی» را به activeCapabilities اضافه کنید.

در uploadDocument در src/application/service.js فیلدهای input.metadata را روی document ذخیره کنید:
documentClass, documentType, issuer, versionLabel, issuedAt, validUntil, validityStatus, organizationalLevel, subjectArea.

نسخه health/package را به 0.7.6 تغییر دهید.
