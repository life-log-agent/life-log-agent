# DESIGN_HANDOFF.md — life_log v2 구현 핸드오프

> 근거: `DESIGN_BRIEF.md` + `DESIGN_QA.md` v2 검수 결과 (`life_log_new2.zip`)
> 작성일: 2026-06-06 · 코드 작성 전 확인용 문서

---

## 1. 반영할 화면

총 8화면 × (모바일 390×844 + 데스크톱 1280×832) = 16개 아트보드.
구현 우선순위는 서비스 진입 흐름 순.

| 우선순위 | 화면 | 모바일 컴포넌트 | 데스크톱 컴포넌트 | 비고 |
|---------|------|----------------|-----------------|------|
| 1 | 로그인 | `ScreenLogin` | `ScreenLoginDesktop` | **신규 (v2)** Google 단일 소셜 로그인 |
| 2 | 홈 | `ScreenHome` | `ScreenHomeDesktop` | 두더지 mascot + 업로드 CTA |
| 3 | 업로드 | `ScreenUpload` | `ScreenUploadDesktop` | 갤러리 다중 선택 + 메모 힌트 |
| 4 | 처리 상태 | `ScreenProcessing` | `ScreenProcessingDesktop` | **failed 카드 신규 (v2)** + 재시도 버튼 |
| 5 | 타임라인 | `ScreenTimeline` | `ScreenTimelineDesktop` | 날짜별 기록 + 카테고리 칩 |
| 6 | 검색/RAG | `ScreenSearch` | `ScreenSearchDesktop` | 답변 + 근거 기록 |
| 7 | 근거 카드 | `ScreenSources` | `ScreenSourcesDesktop` | RAG 출처 상세 |
| 8 | 항목 상세 | `ScreenDetail` | `ScreenDetailDesktop` | 원본 + OCR + 관련 기억 |

> `ScreenHomeDrawer`는 독립 화면이 아닌 `ScreenHome(showDrawer=true)` 상태 variant로 처리한다.

---

## 2. 반영할 컴포넌트

### 2-A. 공용 UI 프리미티브 (`ui.jsx`)

| 컴포넌트 | 용도 | 주요 props |
|---------|------|-----------|
| `Phone` | 모바일 껍데기 (390×844) | children |
| `StatusBar` | 상단 상태바 | — |
| `AppBar` | 화면 상단 앱바 | `title`, `back`, `right`, `onBack` |
| `Btn` | 버튼 | `variant` (ghost/success/danger/info), `icon`, `style` |
| `Pill` | 상태/카테고리 뱃지 | `tone` (warm/blue/green/red/yellow/purple/pink/gray), `dot` |
| `DemoTag` | 샘플 데이터 표시 | `children` (기본값 "데모용") |
| `Thumb` | 합성 썸네일 | `glyph`, `fname`, `bg`, `h`, `style` |
| `Track` | 진행 바 | `pct`, `tone` (success/info/warn/danger), `thin` |
| `SpeechBubble` | 두더지 말풍선 | `messages`, `onClose` |
| `Sidebar` | 데스크톱 좌측 내비 (220px) | `active` |
| `HamburgerDrawer` | 모바일 드로어 내비 | `isOpen`, `onClose`, `active` |
| `CAT` | 카테고리 맵 (food/travel/shopping/memo) | — |

### 2-B. 두더지 SVG (`ui.jsx` — `MoleSVG`)

| pose 값 | 포즈 | 사용 화면 |
|---------|------|----------|
| `idle` | 두 발 걸치고 앉기 · idle bounce | 홈 |
| `curious` | 고개 갸웃 · 한 발 들기 | 로그인 |
| `holdingPhoto` | 사진 액자 들기 | 업로드 |
| `digging` | 땅 파고 들어가기 | 처리 상태 |
| `surfacing` | 빛나는 카드 들고 솟아오르기 | 검색 결과 |
| `proud` | 엄지척 | 항목 상세 코너 |

### 2-C. 화면별 특수 컴포넌트 (`screens-flow.jsx`)

- `Stages` — 처리 단계 바 (`업로드 → 내용 추출 → 자동 분류 → 색인`, `at` prop으로 현재 단계 표시)

---

## 3. 유지할 색상 / 타이포 / 간격 기준

### 색상 토큰 (전체를 CSS 변수로 사용, 코드에 hex 직접 박지 않는다)

