# Data Model

## 1. 공통 필드

모든 주요 레코드는 `id`, `tenantId`, `subjectId`, `createdAt`, `updatedAt`, `sourceRefs[]`, `consentRef`, `retentionClass`를 가진다. 변경 가능한 업무 상태와 변경 불가능한 근거 snapshot을 분리한다.

## 2. Policy Graph

### 주요 노드

- `Person`: 본인/가족, Guardian 관계와 범위
- `PolicyContract`: 보험사, 상품, 증권번호 token, 계약/보장 기간, 상태
- `PolicyVersion`: 약관 식별자, 시행일, 수집 출처, 원문 해시
- `Coverage`: 특약, 담보명, 급부 유형, 가입금액, 감액 조건
- `Clause`: 조항 경로, 원문 snapshot, 정의·면책·필요서류 참조
- `EligibilityCondition`: 이벤트 개념, 시점, 횟수, 대기기간, 필수 속성
- `Exclusion`: 면책 조건과 근거 조항

### edge

`Person—insured_by→PolicyContract—uses→PolicyVersion—contains→Coverage—supported_by→Clause`

## 3. Medical Event Graph

### 주요 노드

- `Encounter`: 진료일시, 기관, 외래/입원/응급
- `MedicalEvent`: 원문명, 정규화 concept, 발생일, 속성
- `Diagnosis`, `Procedure`, `Test`, `Medication`: 원문 코드와 표준 concept
- `ClinicalDocument`: 문서 유형, 발급일, 암호화 object ref, 해시
- `Provider`: 기관 식별자, 진료과/서비스, 위치

### edge

`Person—had→Encounter—includes→MedicalEvent—documented_by→ClinicalDocument`

진단과 청구 규칙용 개념은 원문을 대체하지 않는다. 정규화 버전과 mapper provenance를 저장한다.

## 4. Discovery

```ts
type ClaimCandidate = {
  id: string;
  discoveryRunId: string;
  policyId: string;
  policyVersionId: string;
  coverageId: string;
  medicalEventId: string;
  status: 'candidate' | 'needs_review' | 'not_matched';
  matchReasons: Reason[];
  openQuestions: Question[];
  evidenceRefs: string[];
  ruleBundleVersion: string;
  evaluatedAt: string;
};
```

`DiscoveryRun`은 입력 snapshot hash, 검사한 coverage/rule 수, 결과, 설명문 version을 가진다. 후보가 사라지거나 변경돼도 기존 run은 삭제하지 않는다.

## 5. Evidence와 서류

- `EvidenceSnapshot`: 약관/문서 원문 ref, 표시 구간, hash, 획득시각
- `DocumentRequirement`: 문서 종류, 필요한 이유, 발급 조건, 대체 가능 문서
- `DocumentSubmission`: 파일 ref, 업로드/촬영 출처, 품질 상태, 검수 결과
- `ReadinessAssessment`: required/satisfied/missing/rejected IDs, 점수, 평가시각

OCR/모델 추출값은 `extractedValue`, `confidence`, `sourceRegion`, `modelVersion`, `humanVerified`를 별도로 가진다.

## 6. 청구와 결과

- `ClaimPackage`: candidate IDs, 문서, 제출 전 확인, fingerprint
- `ClaimAttempt`: 채널, 멱등키, 제출시각, 상태, 외부 ref
- `ClaimOutcome`: paid/partially_paid/denied/withdrawn, 금액, 사유 원문/정규화, receivedAt
- `LearningSignal`: event concept, coverage, rule version, outcome, review state
- `RuleReview`: 신호 집계로 생성된 검토 task; 승인 전 규칙에 영향 없음

## 7. 감사와 provenance

```ts
type ProvenanceRef = {
  sourceType: 'policy_clause' | 'user_input' | 'document' | 'fixture' | 'external';
  sourceId: string;
  version?: string;
  contentHash?: string;
  capturedAt: string;
};

type AuditEvent = {
  id: string;
  actorType: 'user' | 'system' | 'expert' | 'partner';
  action: string;
  subjectRefs: string[];
  at: string;
  correlationId: string;
  metadata: Record<string, string | number | boolean>;
};
```

보안 감사로그에는 민감한 원문을 넣지 않고 opaque ID와 변경 종류만 둔다. 사용자용 활동기록은 설명 가능한 문장으로 별도 생성한다.

## 8. 삭제 모델

- 사용자가 삭제하면 업무 DB에서 즉시 비활성화하고 접근을 차단한다.
- object vault, 검색 index, 분석 store에 tombstone을 전파한다.
- 법적 보존 의무가 없는 데이터는 정책 SLA 내 crypto-shredding/물리 삭제한다.
- 보존이 필요한 감사 이벤트는 민감 payload를 제거하고 최소 식별자만 격리 보관한다.
- 삭제 진행과 완료를 사용자에게 제공한다.
