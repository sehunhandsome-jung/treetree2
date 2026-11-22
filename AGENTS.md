# 나무나무 (NamuNamu)

친환경 활동을 사진으로 인증하면 AI가 판별해서 식물(토마토)을 키우고 포인트를 받는 게이미피케이션 앱.
요일별로 나만의 미션을 정하는 챌린지 기능도 있다.

> 이 문서는 `CLAUDE.md`와 같은 내용을 담는다. 둘 중 하나만 고치지 말 것.

## 스택 & 구조

- **프론트엔드**: Vite + React 19 + TypeScript, `react-router-dom`으로 라우팅. 모바일 레이아웃 전용(`MobileLayout` + `BottomNav`).
- **백엔드**: `server/index.ts` 하나짜리 Express 5 서버. **Groq**의 OpenAI 호환 `responses` API로 이미지 검증, `multer`로 업로드, 데이터는 `server/data.json`에 직접 read/write (DB 없음).
  - `openai` SDK를 그대로 쓰되 `baseURL`만 `https://api.groq.com/openai/v1`로 지정. `.env`에 `GROQ_API_KEY` 필요.
- **개발 서버**: `npm run dev` (Vite, `/api` → `localhost:3001` 프록시) + `npm run server` (Express)를 각각 따로 띄워야 함.
- **주의**: 상위 폴더(`../`)에 예전 스캐폴딩 잔재가 남아있음 — 실제 프로젝트 루트는 여기(`treetree2/treetree2`).

## AI 판별 — 건드리면 안 되는 제약

- **모델은 `qwen/qwen3.8-27b`** (`.env`의 `GROQ_MODEL`로 교체 가능).
- **`reasoning: { effort: "none" }`을 반드시 유지할 것.** 추론을 켜면 요청 하나가 출력 토큰 660개 이상을 쓰는데 무료 티어 분당 출력 한도(OTPM)가 1,000이라 사실상 분당 1회밖에 못 쓴다. 끄면 43토큰이다. 이 옵션은 Qwen3.8 이상에서만 지원되므로 **`qwen/qwen3.6-27b`로 되돌리면 안 된다**(3.6은 추론 강제 → 300토큰 안에 JSON을 못 끝내고 `Failed to validate JSON`으로 실패).
- **판정 기준(criterion)은 반드시 한국어로 작성할 것.** 영어로 두면 모델이 그 단어를 판정 이유에 그대로 섞어 쓴다(같은 이미지 6회 테스트: 영어 기준 2회 오염 vs 한국어 기준 0회). 최악의 경우 영어 사고 과정을 통째로 출력한다("Wait instruction strictly says…").
- 한자 혼입도 관측돼서("단순한 색块") 지시문에 한글 외 문자 금지를 명시해 두었다. 판정 이유는 마이페이지·캘린더·실패 안내에 그대로 노출되므로 사용자에게 바로 보인다.
- **무료 티어 한도**: 분당 출력 1,000 토큰(OTPM), 분당 입력 7,000 토큰(ITPM). 이미지 1장이 입력 2,300토큰 정도라 **이미지 인증은 분당 약 3회**가 한계다. 연속 테스트 시 429가 난다.
- 업로드 상한은 12MB (Groq이 요청 전체를 20MB로 제한하고 base64가 약 1.33배로 늘어남). 클라이언트에서 긴 변 1280px JPEG로 줄여 보낸다(`src/utils/resizeImage.ts`).

## 지금까지 되어 있는 것

- **페이지**: Login(더미, 인증 없이 `/home`) → Home → Activity(사진 인증) → ActivityComplete → Garden(`growthStages.ts` 6단계) → HarvestComplete → **Challenges(요일별 챌린지)** → Rewards → MyPage. 임직원 플로우와 별개로 **Corporate(`/corporate`, 기업용 ESG 리포트)** 가 있다.
- **활동 인증 플로우**: `Activity.tsx` → `/api/verify` → Groq이 `VALID/INVALID/UNCERTAIN` JSON 반환 → `VALID`일 때만 성장치/포인트 지급.
- **요일별 챌린지**: `Challenges.tsx`에서 월~일 각 요일에 사용자가 직접 미션을 설정(localStorage, `clientId`별). 해당 요일에 사진으로 인증하면 `/api/challenges/verify`가 AI 판정 후 **고정 +50P**(성장률은 올리지 않음)를 지급하고 월간 캘린더에 완료 표시. 보상값은 `server/index.ts`의 `CHALLENGE_POINT_REWARD` 상수.
  - 미션 문구는 사용자 입력이라 프롬프트 주입 방지 문구를 넣어 "판정 대상 데이터"로만 다루게 했다.
  - 완료 기록은 미션 제목·설명을 **완료 시점 스냅샷**으로 저장한다. 나중에 미션을 수정·삭제해도 과거 기록은 바뀌지 않는다.
