/* life_log — route table with auth protection */
import type { ReactNode } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { useAuth } from "./lib/auth";

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

// ── Protected Route ──────────────────────────────────────────

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <Phone>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            color: "var(--gray-2)",
            fontWeight: 600,
          }}
        >
          불러오는 중…
        </div>
      </Phone>
    );
  }

  if (!session) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

// ── Index Menu (dev only) ────────────────────────────────────

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
      { to: "/detail/:id", label: "항목 상세" },
    ],
  },
];

function IndexMenu() {
  const { session, signOut } = useAuth();
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
          {session
            ? `로그인됨: ${session.user.email}`
            : "비로그인 상태 — 보호 화면은 /onboarding으로 이동합니다."}
        </p>
        {session && (
          <button
            className="btn btn--ghost"
            style={{ marginBottom: 12, width: "100%" }}
            onClick={() => signOut().catch(console.error)}
          >
            로그아웃
          </button>
        )}
        {GROUPS.map((g) => (
          <div key={g.title} style={{ marginTop: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              {g.title}
            </div>
            <div className="stack-sm">
              {g.items.map((it) => (
                <Link
                  key={it.to}
                  to={it.to === "/detail/:id" ? "/detail/demo" : it.to}
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

// ── App ──────────────────────────────────────────────────────

export default function App() {
  return (
    <div className="app-stage">
      <Routes>
        {/* 공개 라우트 */}
        <Route path="/onboarding" element={<Onboarding />} />

        {/* 보호 라우트 */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/home-empty"
          element={
            <ProtectedRoute>
              <HomeEmpty />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/processing"
          element={
            <ProtectedRoute>
              <Processing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/processing-failed"
          element={
            <ProtectedRoute>
              <ProcessingFailed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/timeline"
          element={
            <ProtectedRoute>
              <Timeline />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <Search />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search-empty"
          element={
            <ProtectedRoute>
              <SearchEmpty />
            </ProtectedRoute>
          }
        />
        <Route
          path="/detail/:id"
          element={
            <ProtectedRoute>
              <Detail />
            </ProtectedRoute>
          }
        />

        {/* 루트 → 로그인 여부에 따라 분기 */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<IndexMenu />} />
      </Routes>
    </div>
  );
}

function RootRedirect() {
  const { session, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={session ? "/home" : "/onboarding"} replace />;
}