```css
/* 브랜드 */
--primary:    #7B4A2B;   /* 버튼, 강조 텍스트, sidebar active */
--primary-d:  #5A3520;   /* 버튼 그림자 */
--primary-bg: #F5EAE0;   /* active bg, answer card bg */
--accent:     #D4956A;   /* 테두리 강조, bubble 테두리 */
--accent-d:   #B07245;   /* eyebrow 색 */
--surface:    #FAF6F1;   /* 카드/sidebar/dock 배경 */
--bg:         #F5EFE6;   /* 페이지 배경 */
--cream:      #FFF8F2;   /* 말풍선 배경 */

/* 시멘틱 상태 (각각 -bg / 기본 / -d 3단계) */
--green: #34C759  / --blue: #1CB0F6  / --red: #FF3B30
--yellow: #FF9F0A / --purple: #BF5AF2 / --pink: #FF6B9D

/* 텍스트 */
--ink:   #2D1A0A;   /* 본문 */
--ink-2: #4A2E1A;   /* 보조 본문 */
--gray:  #8A7060;   /* muted */
--gray-2:#BCA898;   /* 더 연한 보조 */

/* 선 */
--line:  #E8DDD2;
--line-2:#F0E8E0;

/* 땅속 테마 */
--underground: #1C0C04;
--dirt-dark:   #4A2810;
--dirt-mid:    #6B3E1E;
--dirt-lite:   #9B6B3D;
```

### 타이포그래피

| 클래스/속성 | 크기 | 용도 |
|-----------|------|------|
| `--font-display` (CalSans) | wordmark, 화면 제목 | weight 600 |
| `--font` (Inter) | 본문 전체 | |
| `.h-xl` | 26px | 온보딩 대제목 |
| `.h-lg` | 20px | 섹션 제목 |
| `.h-md` | 16px | 카드 제목 |
| `.eyebrow` | 11px uppercase, letter-spacing 1.2px | 섹션 레이블 |
| 본문 | 13–15px, weight 600–700 | |
| 보조 `.muted.tiny` | 12px | 날짜·장소·설명 |
| 최소 허용 | 11px | DemoTag, legal 고지 |

> CalSans 폰트 파일(`CalSans-SemiBold.woff2`)은 라이선스 확인 후 `frontend/public/fonts/`로 복사. `@font-face` 경로를 `/fonts/CalSans-SemiBold.woff2`로 수정한다.

### 간격 / 형태 기준

| 항목 | 값 |
|------|-----|
| 카드 border-radius | `--r-card: 16px` |
| 시트 border-radius | `--r-sheet: 24px` |
| Pill border-radius | `--r-pill: 999px` |
| 카드 그림자 | `0 2px 12px rgba(0,0,0,.08)` |
| `.dock` padding | `12px 18px 32px` (하단 홈 indicator 여유) |
| `.body` padding | `0 18px` |
| 사이드바 폭 | `220px` |
| 모바일 Phone 크기 | `390 × 844px` |
| 데스크톱 캔버스 | `1280 × 832px` (디자인 기준; 실 반응형으로 전환) |

---

## 4. 우선 반영할 디자인 요소 3개

### ① 로그인 화면 (`screens-login.jsx`) — 즉시 반영 가능

디자인 코드가 완성 수준이므로 거의 그대로 React 컴포넌트로 변환 가능.

- **모바일**: `ScreenLogin` → `<LoginPage>` 컴포넌트
  - 전체 중앙 정렬 컨테이너 + curious 두더지 + wordmark + 부제
  - 하단 dock: Google OAuth 버튼 + 안내 문구
- **데스크톱**: `ScreenLoginDesktop` → 좌우 2-panel layout
  - 좌(`560px`): `--primary` 배경 + 브랜딩 + 기능 목록 3개 + 카테고리 칩 언더그라운드
  - 우(`flex:1`): 로그인 폼 + Divider + 게스트 모드 힌트

구현 연결점: Supabase `signInWithOAuth({ provider: 'google' })`

### ② 처리 상태 — failed 카드 패턴 (`screens-flow.jsx`)

`ScreenProcessing`의 failed 카드는 컴포넌트 시스템의 에러 처리 패턴 원형으로 사용.
이 패턴을 `ItemCard` 컴포넌트에 `status: 'failed'` variant로 추가한다.

```
border: 1px solid #FFCDD2
boxShadow: 0 2px 8px rgba(229,57,53,.10)
→ Pill tone="red" dot + "실패 · 내용 추출 오류"
→ 사유 텍스트 (--gray-2, 11px)
→ [재시도] 버튼: accent border, transparent bg
```

### ③ 홈 화면 두더지 + dock CTA (`screens-entry.jsx`)

서비스 아이덴티티의 핵심. 두더지 idle 애니메이션(`mole-bounce`)과 말풍선, 하단 dock의 "이미지 업로드" 버튼 조합이 첫인상을 결정한다.

- 말풍선 dismiss 타이머: 4200ms → **6000ms**로 수정
- `BUBBLE_MSGS` 3개 순환 (3000ms 간격)
- 홈에 기록이 있으면: 최근 기록 타임라인 요약 카드를 말풍선 아래 추가 (현재 디자인에 없음 → 구현 시 직접 추가)

