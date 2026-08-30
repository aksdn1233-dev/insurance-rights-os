export const feedbackKinds = ['review', 'improvement', 'bug'] as const;
export type FeedbackKind = (typeof feedbackKinds)[number];

export const feedbackKindLabels: Record<FeedbackKind, string> = {
  review: '사용 후기',
  improvement: '개선 아이디어',
  bug: '오류 제보',
};

export const FEEDBACK_MIN_LENGTH = 10;
export const FEEDBACK_MAX_LENGTH = 1000;

export type FeedbackValidationError =
  | 'invalid_kind'
  | 'too_short'
  | 'too_long'
  | 'sensitive_information'
  | 'confirmation_required'
  | 'retention_consent_required';

const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const mobilePhonePattern = /01[016789][\s-]?\d{3,4}[\s-]?\d{4}/;
const residentNumberPattern = /\d{6}[\s-]?[1-4]\d{6}/;

export function isFeedbackKind(value: unknown): value is FeedbackKind {
  return typeof value === 'string' && feedbackKinds.some((kind) => kind === value);
}

export function containsSensitiveInformation(message: string): boolean {
  return (
    emailPattern.test(message) ||
    mobilePhonePattern.test(message) ||
    residentNumberPattern.test(message)
  );
}

export function validateFeedback(input: {
  kind: unknown;
  message: string;
  confirmedNoSensitiveInfo: boolean;
  acceptedRetention: boolean;
}): FeedbackValidationError | null {
  if (!isFeedbackKind(input.kind)) return 'invalid_kind';
  const length = input.message.trim().length;
  if (length < FEEDBACK_MIN_LENGTH) return 'too_short';
  if (length > FEEDBACK_MAX_LENGTH) return 'too_long';
  if (containsSensitiveInformation(input.message)) return 'sensitive_information';
  if (!input.confirmedNoSensitiveInfo) return 'confirmation_required';
  if (!input.acceptedRetention) return 'retention_consent_required';
  return null;
}
