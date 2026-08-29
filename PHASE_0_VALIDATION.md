# Phase 0 Validation

검증일: 2026-08-29  
환경: macOS arm64, Node.js 22.14.0, npm 10.9.2  
기준: Expo SDK 57 / React Native 0.86 / React 19.2 / TypeScript 6

## 1. 결론

Phase 0 기준선과 첫 vertical slice는 **통과**했다. 보험사 제휴 API 없이 테스트 계약 등록부터 용종 제거 이벤트, 후보 탐지, 근거, 서류, 준비도, 가상 제출, 지급/거절, Outcome Learning까지 완주한다. 공식 기관 연결은 별도 안전 경계로 추가했다.

이 통과는 제품·기술 검증이며 실제 보험금 지급 적격성, 정식 법률 검토, 실데이터 보안 인증을 의미하지 않는다.

## 2. 문서 게이트

| 기준 문서 | 결과 | 확인 내용 |
|---|---|---|
| `MASTER_PRODUCT_SPEC.md` | 통과 | 제품 정의, 4탭, 6개 엔진, 30개 이벤트, vertical slice |
| `ARCHITECTURE.md` | 통과 | deterministic-first, ports/adapters, fallback, 재현성 |
| `DESIGN_SYSTEM.md` | 통과 | 비금전 과장, typography/whitespace, 금지 시각 언어 |
| `REGULATORY_BOUNDARIES.md` | 통과 | 후보/사정 경계, 전문가 Layer, 의료·부정사용 경계 |
| `DATA_MODEL.md` | 통과 | Policy/Medical Graph, evidence, claim, outcome, audit |
| `SECURITY_MODEL.md` | 통과 | 최소수집, 암호화, 접근제어, 삭제, 감사, rule 공급망 |
| `TEST_STRATEGY.md` | 통과 | 위험 기반 피라미드, 30 fixture, 회귀·출시 게이트 |

상호 점검 결과 “확인 후보”와 “지급 판정”이 모든 문서에서 분리돼 있고, LLM 단독 판정과 보험금 중심 병원 추천은 범위 밖으로 고정돼 있다.

## 3. 구현 게이트

| 항목 | 결과 | 증거 |
|---|---|---|
| 4탭 | 통과 | 홈/가족/병원/내 보험 라우트와 모바일 탭 |
| 테스트 계약 | 통과 | 약관 버전과 보장 개시일이 고정된 fixture |
| Medical Event | 통과 | 용종 제거 개념, 날짜, 필수 사실과 출처 |
| Claim Radar | 통과 | 결정론적 concept/date/required-attribute rule |
| Evidence Engine | 통과 | 조항 경로, 버전, snapshot hash, match reason |
| 파일 fallback | 통과 | OS 파일은 확인 대기, 테스트 서류 3종은 명시적 fixture |
| Claim Readiness | 통과 | 필수서류별 accepted 상태, 33%/100% 계산 |
| 가상 청구 | 통과 | readiness 100%일 때만 제출 |
| Outcome Learning | 통과 | 지급은 monitor, 거절은 전문가 rule-review 큐 |
| Audit/provenance | 통과 | 각 엔진 envelope와 상태 전이에 correlation 기록 |
| 민감정보 경계 | 통과 | Phase 0 저장값은 fixture/진행상태만 사용 |

## 4. 자동 검증 결과

### `npm run test:phase0`

- TypeScript strict typecheck: 통과
- Jest: 7 suites, 19 tests 전부 통과
- Expo ESLint: 오류·경고 없이 통과
- 30개 이벤트: 정확히 30개, ID/concept 고유성 확인
- 필수 회귀: 후보/추가확인/보장개시 전/무일치/provenance 통과
- 준비도: 일부 서류 33%, 전체 검수 100% 통과
- Outcome: 지급/거절 모두 자동 규칙 변경 `false` 확인

### Expo 구성과 bundle

- `npx expo-doctor`: 21/21 통과
- `npx expo export --platform web`: 성공, static route 13개
- `npx expo export --platform ios`: 성공, Hermes bundle 생성
- `npx expo export --platform android`: 성공, Hermes bundle 생성

## 5. 시각·상호작용 검증

