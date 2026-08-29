# Architecture

## 1. 구현 원칙

- iOS/Android 공통 코드베이스를 우선하되 내비게이션, 안전 영역, 촉각 피드백, 파일 선택은 OS 관례를 따른다.
- 규칙·증거·준비도·결과학습은 UI에서 분리된 순수 TypeScript 도메인으로 구현한다.
- 결정론적 rule/search가 1순위다. 모델은 애매한 문구의 구조화 보조만 수행하며 최종 상태를 단독 확정하지 않는다.
- 외부 연동마다 `live → upload → manual → fixture` 순의 대체 경로를 둔다.
- 약관과 규칙은 배포 버전과 독립적으로 버전 고정하고 재현 가능해야 한다.

## 2. Phase 0 구조

```text
Expo mobile UI
  ├─ Home / Family / Hospital / Insurance tabs
  ├─ Vertical slice workflow
  └─ App store (session + AsyncStorage boundary)
         │
Domain application services
  ├─ Policy Graph builder
  ├─ Medical Event Graph builder
  ├─ Claim Radar
  ├─ Evidence Engine
  ├─ Claim Readiness
  └─ Outcome Learning Engine
         │
Ports
  ├─ PolicySource
  ├─ MedicalEventSource
  ├─ DocumentSource
  ├─ ClaimChannel
  ├─ OutcomeSource
  ├─ HospitalDirectorySource
  ├─ OfficialServiceNavigator
  └─ AuditSink
         │
Phase 0 adapters
  ├─ FixturePolicySource
  ├─ ManualMedicalEventSource
  ├─ ExpoDocumentPickerSource + MockDocumentSource
  ├─ SimulatedClaimChannel
  ├─ SimulatedOutcomeSource
  ├─ HiraHospitalOpenApiSource (개발키 필요)
  ├─ NHIS / 내보험찾아줌 / 실손24 / HIRA official web navigator
  └─ LocalAuditSink
```

## 3. 실행 경계

### 클라이언트

초기 앱은 데모 가능한 로컬 vertical slice를 포함한다. 계약/진료/문서/결과 fixture가 명시적으로 “테스트 데이터”로 표시된다. 실제 제품에서 원문 의료·보험 데이터는 클라이언트 장기 저장을 최소화하고 암호화 저장소 또는 서버의 사용자별 vault로 이동한다.

### 향후 서버

- Graph ingestion: 계약·약관·진료 문서 정규화
- Versioned rule registry: 서명된 규칙 번들, 유효기간, 테스트 결과
- Evidence vault: 원문, 추출값, 해시, 접근 정책
- Claim orchestration: 채널별 제출 상태와 멱등성
- Outcome pipeline: 결과 이벤트, 사유 코드, 규칙 검토 큐
- Audit ledger: append-only 보안 감사와 사용자용 설명 기록 분리

## 4. 엔진 계약

모든 엔진 응답은 다음 envelope를 가진다.

```ts
type EngineEnvelope<T> = {
  result: T;
  provenance: ProvenanceRef[];
  audit: AuditEvent[];
  ruleBundleVersion: string;
  evaluatedAt: string;
};
```

Claim Radar는 보험금 액수를 확정하지 않고 `candidate`, `needs_review`, `not_matched`만 반환한다. Evidence Engine은 근거의 존재를 보장하지만 법적 해석의 확정을 의미하지 않는다. Outcome Learning은 관측된 결과를 기록하되 규칙을 자동 승격하지 않는다.

## 5. 데이터 흐름과 재현성

1. 입력 원문을 수집하고 출처·동의·수집시각을 부여한다.
2. 정규화 시 원문 값과 정규화 값을 함께 저장한다.
3. 그래프 노드와 edge에 source ref를 붙인다.
4. 탐지 시 policy version, rule bundle, event snapshot을 고정한다.
5. 사용자에게 노출한 설명문과 근거를 audit에 남긴다.
6. 결과 수신 시 원 탐지 run과 연결한다.
7. 같은 snapshot과 rule bundle로 동일 결과를 재현한다.

