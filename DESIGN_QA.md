# DESIGN_QA.md — life_log v2 디자인 점검

> 점검 대상: `DESIGN_BRIEF.md` 요구사항 vs `life_log v2` 산출물 (`life_log_new2.zip`)
> 점검 파일: `ui.jsx` · `screens-login.jsx` · `screens-entry.jsx` · `screens-flow.jsx` · `screens-results.jsx` · `styles.css`
> 점검일: 2026-06-06 (v1 → v2 재점검) · 코드 수정 없이 검토만 수행

---

## 산출물 현황

`life_log_new2.zip`에 포함된 v2 파일:

- `ui.jsx` — 두더지 SVG 6포즈(A–F) + Sidebar/HamburgerDrawer + 공용 컴포넌트
- `screens-login.jsx` — **신규** ScreenLogin(모바일) · ScreenLoginDesktop (Google 단일 소셜 로그인)
- `screens-entry.jsx` — ScreenHome(모바일) · ScreenHomeDrawer · ScreenHomeDesktop
- `screens-flow.jsx` — ScreenUpload · ScreenProcessing · ScreenTimeline (모바일 + 데스크톱 각 2배), **failed 카드 추가**
- `screens-results.jsx` — ScreenSearch · ScreenSources · ScreenDetail (모바일 + 데스크톱 각 2배)
- `styles.css` — 반응형 CSS, 두더지 애니메이션 키프레임

총 8화면 × 모바일+데스크톱 = 16개 아트보드. v1 대비 로그인 화면 + failed 카드 신규 추가.

---

## 점검 표

| # | 항목 | 판정 | 이유 (한 줄) |
|---|------|------|------|
| 1 | **사용자 흐름**<br>입력 → 처리 중 → 결과 → 다시 시도 | ✅ 통과 | `ScreenProcessing`에 `failed` 카드 + 재시도 버튼 추가됨 (v2 신규) |
| 2 | **필수 화면**<br>첫 화면 · 입력 · 결과 · 오류 상태 | ✅ 통과 | `ScreenLogin`/`ScreenLoginDesktop` 추가로 로그인 화면 누락 해소 (v2 신규) |
| 3 | **시각 위계**<br>서비스 설명 → 입력 → 제출 버튼 → 결과 요약 | ✅ 통과 | 홈(말풍선→두더지→업로드 CTA), 검색(입력→필터→답변→근거) 순 위계 명확 |
| 4 | **화면 밀도**<br>마케팅 페이지가 아닌 실제 앱 화면 | ✅ 통과 | 처리 단계 바·항목별 카드·메타데이터 테이블·OCR 텍스트 등 앱 수준 밀도 확보 |
| 5 | **모바일**<br>작은 화면에서 입력·결과·버튼 가독성 | ✅ 통과 | 주요 버튼 하단 dock 고정, 본문 13–15px · 보조 텍스트 최소 11px |
| 6 | **더미 데이터**<br>실제 PII · 금융 · API 키 없는가 | ✅ 통과 | 전 화면 `◇ 데모용`/`◇ 샘플` 태그 부착, 금액 `₩—,—`, 주소 `[샘플 주소]`, email `sample@demo.com` |
| 7 | **핸드오프**<br>그대로 쓸 것 / 고칠 것 / 버릴 것 / 다시 요청 구분 | ✅ 통과 | 로그인·오류 화면 해소로 구현 기준 완전. 잔여 이슈는 빈 상태 1건만 남음 |

판정: ✅ 통과 / ⚠️ 수정 필요

---

## 세부 지적 사항

### ~~지적 1. `failed` 상태 카드 없음 (Screen 3)~~ → ✅ v2에서 해소

`ScreenProcessing`에 `error_image.png` 카드 추가됨:
- `Pill tone="red" dot` → "실패 · 내용 추출 오류"
- 사유 텍스트: "이미지를 읽을 수 없어요."
- [재시도] 버튼 (`border: 1.5px solid var(--accent)`)
- 데스크톱(`ScreenProcessingDesktop`)에도 동일 패턴 적용됨

### ~~지적 2. 로그인 / 온보딩 화면 누락~~ → ✅ v2에서 해소

`screens-login.jsx` 신규 추가:
- **모바일** (`ScreenLogin`): curious 포즈 두더지 + 서비스명 + 부제 + 하단 Google 버튼 dock
- **데스크톱** (`ScreenLoginDesktop`): 좌측 브랜딩 패널(`--primary` 배경, 기능 목록 3개) + 우측 로그인 폼(Google 버튼 + 게스트 모드 힌트 + 법적 고지)
- 샘플 데이터: `[데모용 안내]` 표시, 실 계정 정보 없음

### 지적 3. 빈 상태(empty state) 없음 — 잔류

`ScreenTimeline`, `ScreenSearch` 모두 데이터가 있는 상태만 보여줌.
구현 단계에서 조건 분기로 직접 추가해도 무방 (기존 패턴으로 충분히 커버 가능):
- 타임라인 0건: 두더지 curious 포즈 + "아직 기록이 없어요" + 업로드 버튼
- 검색 0건: 두더지 digging 포즈 + "기록에서 찾지 못했어요" + 필터 변경/업로드 버튼

### 잔류 권장 사항

- 말풍선 자동 dismiss `4200ms` → `6000ms` 권장 (현재 `ScreenHome` 타이머)
- `ScreenHomeDrawer`는 독립 아트보드보다 `ScreenHome(showDrawer=true)` prop으로 처리

---

## 핸드오프 분류

| 분류 | 대상 |
|------|------|
| **그대로 쓸 것** | 두더지 SVG 6포즈(A–F) · 로그인 화면(모바일+데스크톱) · Sidebar/HamburgerDrawer · 색상 토큰(크림/브라운/앰버/언더그라운드) · Pill·Thumb·DemoTag·Track·Stages 공용 컴포넌트 · 모바일 Phone 셸(390×844) · 더미 데이터 패턴(`[샘플]`/`₩—,—`/`sample@demo.com`) · CSS 애니메이션 7개(mole-idle/bubble-in/mole-dig/mole-surface/dirt-fly/sparkle-spin/card-float) |
| **고칠 것** | 빈 상태 variant 2개 추가(ScreenTimeline 0건·ScreenSearch 0건) · 말풍선 dismiss 4.2s → 6s · `.screen` 고정 크기(390×844) 반응형으로 전환 · CSS 짧은 클래스명(`.card` `.btn` `.row`)에 네임스페이스 prefix 적용 |
| **버릴 것** | 없음 (전반적으로 활용 가능한 구조) |
| **다시 요청할 것** | 빈 상태 variant 2개 (타임라인 0건 + 검색 0건) — 구현 단계 직접 작성으로 대체 가능 |

---

## 다음 액션 우선순위

1. **`DESIGN_HANDOFF.md` 작성** — 구현팀 전달용 최종 명세 (완료 → 이 파일과 함께 전달)
2. **빈 상태 variant** — 구현 단계에서 직접 추가 (ScreenTimeline/ScreenSearch 조건 분기)
3. **CSS 네임스페이스** — `.ll-card`, `.ll-btn` 등 prefix 적용하여 기존 스타일 충돌 방지
4. **CalSans 폰트** — 라이선스 확인 후 `frontend/public/fonts/`로 이동, `@font-face` 경로 수정
5. **나머지 화면** — 현재 v2 결과물 기반으로 `frontend/src/` 스캐폴딩에 바로 적용 가능
