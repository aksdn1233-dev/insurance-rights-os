import { describe, expect, it } from '@jest/globals';

import {
  containsSensitiveInformation,
  isFeedbackKind,
  validateFeedback,
} from '@/domain/feedback';

describe('feedback validation', () => {
  it('accepts a plain anonymous improvement suggestion', () => {
    expect(
      validateFeedback({
        kind: 'improvement',
        message: '병원 검색 결과에서 주차 가능 여부를 먼저 보고 싶어요.',
        confirmedNoSensitiveInfo: true,
        acceptedRetention: true,
      }),
    ).toBeNull();
  });

  it('rejects contact details and resident registration numbers', () => {
    expect(containsSensitiveInformation('연락처는 010-1234-5678입니다.')).toBe(true);
    expect(containsSensitiveInformation('이메일 test@example.com으로 답해주세요.')).toBe(true);
    expect(containsSensitiveInformation('주민번호 900101-1234567')).toBe(true);
  });

  it('requires enough detail and explicit sensitive-info confirmation', () => {
    expect(
      validateFeedback({
        kind: 'review',
        message: '좋아요',
        confirmedNoSensitiveInfo: true,
        acceptedRetention: true,
      }),
    ).toBe('too_short');
    expect(
      validateFeedback({
        kind: 'review',
        message: '설명이 쉬워서 보험 확인 순서를 이해했어요.',
        confirmedNoSensitiveInfo: false,
        acceptedRetention: true,
      }),
    ).toBe('confirmation_required');
    expect(
      validateFeedback({
        kind: 'review',
        message: '설명이 쉬워서 보험 확인 순서를 이해했어요.',
        confirmedNoSensitiveInfo: true,
        acceptedRetention: false,
      }),
    ).toBe('retention_consent_required');
  });

  it('only accepts the three public feedback categories', () => {
    expect(isFeedbackKind('bug')).toBe(true);
    expect(isFeedbackKind('rating')).toBe(false);
  });
});