## 6. 외부 연동 fallback

| 기능 | Live | 업로드 | 직접입력 | Fixture |
|---|---|---|---|---|
| 보험계약 | 보험사/마이데이터 adapter | 증권 PDF/이미지 | 계약 핵심항목 | 테스트 계약 |
| 약관 | 약관 repository | PDF | 조항 메모 + 검증대기 | 테스트 약관 |
| 진료 이벤트 | 의료/청구 adapter | 진료서류 | 오늘 병원 다녀왔어요 | 용종 제거 이벤트 |
| 서류 | 병원/공공 adapter | 파일/촬영 | 보유 여부 | 테스트 서류 |
| 청구 | 실손24/보험사 adapter | 제출 묶음 export | 채널 안내 | 가상 제출 |
| 결과 | 보험사 callback | 지급내역 업로드 | 결과 입력 | 가상 지급/거절 |

## 6.1 현재 공식 연결 상태

| 대상 | 연결 방식 | 현재 상태 | 개인 결과를 앱으로 수신 |
|---|---|---|---|
| 국민건강보험 환급금 | 공식 조회 URL | 즉시 사용 가능 | 안 함 |
| 내보험찾아줌 | 공식 조회 URL | 즉시 사용 가능 | 안 함 |
| 실손24 | 공식 청구 URL | 즉시 사용 가능 | 안 함 |
| HIRA 건강지도 | 공식 병원 찾기 URL | 즉시 사용 가능 | 해당 없음 |
| HIRA 병원정보서비스 | REST/XML adapter | 개발키 입력 시 사용 | 병원 공개정보만 |

공식 웹 연결은 민감한 인증값이나 조회 결과를 앱으로 전달하지 않는다. 개인 데이터 자동 수신은 공개 API로 가장하지 않고 기관·보험사 제휴와 사용자 동의가 확보된 뒤 별도 adapter로 구현한다. HIRA 개발키의 `EXPO_PUBLIC_` 사용은 Phase 0 로컬 시험에 한정하며, 운영에서는 server-side proxy, 키 보관, rate limit, cache를 적용한다.

## 7. 기술 선택

- Expo SDK 57, React Native, TypeScript, Expo Router
- React Context + reducer로 Phase 0 상태 전이를 명시적으로 관리
- AsyncStorage는 비민감 데모 진행상태에만 사용하며 실제 민감정보 저장소로 간주하지 않는다.
- Jest로 순수 도메인과 상태 전이를 테스트한다.
- 운영 단계: PostgreSQL + row-level tenancy, object vault, KMS envelope encryption, queue/outbox, OpenTelemetry를 우선 검토한다.

## 8. 배포 단위

- `mobile`: 소비자 앱
- `domain`: 그래프/레이더/증거/준비도/결과학습
- `rule-bundles`: 서명·버전 관리되는 결정론적 규칙
- `adapters`: 보험/의료/문서/청구 채널
- `expert-console`(별도): 등록 손해사정 전문가 검토

Phase 0는 한 저장소 안에서 모듈 경계만 먼저 지키고, 실제 서비스 분리는 부하·보안·조직 소유권이 확인된 뒤 수행한다.

## 9. 실패 처리

- 입력 누락: 결과를 `needs_review`로 낮추고 필요한 정보 표시
- 약관 버전 불명: 후보 표시를 중단하고 버전 확인 task 생성
- 업로드 실패: 파일을 전송 완료로 오인하지 않고 재시도/fixture 선택 제공
- 중복 청구: claim fingerprint와 멱등키로 방지
- 외부 채널 장애: 준비 묶음을 보존하고 제출 대기 상태 유지
- 모델 불확실: 구조화 값에 confidence와 원문 위치를 남기고 사람이 확인

## 10. ADR 목록

- ADR-001: Expo/React Native 공통 코드베이스
- ADR-002: deterministic-first claim discovery
- ADR-003: immutable policy version and evidence snapshot
- ADR-004: expert review as a separate regulated layer
- ADR-005: offline-capable fixture vertical slice before integrations
