# life_log — frontend (PWA)

React PWA(Vite + TypeScript)로 만든 `life_log` 화면 스캐폴드. Claude Design 핸드오프(모바일 390×844, 10개 화면)를 실제 React+TS 코드로 옮긴 것이다.

> 범위: **UI 화면 스캐폴드만.** Supabase 연동, 인증, 서비스워커(오프라인 캐싱), 백엔드 API 호출은 아직 없다(다음 단계). 버튼/탭은 라우팅만 하거나 비활성 상태다.

## 실행

```bash
cd frontend
npm install
npm run dev        # 개발 서버 (http://localhost:5173)
npm run typecheck  # tsc --noEmit (0 errors)
npm run build      # tsc -b && vite build
npm run preview    # 빌드 결과 미리보기
```

> `CLAUDE.md`는 `pnpm`을 우선 표기하지만 이 환경엔 pnpm이 없어 `npm`으로 스캐폴딩했다. pnpm 사용 시 `pnpm install` / `pnpm dev`로 대체 가능.

## 구조

```
src/
  main.tsx                  앱 부트스트랩 + BrowserRouter, design-system.css 로드
  App.tsx                   라우트 + 인덱스 메뉴(10개 화면 링크, 진입/입력→처리/결과→검색)
  styles/design-system.css  디자인 시스템(원본 styles.css 그대로 + 반응형 override 블록)
  data/samples.ts           CAT 카테고리 맵 + 타입(합성 데이터)
  components/ui.tsx          공용 프리미티브: Phone, AppBar, Btn, Pill, DemoTag, Thumb, Track, BottomNav, Stages
  screens/                  10개 화면
    Onboarding · Home · HomeEmpty
    Upload · Processing · ProcessingFailed
    Timeline · Search · SearchEmpty · Detail
```

`/` 로 접속하면 10개 화면으로 이동하는 인덱스 메뉴가 나온다.

## 디자인 핸드오프와 다른 점 (의도된 차이)

- **가짜 iOS 상태바("9:41")·홈 인디케이터 제거** — 프로토타입의 목업 크롬. 실제 PWA가 OS 상태바를 흉내 내면 실기기에서 이중으로 보인다. `Phone`은 `.screen` 셸만 유지하고 내용만 렌더한다.
- **반응형 셸** — 원본은 고정 390×844. ≥430px에선 그 프레임을 화면 중앙에 "브라우저 속 폰" 모양으로 두고, <430px(실기기)에선 `width:100%; height:100dvh`로 채운다. 디자인 토큰/컴포넌트 클래스는 건드리지 않고 CSS 끝에 override만 덧붙였다.
- 그 외 레이아웃·문구·이모지·`데모용/샘플` 태그·`₩—,—` 자리표시 가격·합성 파일명은 원본 그대로다.

## 데이터 규칙

모든 샘플은 **명백한 합성 데이터**다. 실제 개인정보(PII)·금융정보·API 키·시크릿은 없다(루트 `CLAUDE.md` §8).