- **기업용 ESG 리포트**: `/corporate`에서 기업 코드를 넣고 "레포트 만들기"를 누르면 `POST /api/corporate/report`가 인증 기록을 집계해 8개 섹션짜리 리포트를 돌려준다(경영진 요약 → 핵심 지표 → 활동별 상세 → 주별 추이 → 공시 기준 연계 → 데이터 해석 → 개선 제안 → 산정 방법·한계). 인쇄 버튼으로 PDF 저장이 되도록 `@media print`에서 액자·배경을 걷어낸다.
  - **숫자는 코드가, 문장만 AI가 쓴다.** ESG 보고서는 제3자 검증을 받는 공시 자료라 LLM이 감축량을 지어내면 허위기재가 된다. 모든 수치는 `server/esgReport.ts`의 `buildEsgMetrics()`가 결정론적으로 계산하고, 모델에는 확정된 수치만 넘겨 해설 3단락만 받는다. **이 구조를 뒤집지 말 것.**
  - **환산 계수는 아직 전부 미검증이다.** `IMPACT_FACTORS`의 모든 항목이 `source: null`이라 리포트에 "출처 미확인"으로 표시되고 경고 문구가 뜬다. 공식 배출계수로 교체할 때 `value`와 `source`를 **함께** 채워야 경고가 사라진다.
  - 한국어 검사는 블랙리스트가 아니라 **화이트리스트**(`ALLOWED_REPORT_CHARS`)다. `[A-Za-z]{3,}` 방식은 베트남어(`Tiểu`)처럼 라틴 확장 문자가 끼면 뚫린다. 걸리면 해당 항목만 한 번 더 생성하고, 두 번 실패하면 기본 문구로 대체한다.
  - 기업 구분은 `.env`의 `CORPORATE_CODE`(기본값 `namunamu-esg`) 하나뿐인 **임시 장치**다. 실제 계정 시스템이 아니다.
  - 보고 기간 양 끝의 주는 7일이 다 안 들어가서 막대가 짧게 나오므로 `*`로 표시한다(`isPartialWeek`).
- **시연용 샘플 데이터**: `npm run seed:sample`이 가상 임직원 48명의 최근 90일치 기록(활동 약 620건, 챌린지 약 250건)을 `data.json`에 **추가**한다. `npm run seed:sample -- --clear`로 되돌린다.
  - 샘플 `clientId`는 전부 `sample-` 접두사라 지울 때 접두사로만 골라낸다. **실제 사용자 기록은 건드리지 않는다.**
  - 고정 시드(mulberry32)라 몇 번을 돌려도 같은 데이터가 나온다. 시연 중 숫자가 바뀌지 않는다.
  - 앱의 부정 사용 방지 규칙을 그대로 지켜서 만든다(활동은 사람·날짜·종류당 1건, 챌린지는 사람·날짜당 1건). 참여 열의가 사람마다 다르고 도입 초기일수록 적게 만들어, 주별 추이가 우상향하도록 했다.
  - 보상값(`growth`/`points`)은 `server/index.ts`의 `activityRewards`와 **손으로 맞춘 복사본**이다. 활동 보상을 바꾸면 여기도 고쳐야 한다.
- **부정 사용 방지(서버)**: 이미지 SHA-256 해시 중복 체크(활동·챌린지가 **같은 해시 목록 공유** → 같은 사진 재사용 불가), 하루 1회 제한(활동은 `clientId:date:activity`, 챌린지는 `clientId:date`), 저장 직전 재검증(레이스 컨디션 대비), 날짜는 전부 서버가 `Asia/Seoul` 기준으로 결정(클라이언트가 보낸 날짜는 신뢰하지 않음).
- **클라이언트 상태**: 계정 시스템 없이 `clientId`(localStorage UUID)로 구분. `GardenContext`가 `points`/`growth`/`harvestCount` 보관. 챌린지 포인트는 의미가 드러나도록 `addPoints()`를 쓴다(`completeActivity(0, n)` 금지). 리워드 교환 내역·요일별 미션도 localStorage.
- **개발용**: `/api/dev/reset-today`, `/api/dev/reset-all`(챌린지 기록도 함께 초기화) — Activity 페이지 하단. 체험용 빌드에서는 접혀 있고 위험한 버튼은 숨겨진다(`src/utils/devMode.ts`, `?dev=1`/`?dev=0`).
  - **서버에서도 막는다**: `--serve-client`로 띄운 공개 서버(`npm run demo`, `npm start`)에서는 `/api/dev/*`가 403을 돌려준다. 이 API는 인증이 없어서 화면에서 버튼만 숨기면 누구든 요청으로 전체 기록을 지울 수 있기 때문이다. 꼭 필요하면 `ENABLE_DEV_API=1`.
- **활동 종류(10개, 여러 곳에 하드코딩)**: 텀블러 사용, 대중교통 이용, 분리배출, 장바구니 사용, 자전거 이용, 다회용 식기 사용, 리필 제품 이용, 플로깅 참여, 헌옷 기부, 폐가전 재활용.

## 다음에 할 일 (발견된 갭)

