import type { EventCatalogItem, MedicalEvent, PolicyContract } from './types';

export const RULE_BUNDLE_VERSION = 'phase0.2026-08-28.1';
export const FIXTURE_NOW = '2026-08-28T05:00:00.000Z';

export const initialEventCatalog: EventCatalogItem[] = [
  ['evt-01', '대장 용종 내시경 절제', 'colon_polypectomy', '내시경', 'candidate'],
  ['evt-02', '위 용종 내시경 절제', 'gastric_polypectomy', '내시경', 'needs_review', '절제 방식이 확인됐나요?'],
  ['evt-03', '피부 양성종양 절제', 'benign_skin_excision', '피부', 'needs_review', '조직검사 결과가 있나요?'],
  ['evt-04', '지방종 절제', 'lipoma_excision', '피부', 'needs_review', '수술기록에서 절제 범위를 확인할 수 있나요?'],
  ['evt-05', '손·발톱 제거 처치', 'nail_avulsion', '처치', 'needs_review', '질환 치료 목적의 처치였나요?'],
  ['evt-06', '유방 조직검사', 'breast_biopsy', '검사', 'needs_review', '검사 방식이 기재돼 있나요?'],
  ['evt-07', '갑상선 세침검사', 'thyroid_fna', '검사', 'not_matched'],
  ['evt-08', '자궁경 용종 제거', 'hysteroscopic_polypectomy', '부인과', 'needs_review', '시술명과 마취 방식이 있나요?'],
  ['evt-09', '자궁내막 조직검사', 'endometrial_biopsy', '부인과', 'not_matched'],
  ['evt-10', '요관결석 체외충격파쇄석', 'eswl', '비뇨기', 'needs_review', '치료 횟수와 진단이 확인되나요?'],
  ['evt-11', '요관 스텐트 삽입', 'ureteral_stent', '비뇨기', 'needs_review', '삽입 목적과 수술기록이 있나요?'],
  ['evt-12', '백내장 수술', 'cataract_surgery', '안과', 'needs_review', '수술 방식과 렌즈 종류가 있나요?'],
  ['evt-13', '망막 레이저 치료', 'retinal_laser', '안과', 'needs_review', '치료 목적과 횟수가 확인되나요?'],
  ['evt-14', '녹내장 레이저 치료', 'glaucoma_laser', '안과', 'needs_review', '레이저 시술명이 있나요?'],
  ['evt-15', '고막 절개·환기관 삽입', 'tympanostomy', '이비인후과', 'needs_review', '환기관 삽입 여부가 기재됐나요?'],
  ['evt-16', '비중격 교정술', 'septoplasty', '이비인후과', 'needs_review', '치료 목적 진단을 확인할 수 있나요?'],
  ['evt-17', '편도·아데노이드 수술', 'tonsil_adenoid_surgery', '이비인후과', 'needs_review', '수술 범위가 확인되나요?'],
  ['evt-18', '치핵 수술', 'hemorrhoid_surgery', '외과', 'needs_review', '수술 방식이 기재돼 있나요?'],
  ['evt-19', '서혜부 탈장 수술', 'inguinal_hernia_repair', '외과', 'needs_review', '수술기록을 확보했나요?'],
  ['evt-20', '충수 절제술', 'appendectomy', '외과', 'needs_review', '입퇴원확인서가 있나요?'],
  ['evt-21', '담낭 절제술', 'cholecystectomy', '외과', 'needs_review', '입퇴원확인서와 수술확인서가 있나요?'],
  ['evt-22', '관절 내시경 수술', 'arthroscopy', '정형외과', 'needs_review', '수술 부위와 방식이 확인되나요?'],
  ['evt-23', '인대 봉합·재건술', 'ligament_repair', '정형외과', 'needs_review', '재건 또는 봉합 방식이 있나요?'],
  ['evt-24', '신경 차단술', 'nerve_block', '통증', 'needs_review', '시술 목적과 부위가 확인되나요?'],
  ['evt-25', '골수 검사', 'bone_marrow_exam', '검사', 'not_matched'],
  ['evt-26', '수면다원검사', 'polysomnography', '검사', 'not_matched'],
  ['evt-27', '내시경 초음파 조직검사', 'eus_biopsy', '검사', 'needs_review', '조직 채취 여부가 확인되나요?'],
  ['evt-28', '중심정맥관 삽입', 'central_line_insertion', '처치', 'needs_review', '치료 목적과 시행 기록이 있나요?'],
  ['evt-29', '응급실 내원 후 귀가', 'er_visit_discharge', '응급', 'needs_review', '응급실 내원확인서가 있나요?'],
  ['evt-30', '당일 입원·퇴원 수술', 'same_day_surgery', '입원', 'needs_review', '입원 인정 시간과 수술명이 확인되나요?'],
].map(([id, label, concept, category, initialExpectedStatus, requiredQuestion]) => ({
  id,
  label,
  concept,
  category,
  initialExpectedStatus: initialExpectedStatus as EventCatalogItem['initialExpectedStatus'],
  requiredQuestion,
}));

export const fixturePolicy: PolicyContract = {
  id: 'policy-fixture-001',
  insurer: '가온손해보험 (연습용)',
  productName: '생활보장 건강보험 (연습용)',
  insuredPersonId: 'person-self',
  policyVersionId: 'policy-terms-fixture-v2024-01',
  coverageStartDate: '2024-01-15',
  source: 'fixture',
  coverages: [
    {
      id: 'coverage-disease-surgery-a',
      title: '질병 수술 보험 (연습용)',
      benefitLabel: '보험에는 20만원으로 적혀 있어요 · 실제 지급은 보험사가 결정해요',
      triggerConcepts: ['colon_polypectomy'],
      requiredAttributes: ['procedureConfirmed', 'treatmentPurposeConfirmed'],
      documentRequirements: [
        {
          id: 'doc-procedure',
          kind: 'procedure_confirmation',
          title: '수술·시술 확인서',
          reason: '시술명과 시행일을 확인해요.',
        },
        {
          id: 'doc-itemized',
          kind: 'itemized_statement',
          title: '진료비 세부내역서',
          reason: '실제 시행된 처치 내역을 대조해요.',
        },
        {
          id: 'doc-receipt',
          kind: 'medical_receipt',
          title: '진료비 영수증',
          reason: '진료일과 의료기관을 확인해요.',
        },
      ],
      evidence: {
        clauseId: 'clause-fixture-surgery-2-1',
        policyVersionId: 'policy-terms-fixture-v2024-01',
        path: '테스트 약관 > 질병수술특약 > 제2조 제1항',
        title: '질병 수술 보험금 (연습용 약관)',
        excerpt:
          '보험에 가입된 사람이 병을 치료하려고 약관에 적힌 수술을 받았다면 보험금을 확인할 수 있습니다.',
        contentHash: 'sha256:fixture-clause-b77314',
        synthetic: true,
      },
    },
  ],
};

export const fixtureColonPolypectomyEvent: MedicalEvent = {
  id: 'medical-event-fixture-001',
  personId: 'person-self',
  occurredAt: '2026-08-25',
  label: '대장 용종 제거 (연습용)',
  concept: 'colon_polypectomy',
  attributes: {
    procedureConfirmed: true,
    treatmentPurposeConfirmed: true,
    facilityName: '늘봄내과 (연습용)',
  },
  source: 'fixture',
};
