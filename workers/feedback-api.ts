import {
  isFeedbackKind,
  validateFeedback,
  type FeedbackValidationError,
} from '../src/domain/feedback';

const MAX_BODY_BYTES = 4096;
const allowedOrigins = new Set([
  'https://insurance-rights-korea.pages.dev',
  'https://aksdn1233-dev.github.io',
  'http://localhost:8081',
  'http://localhost:8092',
  'http://127.0.0.1:8081',
  'http://127.0.0.1:8092',
]);

type JsonRecord = Record<string, unknown>;

function isJsonRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;
  return /^https:\/\/[a-z0-9-]+\.insurance-rights-korea\.pages\.dev$/.test(origin);
}

function responseHeaders(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    Vary: 'Origin',
  };
  if (origin && isAllowedOrigin(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function jsonResponse(body: JsonRecord, status: number, origin: string | null): Response {
  return Response.json(body, { status, headers: responseHeaders(origin) });
}

async function readBoundedJson(request: Request): Promise<JsonRecord | null> {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(body));
    return isJsonRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeSourcePath(value: unknown): string {
  if (typeof value !== 'string') return '/';
  const withoutQuery = value.split('?')[0];
  return /^\/[a-z0-9()/_-]{0,100}$/i.test(withoutQuery) ? withoutQuery : '/';
}

function validationMessage(error: FeedbackValidationError): string {
  return error;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function preflight(origin: string | null): Response {
  if (!isAllowedOrigin(origin)) {
    return jsonResponse({ ok: false, error: 'origin_not_allowed' }, 403, origin);
  }
  return new Response(null, {
    status: 204,
    headers: {
      ...responseHeaders(origin),
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Max-Age': '86400',
    },
  });
}

async function submit(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get('Origin');
  if (!isAllowedOrigin(origin)) {
    return jsonResponse({ ok: false, error: 'origin_not_allowed' }, 403, origin);
  }

  const rateKey = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const rateLimit = await env.FEEDBACK_RATE_LIMITER.limit({ key: rateKey });
  if (!rateLimit.success) return jsonResponse({ ok: false, error: 'rate_limited' }, 429, origin);
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
    return jsonResponse({ ok: false, error: 'invalid_content_type' }, 415, origin);
  }

  const body = await readBoundedJson(request);
  if (!body || body.website !== '') {
    return jsonResponse({ ok: false, error: 'invalid_request' }, 400, origin);
  }
  const message = typeof body.message === 'string' ? body.message.trim().replace(/\r\n/g, '\n') : '';
  const validationError = validateFeedback({
    kind: body.kind,
    message,
    confirmedNoSensitiveInfo: body.confirmedNoSensitiveInfo === true,
    acceptedRetention: body.acceptedRetention === true,
  });
  if (validationError) {
    return jsonResponse({ ok: false, error: validationMessage(validationError) }, 422, origin);
  }
  if (!isFeedbackKind(body.kind)) {
    return jsonResponse({ ok: false, error: 'invalid_kind' }, 422, origin);
  }

  const createdAt = new Date().toISOString();
  const day = createdAt.slice(0, 10);
  const dedupeKey = await sha256(`${day}\n${body.kind}\n${message}`);
  const id = crypto.randomUUID();
  const sourcePath = normalizeSourcePath(body.sourcePath);

  try {
    await env.FEEDBACK_DB.prepare(
      `INSERT INTO feedback_entries
        (id, kind, message, source_path, dedupe_key, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, body.kind, message, sourcePath, dedupeKey, createdAt)
      .run();
    return jsonResponse({ ok: true, receipt: id.slice(0, 8).toUpperCase() }, 201, origin);
  } catch (error) {
    const duplicate = error instanceof Error && error.message.includes('UNIQUE constraint failed');
    if (duplicate) return jsonResponse({ ok: false, error: 'duplicate' }, 409, origin);
    console.error(JSON.stringify({ event: 'feedback_insert_failed', error: 'database_error' }));
    return jsonResponse({ ok: false, error: 'server_error' }, 500, origin);
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    if (request.method === 'OPTIONS') return preflight(request.headers.get('Origin'));
    if (request.method === 'POST') return submit(request, env);
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405, request.headers.get('Origin'));
  },
} satisfies ExportedHandler<Env>;