1. **실제 로그인 없음**: Login 페이지는 아이디·비밀번호를 검사하지 않고 무조건 `/home`으로 이동. 소셜 버튼과 회원가입·찾기는 "준비중" 안내(`/coming-soon`)만 연결됨. 계정을 붙이려면 `clientId` 기반 로직 전체를 재설계해야 함.
2. **활동 목록 5중 관리**: 활동 10개가 `src/pages/Activity.tsx`(표시·이모지), `server/index.ts`(`activityRewards`), `src/hooks/useActivityRecords.ts`(`getActivityEmoji`), `server/esgReport.ts`(`IMPACT_FACTORS`), `server/seedSampleData.ts`(`ACTIVITY_SPECS`)에 각각 하드코딩돼 있다. **활동 이름 문자열이 키라서** 한 곳만 고치면 조용히 어긋난다(계수가 없으면 감축량 0으로 집계되고 "출처 미확인"에만 뜸). 공유 설정 파일로 통합 필요. (챌린지의 `CHALLENGE_POINT_REWARD=50`도 `Challenges.tsx`·`TodayChallengeCard.tsx`에 표시용으로 중복돼 있음)
3. **빈 스텁 파일**: `server/activityRules.ts`, `server/verifyActivity.ts`가 비어 있음. 채우거나 삭제할지 결정 필요.
4. **데이터 영속성**: `server/data.json` 단일 파일 + 프로세스 메모리 — 다중 인스턴스나 프로덕션엔 부적합.
5. **개발용 UI 노출**: Activity 하단 테스트 도구가 일반 사용자에게도 보임(체험 빌드에서는 접힘). 초기화 API는 공개 서버에서 막혀 있지만 "내 오늘 활동 초기화" 버튼은 그대로 보이고 누르면 안내 문구만 뜬다. 배포 전 정리 필요.
6. **상위 폴더 정리**: 부모 폴더의 옛 스캐폴딩 잔재.
7. **ESG 환산 계수 미검증**: `server/esgReport.ts`의 `IMPACT_FACTORS` 11개(챌린지 포함)가 전부 `source: null`인 추정치다. 환경부 온실가스 배출계수·탄소중립포인트 운영지침 등 공신력 있는 출처로 교체해야 리포트를 실제 공시에 쓸 수 있다. **그 전까지는 대외용으로 쓰면 안 된다.**
8. **서버 타입체크 없음**: `npm run build`의 `tsc -b`는 `tsconfig.app.json`(프론트)만 본다. `server/*.ts`는 `tsx`가 타입을 지우고 실행할 뿐이라 타입 오류가 런타임까지 간다.

## 실행 방법

```bash
npm run server   # Express 백엔드 (포트 3001, .env에 GROQ_API_KEY 필요)
npm run dev      # Vite 프론트엔드
```

- `.env`는 `GROQ_API_KEY` 필수, `GROQ_MODEL`·`CORPORATE_CODE`·`PORT`·`DATA_FILE`·`ENABLE_DEV_API`·`SEED_SAMPLE_DATA`는 선택.
- 서버는 파일을 다시 읽지 않으므로 `server/*.ts`를 고쳤으면 **반드시 재시작**해야 한다. 안 그러면 새 엔드포인트가 404로 나온다.

### 외부 체험(QR 접속)용

```bash
npm run demo                                     # 빌드 후 Express가 화면+API를 3001 한 포트로 제공 (--serve-client)
cloudflared tunnel --url http://localhost:3001   # 출력되는 https://*.trycloudflare.com 주소를 QR로
```

- 터널 주소는 실행할 때마다 바뀌므로 QR은 터널을 띄운 뒤에 만든다. PC가 절전에 들어가면 접속이 끊긴다.

### 클라우드 배포 (Railway 등)

PC 없이 고정 주소로 쓰려면 Node 서버 호스팅에 올린다. 빌드 명령은 `npm run build`, 시작 명령은 `npm start`(= `--serve-client`라 화면+API를 `PORT` 한 포트로 제공).

- **영구 디스크(볼륨)가 반드시 필요하다.** 기록이 `data.json` 파일이라 코드 폴더에 두면 재배포·재시작 때마다 사라진다. 볼륨을 `/data` 같은 곳에 붙이고 `DATA_FILE=/data/data.json`으로 지정한다(`server/dataPath.ts`, 폴더가 없으면 만든다). Vercel·Netlify 같은 서버리스는 파일을 쓸 수 없어서 안 된다.
- 호스팅 설정에 넣을 환경변수: `GROQ_API_KEY`(필수), `DATA_FILE`, `CORPORATE_CODE`(기본값 말고 다른 값으로).
- `SEED_SAMPLE_DATA=1`을 주면 `npm start`가 **데이터 파일이 아직 없을 때만** 샘플 데이터를 넣는다(`seedSampleData.ts --auto`). 이미 파일이 있으면 아무것도 안 하므로 재시작해도 중복으로 들어가지 않는다.
- `server/data.json`은 실제 사용자 기록이라 `.gitignore`에 넣었다. 배포 서버는 빈 기록(또는 샘플)에서 시작한다.
- `tsx`는 서버 실행에 필요해서 `dependencies`에 있다(devDependencies로 옮기면 배포 환경에서 시작이 실패할 수 있다). Node는 22.12 이상(`engines`).
