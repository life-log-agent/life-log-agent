/* life_log — route table + index menu linking every screen.
   Static UI scaffold: routes render the ported screens; no data/auth/API. */
import { Routes, Route, Link } from "react-router-dom";

import Onboarding from "./screens/Onboarding";
import Home from "./screens/Home";
import HomeEmpty from "./screens/HomeEmpty";
import Upload from "./screens/Upload";
import Processing from "./screens/Processing";
import ProcessingFailed from "./screens/ProcessingFailed";
import Timeline from "./screens/Timeline";
import Search from "./screens/Search";
import SearchEmpty from "./screens/SearchEmpty";
import Detail from "./screens/Detail";
import { Phone } from "./components/ui";

interface ScreenLink {
  to: string;
  label: string;
}

const GROUPS: { title: string; items: ScreenLink[] }[] = [
  {
    title: "진입",
    items: [
      { to: "/onboarding", label: "로그인 / 온보딩" },
      { to: "/home", label: "홈 — 기록 있음" },
      { to: "/home-empty", label: "홈 — 빈 상태" },
    ],
  },
  {
    title: "입력 → 처리",
    items: [
      { to: "/upload", label: "업로드" },
      { to: "/processing", label: "처리 상태" },
      { to: "/processing-failed", label: "처리 상태 — 실패 / 재시도" },
    ],
  },
  {
    title: "결과 → 검색",
    items: [
      { to: "/timeline", label: "분류 결과 / 타임라인" },
      { to: "/search", label: "검색 / 질의응답 (RAG)" },
      { to: "/search-empty", label: "검색 결과 0건" },
      { to: "/detail", label: "항목 상세" },
    ],
  },
];

function IndexMenu() {
  return (
    <Phone>
      <div className="appbar" style={{ paddingTop: 6 }}>
        <span className="wordmark" style={{ fontSize: 22, color: "var(--green-d)", flex: 1 }}>
          life_log
        </span>
        <span className="muted tiny" style={{ fontWeight: 800 }}>
          화면 미리보기
        </span>
      </div>
      <div className="body" style={{ overflow: "auto" }}>
        <p className="muted tiny" style={{ fontWeight: 600, lineHeight: 1.5, marginTop: 0 }}>
          디자인 핸드오프 10개 화면의 정적 스캐폴드입니다. 화면을 눌러 이동하세요.
        </p>
        {GROUPS.map((g) => (
          <div key={g.title} style={{ marginTop: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              {g.title}
            </div>
            <div className="stack-sm">
              {g.items.map((it) => (
                <Link
                  key={it.to}
                  to={it.to}
                  className="row"
                  style={{ padding: "12px 14px", textDecoration: "none", color: "var(--ink)" }}
                >
                  <div className="row-main">
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{it.label}</div>
                    <div className="muted tiny" style={{ marginTop: 2, fontWeight: 600 }}>
                      {it.to}
                    </div>
                  </div>
                  <span className="chev">›</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
        <div style={{ height: 24 }} />
      </div>
    </Phone>
  );
}

export default function App() {
  return (
    <div className="app-stage">
      <Routes>
        <Route path="/" element={<IndexMenu />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/home" element={<Home />} />
        <Route path="/home-empty" element={<HomeEmpty />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/processing" element={<Processing />} />
        <Route path="/processing-failed" element={<ProcessingFailed />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/search" element={<Search />} />
        <Route path="/search-empty" element={<SearchEmpty />} />
        <Route path="/detail" element={<Detail />} />
        <Route path="*" element={<IndexMenu />} />
      </Routes>
    </div>
  );
}
