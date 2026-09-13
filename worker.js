import indexHandler from './api/index.js';
import knowledgeDocumentsHandler from './api/knowledge-documents.js';
import documentQueryHandler from './api/document-query.js';
import documentRelationsHandler from './api/document-relations.js';
import documentRepositoryDiagnosticHandler from './api/document-repository-diagnostic.js';
import documentStructureHandler from './api/document-structure.js';
import documentBankHandler from './api/document-bank-09582.js';
import topicSuggestionsHandler from './api/topic-suggestions-09582.js';
import testDataResetHandler from './api/test-data-reset.js';
import pingHandler from './api/ping.js';

function headersToObject(headers) {
  const out = {};
  for (const [k, v] of headers.entries()) out[k.toLowerCase()] = v;
  return out;
}

async function requestBody(request) {
  if (request.method === 'GET' || request.method === 'HEAD') return undefined;
  const ct = request.headers.get('content-type') || '';
  const text = await request.text();
  if (!text) return undefined;
  if (ct.includes('application/json')) {
    try { return JSON.parse(text); } catch { return text; }
  }
  return text;
}

function makeNodeLikeResponse() {
  let statusCode = 200;
  const headers = new Headers();
  const chunks = [];

  return {
    get statusCode() { return statusCode; },
    set statusCode(v) { statusCode = Number(v) || 200; },
    setHeader(name, value) {
      const key = String(name);
      if (Array.isArray(value)) {
        headers.delete(key);
        for (const item of value) headers.append(key, String(item));
      } else {
        headers.set(key, String(value));
      }
    },
    getHeader(name) { return headers.get(String(name)); },
    write(chunk) {
      if (chunk == null) return true;
      chunks.push(chunk instanceof Uint8Array ? chunk : new TextEncoder().encode(String(chunk)));
      return true;
    },
    end(chunk) {
      if (chunk != null) this.write(chunk);
      return buildResponse(statusCode, headers, chunks);
    },
    _response() {
      return buildResponse(statusCode, headers, chunks);
    }
  };
}

function buildResponse(status, headers, chunks) {
  if (!chunks.length) return new Response(null, { status, headers });
  let total = 0;
  for (const c of chunks) total += c.byteLength;
  const body = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    body.set(c, offset);
    offset += c.byteLength;
  }
  return new Response(body, { status, headers });
}

const routes = [
  ['/diag/ping', pingHandler],
  ['/api/v1/knowledge/document-query', documentQueryHandler],
  ['/api/v1/knowledge/document-relations', documentRelationsHandler],
  ['/api/v1/admin/test-data-reset', testDataResetHandler],
  ['/api/v1/knowledge/topic-suggestions', topicSuggestionsHandler],
  ['/api/v1/knowledge/document-structure', documentStructureHandler],
  ['/api/v1/auth/session', knowledgeDocumentsHandler],
  ['/api/v1/knowledge/document-file-access', knowledgeDocumentsHandler],
  ['/api/v1/knowledge/document-file-content', knowledgeDocumentsHandler],
  ['/api/v1/knowledge/documents', knowledgeDocumentsHandler],
  ['/api/v1/diagnostics/document-repository', documentRepositoryDiagnosticHandler],
  ['/api/v1/knowledge/document-bank', documentBankHandler],
  ['/api/v1/knowledge/document-governance', knowledgeDocumentsHandler],
  ['/api/v1/knowledge/collaborative-analysis', knowledgeDocumentsHandler],
  ['/api/v1/knowledge/blob-upload-url', knowledgeDocumentsHandler],
  ['/api/v1/knowledge/database-migration', knowledgeDocumentsHandler],
  ['/api/v1/knowledge/macro-knowledge', knowledgeDocumentsHandler],
  ['/api/v1/ai/status', documentQueryHandler],
  ['/api/v1/ai/test', documentQueryHandler],
  ['/api/v1/ai/command', documentQueryHandler],
  ['/api/v1/bulk-intake/preflight', documentQueryHandler],
  ['/api/v1/bulk-intake/classify', documentQueryHandler],
  ['/api/v1/bulk-intake/commit', documentQueryHandler],
  ['/api/v1/bulk-intake/discard', documentQueryHandler],
  ['/api/v1/cognitive-followups', documentQueryHandler],
  ['/api/v1/documents/upload', indexHandler],
];

function pickHandler(pathname) {
  for (const [path, handler] of routes) {
    if (pathname === path) return handler;
  }
  if (pathname.startsWith('/api/v1/')) return indexHandler;
  return null;
}

async function runLegacyHandler(handler, request) {
  const url = new URL(request.url);
  const req = {
    url: url.pathname + url.search,
    method: request.method,
    headers: headersToObject(request.headers),
    body: await requestBody(request),
  };
  const res = makeNodeLikeResponse();

  const result = await handler(req, res);
  if (result instanceof Response) return result;
  if (result && typeof result.arrayBuffer === 'function') return result;
  return res._response();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const handler = pickHandler(url.pathname);

    if (handler) {
      try {
        return await runLegacyHandler(handler, request);
      } catch (error) {
        console.error('CLOUDFLARE_API_ADAPTER_ERROR', error);
        return Response.json(
          { code: error?.code || 'INTERNAL_ERROR', message: error?.message || 'خطای داخلی' },
          { status: 500 }
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};