---

## 5. 버릴 요소

| 요소 | 이유 |
|------|------|
| `ScreenHomeDrawer` 독립 아트보드 | `ScreenHome(showDrawer=true)`로 커버. 별도 라우트 불필요 |
| 디자인 캔버스 고정 크기 (`.screen { width:390px; height:844px }`) | 실제 PWA에서는 `width:100%; min-height:100dvh`로 전환. 디자인 확인 목적으로만 사용 |
| 데스크톱 `1280×832` 고정 div wrapper | Sidebar + flex content로 실제 반응형 레이아웃으로 전환 |
| `Object.assign(window, {...})` 패턴 | 디자인 캔버스 전역 등록용. React 앱에서는 named export로 대체 |

---

## 6. Claude Design에 다시 요청할 요소

현재 v2에서 유일하게 남은 미완성 항목.

### 빈 상태(empty state) variant 2개

**요청 내용:**

> life_log v2 디자인 시스템(`styles.css`, `ui.jsx`) 기준으로 두 가지 빈 상태 화면을 추가해줘.
>
> 1. **ScreenTimeline 0건 상태** — 기록이 아직 없을 때. 두더지 curious 포즈(size=120), 위에 말풍선 "아직 기록이 없어요! 사진을 올려줘.", 하단 dock에 `<Btn icon="📷">이미지 업로드</Btn>`. 기존 ScreenTimeline Phone 셸 안에 full-height 중앙 정렬.
> 2. **ScreenSearch 0건 상태** — 검색 결과가 없을 때. 두더지 digging 포즈(size=100), 위에 "찾지 못했어요" 텍스트, 필터 변경 chip 2개 + 업로드 유도 버튼. 기존 ScreenSearch의 결과 영역만 교체.
>
> 샘플 데이터 없음. DemoTag 불필요. 기존 색상 토큰·컴포넌트 그대로 사용.

> **대안:** 구현 단계에서 조건 분기로 직접 코딩해도 기존 패턴으로 충분히 구현 가능. Claude Design 재요청은 선택 사항.

---

## 7. 프로젝트 기존 CSS와 충돌할 수 있는 요소

React PWA(`frontend/`) 스캐폴딩 시 아래 항목을 반드시 확인한다.

| 충돌 위험 | 항목 | 대응 방법 |
|---------|------|----------|
| **높음** | `.card`, `.btn`, `.row`, `.field`, `.body` — 짧은 전역 클래스명 | CSS Modules(`*.module.css`) 또는 `.ll-` prefix 적용 |
| **높음** | `*, *::before, *::after { margin:0; padding:0 }` 전역 리셋 | 프로젝트 글로벌 리셋(`index.css`)과 병합. 중복 선언 제거 |
| **중간** | `html, body { font-family; color; background }` 전역 설정 | 프로젝트 `index.css`에서 한 번만 선언. `styles.css` 해당 줄 제거 |
| **중간** | `--primary`, `--surface`, `--bg` CSS 변수명 | Tailwind나 shadcn/ui 사용 시 같은 이름 충돌 가능. `--ll-primary` 등으로 prefix |
| **중간** | `@font-face` CalSans — `url('uploads/CalSans-SemiBold.woff2')` 상대 경로 | `url('/fonts/CalSans-SemiBold.woff2')`로 변경 후 `frontend/public/fonts/`에 파일 배치 |
| **낮음** | `@import url("https://fonts.googleapis.com/css2?family=Inter...")` | 프로젝트가 이미 Inter를 로드하면 중복. `index.html` `<link>`로 통합 |
| **낮음** | `word-break: keep-all` 전역 적용 | 영문 콘텐츠 있으면 줄바꿈 이상. 한국어 컨테이너 범위로 한정 |
| **낮음** | `.chip.active` — `.chip` 전역 클래스 | shadcn의 Badge 등과 충돌 가능. `.ll-chip.active`로 변경 |

> **권장:** `styles.css` 전체를 `frontend/src/styles/life-log-design.module.css`로 변환. CSS Modules로 범위 한정하면 충돌 위험 대부분 제거됨.

---

## 8. 실제 구현 전 확인할 데이터 / API 상태

구현을 시작하기 전에 아래 항목이 준비됐는지 확인한다. 미준비 항목이 있으면 해당 화면 구현을 후순위로 미룬다.

