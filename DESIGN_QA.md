# DESIGN_QA.md — life_log 화면 초안 점검

> 점검 대상: `DESIGN_BRIEF.md` + Claude Design 산출물 (URL 핸드오프 번들)
> 점검일: 2026-06-06 · 구현 완료 후 업데이트

---

## 산출물 현황

Claude Design에서 받은 번들에 다음 파일이 모두 포함되어 있었다:

- `styles.css` — Duolingo 스타일 디자인 시스템 (색상 토큰·버튼·카드·필·스텝 등)
- `ui.jsx` — 공용 프리미티브 (Phone, AppBar, Btn, Pill, DemoTag, Thumb, Track, BottomNav, Stages, CAT)
- `screens-entry.jsx` — ScreenOnboarding, ScreenHomeEmpty, ScreenHome
- `screens-flow.jsx` — ScreenUpload, ScreenProcessing, ScreenProcessingFailed
- `screens-results.jsx` — ScreenTimeline, ScreenSearch, ScreenSearchEmpty, ScreenDetail
- `life_log 화면 초안.html` — 아트보드 배치 캔버스 (10개 화면, 390×844)

전체 파일이 정상 확인되어 `frontend/` React PWA 스캐폴드로 구현까지 완료되었다.

---

## 점검 표

| 항목 | 판정 | 이유 (한 줄) |
|------|------|------|
| 사용자 흐름 (입력→처리 중→결과→다시 시도) | 통과 | 온보딩→업로드→처리(진행/실패·재시도)→타임라인→검색(답변/0건)→상세 전 흐름 구현. |
| 필수 화면 (첫 화면·입력·결과·오류 상태) | 통과 | 10개 화면 모두 구현 — 홈(빈/기록), 업로드, 처리, 처리실패, 타임라인, 검색, 검색0건, 상세. |
| 시각 위계 (설명·입력·제출·결과요약 우선순위) | 통과 | 브리프 기준표대로: 업로드 버튼 하단 고정(엄지 위치), 검색 진입·재시도·필터 순 우선순위 유지. |
| 화면 밀도 (마케팅 아닌 앱 화면) | 통과 | 단계형 가이드형 흐름, 한 화면에 정보를 욱여넣지 않음. Duolingo 스타일 청크 카드 구조 적용. |
| 모바일 (작은 화면 가독성) | 통과 | 390×844 기준, `word-break: keep-all` 한국어 줄바꿈 보정 적용. 실기기(<430px) `width:100%; height:100dvh`. |
| 더미 데이터 (PII·금융·API 키 노출) | 통과 | 합성 파일명(cosmetic_lipstick.png 등), 가격은 `₩—,—`, 모든 샘플에 `데모용`/`샘플` 태그, 실제 정보 없음. |
| 핸드오프 (그대로 쓸 것/고칠 것/버릴 것/다시 요청) | 통과 | `frontend/`에 타입드 TSX로 구현 완료. 아래 핸드오프 항목 참조. |

---

## 핸드오프

### ✅ 그대로 쓴 것
- **디자인 시스템 CSS** (`frontend/src/styles/design-system.css`) — 원본 `styles.css` 1~320행 그대로 복사. 색상 토큰·버튼·카드·필·스텝 클래스 변경 없음.
- **모든 한국어 문구·이모지·합성 데이터** — 원본 그대로 포팅.
- **화면 구조·레이아웃** — DOM 구조, className, inline style 최대한 그대로 TSX로 변환.
- **10개 화면 라우팅** — react-router-dom v6으로 `/` 인덱스 메뉴 + 각 화면 경로 연결.

### 🔧 의도적으로 바꾼 것
- **가짜 iOS 상태바("9:41")·홈 인디케이터 제거** — 실제 PWA가 OS 크롬을 흉내 내면 실기기에서 이중으로 보인다. `Phone` 컴포넌트는 `.screen` 셸만 유지.
- **반응형 override 추가** — 원본 고정 390×844를 유지하되, ≥430px 데스크톱에선 "브라우저 속 폰" 프레임, <430px 실기기에선 `100dvh` 풀스크린. 디자인 토큰 라인은 건드리지 않고 CSS 끝에 명확히 구분된 블록으로 덧붙임.
- **window 전역 노출 → ES 모듈 import/export** — 원본 `Object.assign(window, {...})` 패턴을 표준 React 모듈로 변환.

### 🗑️ 버린 것
- `Sun = () => null` — 원본 `ui.jsx`의 미사용 더미 컴포넌트. 포팅하지 않음.
- DesignCanvas/DCSection/DCArtboard — 디자인 검토용 캔버스 크롬. 실제 앱에 불필요.

### 다음 단계
- Supabase 연동 (인증·Storage·pgvector)
- 업로드 → 백엔드 `/ingest` API 연결
- 서비스워커 (오프라인 셸·설치형 PWA)
- PC 와이드 레이아웃 (조회·검색 기기)

---

## 실행 방법

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173 → / 에서 10개 화면 메뉴
```
