# DESIGN_QA.md — life_log v2 디자인 점검

> 점검 대상: `DESIGN_BRIEF.md` 요구사항 vs `life_log v2` 산출물 (`life_log_new.zip`)
> 점검 파일: `ui.jsx` · `screens-entry.jsx` · `screens-flow.jsx` · `screens-results.jsx`
> 점검일: 2026-06-06 · 코드 수정 없이 검토만 수행

---

## 산출물 현황

`life_log_new.zip`에 포함된 v2 파일:

- `ui.jsx` — 두더지 SVG 6포즈(A–F) + Sidebar/HamburgerDrawer + 공용 컴포넌트
- `screens-entry.jsx` — ScreenHome(모바일) · ScreenHomeDrawer · ScreenHomeDesktop
- `screens-flow.jsx` — ScreenUpload · ScreenProcessing · ScreenTimeline (모바일 + 데스크톱 각 2배)
- `screens-results.jsx` — ScreenSearch · ScreenSources · ScreenDetail (모바일 + 데스크톱 각 2배)
- `app.css` / `styles.css` — 반응형 CSS, 두더지 애니메이션 키프레임
- `life_log 화면 2차.html` — 전체 아트보드 캔버스

총 7개 화면, 모바일+데스크톱 양쪽 구현.

---

## 점검 표

| # | 항목 | 판정 | 이유 (한 줄) |
|---|------|------|------|
| 1 | **사용자 흐름**<br>입력 → 처리 중 → 결과 → 다시 시도 | ⚠️ 수정 필요 | 업로드→처리→검색 흐름은 있으나 `failed` 상태 + 재시도 버튼 화면이 없음 |
| 2 | **필수 화면**<br>첫 화면 · 입력 · 결과 · 오류 상태 | ⚠️ 수정 필요 | 로그인/온보딩 화면 누락, 처리 화면에 `failed` 카드 없음 |
| 3 | **시각 위계**<br>서비스 설명 → 입력 → 제출 버튼 → 결과 요약 | ✅ 통과 | 홈(말풍선→두더지→업로드 CTA), 검색(입력→필터→답변→근거) 순 위계 명확 |
| 4 | **화면 밀도**<br>마케팅 페이지가 아닌 실제 앱 화면 | ✅ 통과 | 처리 단계 바·항목별 카드·메타데이터 테이블·OCR 텍스트 등 앱 수준 밀도 확보 |
| 5 | **모바일**<br>작은 화면에서 입력·결과·버튼 가독성 | ✅ 통과 | 주요 버튼 하단 독 고정, 본문 13–14px · 보조 텍스트 최소 11px로 가독성 확보 |
| 6 | **더미 데이터**<br>실제 PII · 금융 · API 키 없는가 | ✅ 통과 | 전 화면 `◇ 데모용`/`◇ 샘플` 태그 부착, 금액 `₩—,—` 처리, 주소 `[샘플 주소]` 처리 |
| 7 | **핸드오프**<br>그대로 쓸 것 / 고칠 것 / 버릴 것 / 다시 요청 구분 | ⚠️ 수정 필요 | 로그인·오류 화면 누락으로 구현 기준 불완전 — 아래 핸드오프 분류 참조 |

판정: ✅ 통과 / ⚠️ 수정 필요

---

## 세부 지적 사항

### 지적 1. `failed` 상태 카드 없음 (Screen 3)

`DESIGN_BRIEF` 요구: `failed` 사유 + **재시도 버튼** 필수.

현재 `ScreenProcessing`에는 `완료 · 처리 중 · 대기 중` 카드만 있고 `failed` 카드가 없다.
추가 필요:
- Pill `tone="red"` dot → "실패 · 내용 추출 오류"
- 사유 텍스트: "이미지를 읽을 수 없어요."
- [재시도] 버튼 (primary)

### 지적 2. 로그인 / 온보딩 화면 누락

`DESIGN_BRIEF` 화면 목록 #1: 로그인 + 첫 사용 안내.
design-canvas에 등록된 화면 중 인증 화면이 없음.
발표 데모 흐름에서 인증 없이 홈으로 진입하면 서비스 진입점이 불명확함.

### 지적 3. 빈 상태(empty state) 없음

`DESIGN_BRIEF` 요구: 기록 0건 → 첫 업로드 유도 / 검색 0건 → 다음 행동 안내.
`ScreenTimeline`, `ScreenSearch` 모두 데이터가 있는 상태만 보여줌.
구현 단계에서 직접 추가해도 무방 (패턴이 이미 확립되어 있음).

---

## 핸드오프 분류

| 분류 | 대상 |
|------|------|
| **그대로 쓸 것** | 두더지 SVG 6포즈(A–F) · Sidebar/HamburgerDrawer · 색상 토큰(크림/브라운/앰버) · Pill·Thumb·DemoTag·Track·Stages 공용 컴포넌트 · 모바일 Phone 셸 · 더미 데이터 패턴(`[샘플]` / `₩—,—` / `sample@demo.com`) · CSS 애니메이션 4개(mole-idle / bubble-in / mole-dig / mole-surface) |
| **고칠 것** | Screen 3에 `failed` 카드 + 재시도 버튼 추가 · Screen 4/5 빈 상태 variant 추가 · 말풍선 자동 dismiss 4.2s → 6s 권장 |
| **버릴 것** | 없음 (전반적으로 활용 가능한 구조) |
| **다시 요청할 것** | 로그인 / 온보딩 화면 1개 (Supabase Auth 로그인 + 첫 업로드 유도 안내) |

---

## 다음 액션 우선순위

1. **로그인 화면** — 클로드 디자인에 추가 요청 또는 구현 단계에서 직접 작성
2. **`failed` 카드** — `screens-flow.jsx` Screen 3에 추가 (패턴 이미 있어 간단)
3. **빈 상태** — 구현 단계에서 직접 추가 (ScreenTimeline/ScreenSearch에 조건 분기)
4. **나머지 화면** — 현재 v2 결과물 기반으로 `frontend/` 스캐폴딩에 바로 적용 가능