| 항목 | 확인 내용 | 관련 화면 |
|------|---------|----------|
| **Supabase Google OAuth** | 대시보드 → Authentication → Providers → Google 활성화 여부, Redirect URL 설정 | 로그인 |
| **Supabase Storage 버킷** | 버킷 이름, public/private 정책, CORS 허용 origin, anon 업로드 RLS | 업로드 |
| **Clova Studio HCX-005 비전** | API 키·엔드포인트·멀티모달 메시지 이미지 첨부 포맷 (`integrations/llm.py` 확인) | 처리 상태 |
| **Clova Embedding 차원 수** | 임베딩 벡터 차원 수 → `pgvector` 컬럼 타입(`vector(N)`)과 일치해야 함 | 검색 |
| **Item 상태 enum** | 백엔드 `Item.status`가 `pending / processing / ready / failed` 4개인지 확인 | 처리 상태 |
| **EXIF 파싱 라이브러리** | `captured_at` 추출 방식(pillow·piexif·exifread) 및 UTC 변환 정책 | 업로드·항목 상세 |
| **CalSans 폰트 라이선스** | 상업적 사용 가능 여부 확인 후 `frontend/public/fonts/`에 배치 | 전 화면 |
| **더미 이미지 파일** | `food_restaurant.png`, `jeju_travel.png` 등 썸네일 합성 이미지 준비 여부 (데모용) | 업로드·타임라인·검색 |

---

## 9. Claude Code에게 전달할 최종 요청문

```
다음 조건에 맞게 life_log React PWA(frontend/)를 구현해줘.
코드를 수정하기 전에 반드시 이 요청문 전체를 읽어.

## 참고 파일
- 디자인 소스: life_log_new2_extracted/ 폴더 (ui.jsx, screens-*.jsx, styles.css)
- 스펙: docs/superpowers/specs/2026-05-31-life-log-platform-design.md
- 설계 기준: CLAUDE.md §3(스택), §5(화면), 부록 B(레이어)
- 핸드오프 명세: DESIGN_HANDOFF.md (이 파일)

## 스타일 처리
1. `life_log_new2_extracted/styles.css`를 `frontend/src/styles/life-log-design.module.css`로 변환한다.
2. 짧은 전역 클래스(`.card`, `.btn`, `.row`, `.field` 등)를 CSS Modules로 범위 한정한다.
3. CSS 변수는 `frontend/src/index.css`의 `:root`로 이동. 전역 리셋/body 설정도 index.css에서 한 번만 선언한다.
4. CalSans 폰트 파일을 `frontend/public/fonts/`에 배치하고 `@font-face` url 경로를 `/fonts/CalSans-SemiBold.woff2`로 수정한다.

## 컴포넌트 구조
5. `ui.jsx`의 공용 컴포넌트를 `frontend/src/components/ui/` 아래 named export로 분리한다.
   - `MoleSVG.tsx` (6 poses) · `Pill.tsx` · `Btn.tsx` · `Thumb.tsx` · `Track.tsx`
   - `DemoTag.tsx` · `SpeechBubble.tsx` · `Sidebar.tsx` · `HamburgerDrawer.tsx`
6. 화면별 컴포넌트는 `frontend/src/pages/` 아래 파일로 분리한다.
   - `LoginPage.tsx` (ScreenLogin + ScreenLoginDesktop)
   - `HomePage.tsx` · `UploadPage.tsx` · `ProcessingPage.tsx`
   - `TimelinePage.tsx` · `SearchPage.tsx` · `SourcesPage.tsx` · `DetailPage.tsx`

## 반응형
7. Phone 셸(390px 고정, 844px 고정)은 제거하고 `width: 100%; min-height: 100dvh`로 전환한다.
8. 데스크톱(≥1024px)은 Sidebar + flex content 레이아웃을 유지한다.
9. 모바일(<1024px)은 HamburgerDrawer + 하단 dock CTA 구조를 유지한다.

## 필수 동작
10. 로그인: Supabase `signInWithOAuth({ provider: 'google' })` 연결.
11. 업로드 화면: `<input type="file" accept="image/*" multiple>` + 선택 파일 미리보기 + 업로드 버튼.
12. 처리 상태: `Item.status`(pending/processing/ready/failed)에 따라 Pill 색상·재시도 버튼 조건 표시.
13. 빈 상태: ScreenTimeline 0건 → curious 두더지 + 업로드 유도. ScreenSearch 0건 → digging 두더지 + 다음 행동 안내.
14. 더미 데이터에 DemoTag(`◇ 데모용`)를 붙인다. 실 데이터에는 붙이지 않는다.

## 금지사항 (CLAUDE.md §8 준수)
- API 키·토큰 하드코딩 금지. config.py settings 또는 .env 경유.
- 실제 PII(실명·전화·주소·계좌) 하드코딩 금지. 예시는 [샘플]/sample@demo.com.
- 테스트에서 실제 Clova/Supabase API 호출 금지. integrations/ 경계에서 모킹.

## 완료 기준
- `pnpm dev` 실행 후 8개 화면 모두 크래시 없이 렌더링됨
- 모바일(390px)과 데스크톱(1280px) 뷰포트 모두 레이아웃 깨짐 없음
- `pnpm lint` 오류 없음
- `pnpm build` 성공
```
