export const betaEvent = {
  id: 'honest-feedback-2026-09',
  status: 'preview' as const,
  title: '써본 이야기를 들려주세요',
  shortDescription:
    '솔직한 사용 후기와 실제 공유에 참여하면 추첨으로 신세계백화점 상품권을 드려요.',
  prize: '신세계백화점 상품권 100만원 상당',
  winners: '1명',
  entryPeriod: '2026년 9월 1일 ~ 9월 30일',
  announcementDate: '2026년 10월 7일',
  noticeStorageKey: 'insurance-rights-os:event-notice:honest-feedback-2026-09:v1',
} as const;

export const betaEventEntryRules = [
  {
    title: '서비스 안에서 솔직한 후기 남기기',
    detail: '좋았던 점, 불편했던 점, 틀린 내용 모두 괜찮아요. 후기 내용과 상관없이 1회 인정해요.',
  },
  {
    title: '내가 실제로 공유한 곳 알려주기',
    detail: 'SNS나 커뮤니티에 한 번 공유하면 1회 더 인정해요. 같은 글을 반복해서 올리면 인정하지 않아요.',
  },
] as const;

export const betaEventSafetyNotes = [
  '앱스토어·구글플레이 별점이나 리뷰는 응모 조건이 아니에요.',
  '좋은 평가를 요구하지 않으며, 비판적인 후기도 똑같이 추첨해요.',
  '한 사람당 최대 2회까지만 추첨 대상이 돼요.',
  '거짓 후기, 반복 게시, 자동화된 공유, 다른 사람의 글 도용은 제외해요.',
] as const;
