# Build 0.7.3.2 — Deployment Integrity Correction

This patch fixes deployment drift discovered during Online Review.

- The command API path is tested end-to-end.
- The exact Persian management-attention scenario must resolve to `workspace.cognitive_attention`.
- `cross_object` remains a generic fallback only.
- Health reports `0.7.3.2` so the online build can be verified unambiguously.
- `vercel.json` remains deployment-safe and contains no explicit runtime override.

Online acceptance gate: the same scenario must show Cognitive Attention in the deployed UI before proceeding to Management Agenda.