390×844 모바일 viewport에서 실제 web build를 열어 다음 경로를 클릭으로 완주했다.

`홈 → 테스트 계약 → 용종 제거 → 확인 후보 → 약관 근거 → 테스트 서류 → 준비도 → 가상 제출 → 가상 거절 → 전문가 검토 큐`

확인 결과:

- 홈의 typography, whitespace, 우선 행동, 4탭이 의도대로 렌더링됨
- 모든 단계에 테스트 데이터 표시가 유지됨
- 후보 화면에 “지급 확정 아님”과 보험사 심사 경계가 노출됨
- 거절 결과가 과도한 실패 연출 없이 규칙 검토 큐로 연결됨
- 브라우저 console error/warning 0건

## 6. 의존성 보안 확인

`npm audit --omit=dev` 결과 high 0, critical 0, moderate 11이다. moderate 항목은 Expo 57의 build/config toolchain이 사용하는 `xcode → uuid` 경로와 그 파생 항목이다. audit가 제안하는 자동 수정은 Expo 46으로의 호환 불가능한 major downgrade이므로 적용하지 않았다.

출시 전 조치:

- Expo SDK 57 patch와 upstream advisory를 추적한다.
- CI에서 high/critical 0 gate와 SBOM을 유지한다.
- 실제 배포 pipeline에서 해당 build 도구의 입력 경계를 검토한다.
- 호환되는 upstream fix가 나오면 SDK 검증 후 즉시 갱신한다.

## 7. 잔여 위험과 다음 구현 게이트

- 30개 중 실제 end-to-end 지급 후보 rule은 용종 제거 1개뿐이다. 나머지는 executable catalog이며 약관 corpus 검증 후 순차 활성화해야 한다.
- 현재 약관과 결과는 synthetic fixture다. 실제 약관 ingestion, OCR, 버전 식별 정확도는 아직 검증하지 않았다.
- iOS/Android bundle은 성공했지만 실제 기기에서 파일 권한, Dynamic Type, VoiceOver/TalkBack smoke test가 남아 있다.
- AsyncStorage는 fixture demo 상태에만 적합하다. 실데이터 도입 전 OS secure storage + 서버 vault로 교체해야 한다.
- 실제 보험사 callback과 개인 조회 결과 수신은 제휴 전이라 연결하지 않았다. 실손24는 공식 청구 화면으로 연결한다.
- 등록 손해사정 전문가 console, 자격 검증, 동의·보수·이해상충 flow는 다음 별도 Layer다.

## 8. Phase 0 판정

**PASS — 다음 단계는 실제 약관 corpus의 버전 고정 ingestion과 30개 이벤트별 검증 규칙 확장이다.**

단, 실사용자 데이터 수집이나 실제 청구 제출 전에는 법률·개인정보·보안·파트너 심사를 별도 통과해야 한다.

## 9. 쉬운 금융 UX 개편 검증

2026-08-28 추가 개편에서 전체 사용자 문장을 초등학교 고학년 수준의 생활 언어로 바꿨다. `Claim Radar`, `Evidence Engine`, `Claim Readiness`, `fixture`, `Guardian` 같은 내부 용어는 사용자 화면에서 제거했다.

- 홈 질문: “병원에 다녀오셨나요?”
- 후보: “확인할 보험이 1개 있어요”
- 근거: “왜 확인해야 하는지 알려드릴게요”
- 준비도: “서류를 모두 준비했어요”
- 결과학습: “전문가가 다시 살펴봐요”

회색 canvas, 흰 surface, 파란 주 행동, 큰 제목, 화면당 한 개의 주 버튼으로 금융앱의 빠른 리듬을 구현하되 특정 앱의 고유 화면은 복제하지 않았다. 390×844 화면에서 첫 화면과 1단계 보험 불러오기 화면을 다시 검수했으며, typecheck·19개 테스트·lint가 모두 통과했다.

## 10. 첫 설치 안내와 환급금 찾기

