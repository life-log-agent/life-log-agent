/* 홈 — 두더지 마스코트 + 실제 API 연동 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Pill, Track, MoleSVG, SpeechBubble, HamburgerDrawer } from "../components/ui";
import { getItems } from "../lib/api";
import type { Item } from "../lib/api";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return `오늘 ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  if (diffDays === 1) return `어제 ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getDate().toString().padStart(2, "0")}`;
}

function categoryEmoji(cat: string | null): string {
  switch (cat) {
    case "화장품": return "💄";
    case "여행지": return "✈️";
    case "맛집": return "🍽️";
    default: return "📌";
  }
}

function categoryTone(cat: string | null): "green" | "blue" | "yellow" | "purple" | "gray" {
  switch (cat) {
    case "화장품": return "green";
    case "여행지": return "blue";
    case "맛집": return "yellow";
    default: return "gray";
  }
}

export default function Home() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getItems()
      .then(setItems)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "기록을 불러오지 못했습니다."),
      )
      .finally(() => setLoading(false));
  }, []);

  const pendingItems = items.filter((it) => it.status === "pending" || it.status === "processing");
  const readyItems = items.filter((it) => it.status === "ready");
  const recentItems = readyItems.slice(0, 5);

  return (
    <Phone>
      <HamburgerDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} active="home" />

      {/* Top bar */}
      <div className="appbar" style={{ justifyContent: "space-between", paddingBottom: 10 }}>
        <button className="hamburger-btn" onClick={() => setDrawerOpen(true)}>
          <span /><span /><span />
        </button>
        <span className="wordmark" style={{ fontSize: 20, color: "var(--primary)" }}>life_log</span>
        <button
          style={{ width: 40, height: 40, display: "grid", placeItems: "center", fontSize: 18, color: "var(--gray)", background: "none", border: "none", cursor: "pointer", borderRadius: 12 }}
          onClick={() => navigate("/search")}
        >
          🔍
        </button>
      </div>

      {/* 처리 중 배너 */}
      {pendingItems.length > 0 && (
        <button
          className="card card-pad"
          style={{ margin: "0 18px 10px", flex: "0 0 auto", borderColor: "#B6E3FA", boxShadow: "0 2px 0 #B6E3FA", cursor: "pointer", width: "calc(100% - 36px)", textAlign: "left" }}
          onClick={() => navigate("/processing")}
        >
          <div className="rowflex spread">
            <div className="rowflex gap8">
              <span style={{ fontSize: 18 }}>⏳</span>
              <b style={{ fontSize: 14, whiteSpace: "nowrap" }}>{pendingItems.length}장 처리 중</b>
            </div>
            <Pill tone="blue" dot>분석 중</Pill>
          </div>
          <div style={{ marginTop: 10 }}>
            <Track pct={Math.round((items.filter((it) => it.status === "ready" || it.status === "failed").length / Math.max(items.length, 1)) * 100)} tone="blue" thin />
          </div>
        </button>
      )}

      {/* 오류 */}
      {error && (
        <div style={{ margin: "0 18px 10px", padding: "10px 14px", borderRadius: 10, background: "#FFF0EF", border: "1px solid #FFC2C4", fontSize: 13, fontWeight: 700, color: "var(--red-d)" }}>
          ⚠️ {error}
        </div>
      )}

      {/* 메인 스테이지 */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: recentItems.length === 0 ? "center" : "flex-start", background: "var(--bg)", overflow: "hidden", paddingTop: recentItems.length > 0 ? 16 : 0 }}>

        {/* 두더지 + 말풍선 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, flexShrink: 0 }}>
          {!bubbleDismissed && (
            <div style={{ width: 238, zIndex: 10, marginBottom: 10 }}>
              <SpeechBubble onClose={() => setBubbleDismissed(true)} />
            </div>
          )}
          <div className="mole-bounce">
            <MoleSVG pose="idle" size={recentItems.length > 0 ? 110 : 158} />
          </div>
        </div>

        {/* 기록 있을 때: 최근 기록 목록 */}
        {!loading && recentItems.length > 0 && (
          <div style={{ width: "100%", padding: "14px 18px 0", overflow: "auto" }}>
            <div className="rowflex spread" style={{ marginBottom: 8 }}>
              <span className="eyebrow">최근 기록</span>
              <button style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }} onClick={() => navigate("/timeline")}>
                타임라인 전체 ›
              </button>
            </div>
            <div className="stack-sm">
              {recentItems.map((item) => (
                <button key={item.id} className="row" style={{ padding: 10, gap: 12, cursor: "pointer", width: "100%", textAlign: "left" }} onClick={() => navigate(`/detail/${item.id}`)}>
                  <div style={{ width: 50, height: 50, borderRadius: 10, background: "var(--primary-bg)", display: "grid", placeItems: "center", fontSize: 24, flex: "0 0 auto" }}>
                    {categoryEmoji(item.category)}
                  </div>
                  <div className="row-main">
                    <div style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.summary ?? item.original_filename ?? item.id}
                    </div>
                    <div className="muted tiny" style={{ marginTop: 3, fontWeight: 600 }}>
                      {item.place ? `${item.place} · ` : ""}{formatDate(item.captured_at ?? item.created_at)}
                    </div>
                    <div style={{ marginTop: 5 }}>
                      <Pill tone={categoryTone(item.category)}>
                        {categoryEmoji(item.category)} {item.category ?? "기타"}
                      </Pill>
                    </div>
                  </div>
                  <span className="chev">›</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 빈 상태 안내 */}
        {!loading && readyItems.length === 0 && pendingItems.length === 0 && !error && (
          <p className="muted" style={{ fontSize: 13, fontWeight: 600, textAlign: "center", marginTop: 16, lineHeight: 1.6, maxWidth: 240 }}>
            갤러리 사진을 올려줘.<br />
            내가 날짜·장소·카테고리로<br />
            정리해 줄게!
          </p>
        )}
      </div>

      {/* 하단 CTA */}
      <div className="dock">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button className="btn" onClick={() => navigate("/upload")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
            <span style={{ fontSize: 18 }}>📷</span>
            이미지 업로드
          </button>
          <button className="btn-text" onClick={() => navigate("/search")}>
            말로 기록 찾기
          </button>
        </div>
      </div>
    </Phone>
  );
}
