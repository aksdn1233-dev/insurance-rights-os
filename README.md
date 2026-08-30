# 권리찾기 · 공개 베타

사용자의 보험계약·약관 버전·이미 발생한 정상 진료 이벤트를 대조해 놓치기 쉬운 보험 권리의 **확인 후보**를 찾고, 근거부터 서류 준비, 가상 청구, 결과학습까지 연결하는 iOS/Android 중심 Expo 앱입니다.

권리 발견 엔진은 명시적인 테스트 데이터로 작동합니다. 공식 기관의 개인 조회 결과를 복제하지 않으며 보험금 지급을 판정하거나 보증하지 않습니다.

현재 공개 베타에서 실사용 가능한 범위는 공식 환급·보험금 조회 화면 연결과 안전한 제품 흐름 체험입니다. 실제 보험계약 자동수집, 실제 약관 판정, 보험금 청구 대행은 아직 제공하지 않습니다.

- 공개 베타(기본): https://insurance-rights-korea.pages.dev/
- GitHub Pages 예비 주소: https://aksdn1233-dev.github.io/insurance-rights-os/
- GitHub: https://github.com/aksdn1233-dev/insurance-rights-os

## 실행

Node.js 22.13 이상이 필요합니다.

```bash
npm install
npm start
```

개발 서버에서 `i`, `a`, `w`를 눌러 iOS Simulator, Android emulator, web을 열 수 있습니다.

## 지금 연결된 공식 서비스

- 국민건강보험 `환급금 조회/신청`: 공식 로그인 화면 연결
- 생명보험협회·손해보험협회 `내보험찾아줌`: 공식 조회 화면 연결
- 보험개발원 `실손24`: 공식 청구 화면 연결
- 건강보험심사평가원 `건강지도`: 공식 병원 찾기 연결
- 건강보험심사평가원 `병원정보서비스 Open API`: 개발키가 있으면 앱 안 병원명 검색
- 생명보험협회·손해보험협회 공식 목록: 생명보험 20개사와 손해보험 18개사의 대표 고객센터 확인·전화 연결

개인 환급금·숨은 보험금·실손 청구는 각 기관의 본인인증 화면에서 사용자가 직접 진행합니다. 앱은 주민번호, 인증서, 기관 비밀번호를 받지 않습니다.

심평원 Open API를 로컬에서 시험하려면 `.env.example`을 참고해 `.env`에 개발키를 넣고 Expo 서버를 다시 시작합니다. `EXPO_PUBLIC_` 값은 앱 번들에 포함되므로 운영에서는 이 키를 넣지 않고 서버 프록시와 호출량 제한을 사용해야 합니다.

병원 지도는 키가 없어도 OpenStreetMap 공개 데이터로 동작합니다. 카카오 장소검색·스카이뷰·화면 안 로드뷰를 사용하려면 `.env.local`에 `EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY`를 넣고 카카오 디벨로퍼스에서 `http://localhost:8081`과 배포 도메인을 JavaScript SDK 허용 도메인으로 등록하세요. 공개 클라이언트 키이므로 도메인 제한은 필수입니다.

같은 지도 화면의 `보험사 찾기`에서는 주변 보험사 지점·본사를 별도 마커로 표시합니다. 공개 지도에 지점 전화가 없으면 보험사 이름을 공식 디렉터리와 대조해 대표 고객센터 번호를 표시하며, 회사 홈페이지·길찾기·로드뷰로 이어집니다. 지도 데이터에 빠진 지점이 있을 수 있으므로 화면 아래의 협회 공식 목록도 함께 제공합니다.

GitHub Pages에서는 저장소 Actions secret `EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY`가 있으면 카카오 지도로 자동 빌드되고, 없으면 공개 지도와 카카오 길찾기·로드뷰 바로가기를 사용합니다.

## 검증

```bash
npm run test:phase0
npx expo export --platform web
```

`test:phase0`는 TypeScript, 도메인/vertical-slice 테스트, lint를 순서대로 실행합니다.

Cloudflare Pages 기본 배포는 프로젝트 루트에서 다음 명령으로 갱신합니다.

```bash
npm run deploy:cloudflare
```

배포용 web build는 GitHub Pages 하위 경로를 포함해 생성합니다.

```bash
EXPO_DEPLOY_BASE_URL=/insurance-rights-os npm run build:web
```

## 완성된 첫 vertical slice

`테스트 계약 등록 → 용종 제거 이벤트 → 보장 후보 → 약관 근거 → 필요서류 → 파일 선택/mock fallback → Claim Readiness → 가상 청구 → 가상 지급/거절 → Outcome Learning`

보험사 제휴 API 없이도 완주할 수 있습니다. 실제로 고른 파일은 내용과 이름을 저장하거나 전송하지 않고 `확인 필요`로만 표시합니다. 테스트 서류 3종을 선택해야 연습 제출까지 계속됩니다. 공식 조회·청구는 별도 버튼으로 각 기관에 안전하게 넘깁니다.

## 구조

```text
src/app             Expo Router 화면과 4탭
src/components      제품 UI primitive
src/domain          결정론적 Radar, Evidence, Readiness, Outcome
src/integrations    공식 서비스 링크와 심평원 Open API adapter
src/state           vertical slice 상태와 로컬 demo persistence
```

기준 문서는 저장소 루트의 다음 7개 파일입니다.

- `MASTER_PRODUCT_SPEC.md`
- `ARCHITECTURE.md`
- `DESIGN_SYSTEM.md`
- `REGULATORY_BOUNDARIES.md`
- `DATA_MODEL.md`
- `SECURITY_MODEL.md`
- `TEST_STRATEGY.md`

실행 결과와 잔여 위험은 `PHASE_0_VALIDATION.md`에 기록합니다.