- 첫 설치 4단계 길잡이: 홈/가족/병원/내 보험을 순서대로 안내
- 1회 노출: 완료 여부를 별도 로컬 키에 저장
- 다시 보기: 내 보험 탭에서 수동 재실행
- 환급금 찾기: 숨은 보험금/놓친 청구/병원비 환급 3개 출처를 분리
- 공식 연결 전 금액 추정 금지, 연결 필요 상태 표시
- 390×844에서 길잡이 4단계와 환급금 조회 결과를 클릭 검증
- 브라우저 runtime error 0건, typecheck·19개 테스트·lint 통과

## 11. 공식 서비스 연결 검증

2026-08-29에 공개 문서와 공식 도메인을 다시 확인하고 다음 연결을 구현했다.

- 국민건강보험 환급금 조회/신청: 공식 로그인 경로
- 내보험찾아줌: 생명보험협회·손해보험협회 공식 조회 경로
- 실손24: 보험개발원 공식 청구 경로
- HIRA 건강지도: 공식 병원 찾기 경로
- HIRA 병원정보서비스: `getHospBasisList` REST/XML adapter와 응답 parser

개인 결과를 제공하는 세 기관은 공개 무인 API로 가장하지 않고 본인인증이 이뤄지는 공식 화면에서 조회하도록 분리했다. HIRA API는 무료이지만 활용신청과 서비스키가 필요하므로, 키가 없는 현재 화면에는 “준비 중”을 표시하고 건강지도 fallback을 제공한다.

자동 검증은 7 suites, 19 tests로 늘었으며 공식 HTTPS domain allowlist, 본인인증 경계 metadata, HIRA XML parsing을 포함한다.

## 12. 공개 배포 전 실사용 시뮬레이션

390×844 모바일 viewport와 production web server에서 다음을 반복 검증했다.

- 첫 설치 안내 4단계 완주와 완료 후 미노출
- 지급 시나리오 8단계 완주, 결과 금액 표시, 새로고침 후 이어보기
- 거절 시나리오 8단계 완주, 전문가 검토 큐, 규칙 자동 변경 금지
- 환급금 연습 조회에서 가짜 금액 미표시, 공식기관 3개 경로 노출
- 가족 동의 경계, HIRA 키 미설정 fallback, 내 보험 상태 연동
- GitHub Pages 하위 경로에서 탭·modal·개인정보 안내·직접 URL 새로고침

검증 중 실제 파일 선택이 내용 검수 없이 `accepted`로 처리되던 문제를 발견해 수정했다. 이제 실제 파일명은 보존하지 않고 `needs_review`로 남으며 readiness에 포함되지 않는다. 손상된 AsyncStorage 값은 앱을 멈추지 않고 첫 단계로 복구한다. 공식사이트 열기 실패 시 시스템 브라우저 fallback을 사용하고, 공개 베타의 데이터 처리 범위를 앱 안에 추가했다.

최종 결과: browser runtime error 0, Expo Doctor 21/21, test 19/19, iOS/Android/Web export 성공.

## 13. 보험사 지도와 공식 고객센터 검증

2026-08-29에 생명보험협회 회원사 정보, 손해보험협회 고객센터 정보, 하나손해보험·카카오페이손해보험·예별손해보험 공식 고객센터 페이지를 대조해 대표번호 디렉터리를 추가했다.

- 생명보험 20개사, 손해보험 18개사 대표번호·공식 홈페이지·근거 URL 수록
- 구 MG손해보험, DGB생명 등 옛 이름과 지도 지점명을 현재 회사에 연결
- 병원/보험사 지도 레이어 분리, 보험사 전용 마커·검색·길찾기·로드뷰 제공
- 지도 지점 번호가 없을 때만 공식 대표 고객센터 번호로 보완
- Leaflet 엔진 앱 번들 포함, 지도 전환 중 중복 초기화 회귀 수정
- 위치 검색은 Nominatim → Overpass → 서울 OSM snapshot 순으로 복구
- 390×844 로컬 화면에서 서울 시청 주변 보험사 15곳과 대표번호 연결 확인
- `삼성` 축약 검색 4곳, `교보생명` 정확 검색 4곳 확인
- 생명보험 20개·손해보험 18개 전체 목록 전환과 주요 대표번호 확인

자동 검증은 9 suites, 28 tests로 늘었으며 디렉터리 개수, 별칭 매칭, 전화 링크, 공식 출처 유효성을 포함한다.
