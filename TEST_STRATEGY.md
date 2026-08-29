# Test Strategy

## 1. 품질 목표

가장 중요한 실패는 “받을 수 있다고 오해시키는 오탐”, “확인할 권리를 놓치는 누락”, “잘못된 약관 버전을 근거로 제시”, “서류가 준비됐다고 잘못 표시”, “민감정보가 잘못 노출”이다. 일반 UI 결함보다 이 위험을 먼저 막는다.

## 2. 테스트 피라미드

- Domain unit: 그래프 정규화, 날짜/대기기간, 규칙 일치, readiness, outcome signal
- Contract: source/claim/outcome adapter의 공통 계약과 fallback
- Component: 결과 언어, 근거/버전 표시, 누락 서류, 접근성 label
- Flow integration: 테스트 계약부터 결과학습까지 상태 전이
- E2E: iOS/Android 실제 파일 선택, 중단/재개, offline, 접근성
- Security/privacy: 권한, tenant 격리, 로그 redaction, 삭제 전파

## 3. 초기 30개 이벤트셋

각 fixture는 다음을 가진다.

- 원문형 사용자 표현과 정규화 concept
- 이미 발생한 정상 진료라는 전제
- 계약/약관 버전
- 기대 상태: candidate / needs_review / not_matched
- 반드시 표시할 근거 또는 open question
- 필요한 서류
- 반례 1개 이상: 날짜, 대기기간, 제외, 필수 속성 누락

30개 전체는 catalog 구조·금지 카피·provenance 존재 여부를 자동 검증한다. Phase 0의 실제 end-to-end rule은 용종 제거를 기준으로 하며 나머지 이벤트는 규칙 확장 backlog의 executable fixture로 유지한다.

## 4. 필수 회귀 케이스

1. 같은 용종 제거라도 계약이 없으면 후보가 나오지 않는다.
2. 약관 버전이 없으면 `needs_review`이며 조항을 만들어내지 않는다.
3. 보장 개시 전 이벤트는 후보가 아니다.
4. 이벤트 concept만 같고 필수 속성이 누락되면 추가 확인이다.
5. 업로드가 실패하면 서류 보유로 계산하지 않는다.
6. 모든 필수서류가 검수돼야 readiness가 100%다.
7. readiness 100%는 지급 확정 문구로 번역되지 않는다.
8. 거절 결과가 기존 rule을 자동 변경하지 않고 review signal만 만든다.
9. 모든 candidate에 policy/event/clause provenance가 있다.
10. 감사로그 metadata에 진단 원문·증권번호 전체가 없다.
11. 첫 설치 길잡이는 4탭을 한 번씩 안내하고 완료 뒤 자동 재노출되지 않는다.
12. `내 보험`의 다시 보기로 길잡이를 재실행할 수 있다.
13. 환급금 조회는 공식 연결 전 금액을 표시하지 않는다.
14. 사용자가 고른 서류는 실제 검수 전 readiness에 포함하지 않는다.
15. 고른 파일의 실제 이름은 상태 저장소에 남기지 않는다.
16. 손상되거나 불가능한 로컬 상태는 첫 단계로 안전하게 복구한다.
17. GitHub Pages 하위 경로에서 탭·modal·새로고침이 모두 작동한다.

## 5. 설명·카피 테스트

빌드와 콘텐츠 lint에서 다음 금지 표현을 검사한다.

- `무조건 지급`, `확정 지급`, `보험금 많이 나오는 병원`
- `병원 가서 용돈`, `시술로 돈 벌기`
- `AI 판정`, `AI가 보장`

테스트 fixture의 expected copy는 “확인 후보”, “추가 확인”, “보험사 심사 결과로 확정”을 포함한다.

## 6. 성능과 신뢰성

- 로컬 100계약×1,000이벤트×5,000규칙 synthetic benchmark
- discovery p95 목표: 서버 2초, 기기 demo 250ms
- adapter timeout/circuit breaker, retry 멱등성
- 같은 snapshot + bundle에서 결정론적 동일 결과
- rule bundle rollback 15분 이내

## 7. 접근성/기기 matrix

- iOS 최신/직전 2개, Android API target/최소/주요 제조사
- 작은 화면, 태블릿, Dynamic Type 200%, TalkBack/VoiceOver
- light/dark, Reduce Motion, 저속 네트워크, offline
- 한국어 줄바꿈, 긴 보험사/특약명, 날짜/금액 locale

## 8. 출시 게이트

- typecheck, lint, unit/integration, 30 fixtures 통과
- iOS/Android smoke test와 web export 성공
- critical/high 보안 이슈 0
- 후보 결과 provenance 100%
- 법무 승인 없는 지급 확정/병원 수익 추천 카피 0
- 삭제/동의철회/Guardian 권한 시나리오 통과

## 9. Phase 0 실행 명령

```bash
npm run typecheck
npm test
npm run lint
npm run test:phase0
npx expo export --platform web
```

결과는 `PHASE_0_VALIDATION.md`에 환경, 명령, 통과/실패, 잔여 위험과 함께 기록한다.
