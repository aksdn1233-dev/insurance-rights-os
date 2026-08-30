import { Platform } from 'react-native';

import type { FeedbackKind } from '@/domain/feedback';

type FeedbackSubmission = {
  kind: FeedbackKind;
  message: string;
  sourcePath: string;
  confirmedNoSensitiveInfo: true;
  acceptedRetention: true;
};

type FeedbackResponse = {
  ok: boolean;
  receipt?: string;
  error?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const productionEndpoint = 'https://insurance-rights-feedback-api.aksdn1233.workers.dev';

function getFeedbackEndpoint(): string {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return productionEndpoint;
  return productionEndpoint;
}

export async function submitFeedback(input: FeedbackSubmission): Promise<FeedbackResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(getFeedbackEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, website: '' }),
      signal: controller.signal,
    });
    const result: unknown = await response.json();
    if (!isRecord(result)) return { ok: false, error: 'invalid_response' };
    const payload = result;
    return {
      ok: payload.ok === true && response.ok,
      receipt: typeof payload.receipt === 'string' ? payload.receipt : undefined,
      error: typeof payload.error === 'string' ? payload.error : undefined,
    };
  } catch {
    return { ok: false, error: 'network_error' };
  } finally {
    clearTimeout(timeout);
  }
}
