# Build 0.7.3.1 — Online Review Corrections

## Fixed
- Natural-language managerial attention requests now route to `workspace.cognitive_attention` before generic `workspace.cross_object` fallback.
- Human-reported management signals are marked as unvalidated, non-canonical evidence for attention triage.
- Specialized workspace renderer now initializes the workspace object before cognitive/meeting/agenda renderers use it.
- Health/version metadata updated to 0.7.3.1.

## Governance
- User-reported signal ≠ validated organizational fact.
- Attention ≠ authority.
- Specific Intent > Generic Intent.

## Regression
The exact online-review scenario about 62% plan realization, delays, possible impact on organizational goals, and management attention is covered by an automated regression test.

## Verification
`npm run check`: 111 tests passed, 0 failed.
