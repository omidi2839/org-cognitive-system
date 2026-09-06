# Build 0.9.0.9 — Static Dependency Graph

Root cause refinement:
- `src/ai/mockGateway.js` exists in GitHub.
- Vercel still reports it missing at runtime.
- Current `api/index.js` loads that file via dynamic import.
- This build restores the stable dependencies as top-level static imports so Vercel's function tracer/bundler must include them in the serverless bundle.

Statically imported:
- repositoryFactory.js
- mockGateway.js
- knowledgeService0764.js
- storageFactory.js

The experimental cognitive service remains lazy-loaded.

After deploy test:
1. /api/v1/health
2. /api/v1/diagnostics/cold-boot
3. /api/v1/knowledge/documents?class=upstream

Health version: 0.9.0.9
