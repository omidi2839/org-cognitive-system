# Build 0.9.0.8 — Restore Missing Mock Gateway

Root cause confirmed:
api/index.js imports src/ai/mockGateway.js, but that file is missing from the current repository.

Git history shows that src/ai was deleted in commit:
bccd4d6fd33b0802baea68061728e139c0e0863c

This patch restores exactly:
src/ai/mockGateway.js

No other files are changed.
