/* 검색 / RAG — 두더지 모리가 답변 */
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Btn, Pill, MoleSVG } from "../components/ui";
import { search } from "../lib/api";
import type { SearchResponse, SearchEvidence } from "../lib/api";

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

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getDate().toString().padStart(2, "0")}`;
}

const CATEGORY_OPTIONS = ["", "화장품", "여행지", "맛집", "기타"];

export default function Search() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [placeFilter, setPlaceFilter] = useState("");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await search({ query: q, category: categoryFilter || undefined, place: placeFilter || undefined });
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "검색 중 오류가 발생했습니다.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() { setCategoryFilter(""); setPlaceFilter(""); }

  const evidenceList: SearchEvidence[] = result?.evidence ?? [];

  return (
    <Phone>
      {/* 앱바 */}
      <div className="appbar" style={{ justifyContent: "space-between", paddingBottom: 10 }}>
        <button className="back" onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer" }}>‹</button>
        <h1 style={{ flex: 1 }}>검색</h1>
      </div>

      <div className="body">
        {/* 검색창 */}
        <form onSubmit={handleSearch} style={{ flex: "0 0 auto" }}>
          <div className={"field" + (loading ? " focus" : "")}>
            <span className="si" style={{ color: loading ? "var(--accent)" : undefined }}>🔍</span>
            <input
              ref={inputRef} type="search" value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="말로 기록 찾기… 예) 제주 여행 맛집"
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 15, fontWeight: 700, color: "var(--ink)" }}
            />
            {query && (
              <button type="button" onClick={() => { setQuery(""); setResult(null); setSearched(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray-2)", fontSize: 16 }}>✕</button>
            )}
          </div>
        </form>

        {/* 필터 */}
        <div className="rowflex gap8 wrap" style={{ marginTop: 10, flex: "0 0 auto" }}>
          <span className="muted tiny" style={{ fontWeight: 700 }}>필터</span>
          <select
            value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 20, border: "1.5px solid var(--line)", background: categoryFilter ? "var(--primary-bg)" : "var(--snow)", color: "var(--ink)", cursor: "pointer" }}
          >
            {CATEGORY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt || "카테고리"}</option>)}
          </select>
          <input
            type="text" value={placeFilter} onChange={(e) => setPlaceFilter(e.target.value)}
            placeholder="장소"
            style={{ fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 20, border: "1.5px solid var(--line)", background: placeFilter ? "var(--blue-bg)" : "var(--snow)", color: "var(--ink)", outline: "none", width: 80 }}
          />
          {(categoryFilter || placeFilter) && (
            <button onClick={clearFilters} className="chip active" style={{ fontSize: 12, cursor: "pointer" }}>필터 지우기 ✕</button>
          )}
        </div>

        {/* 로딩 — 두더지 파는 중 */}
        {loading && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingBottom: 40, gap: 4 }}>
            <div className="mole-bounce"><MoleSVG pose="digging" size={80} /></div>
            <p className="muted" style={{ fontSize: 14, fontWeight: 600, textAlign: "center", marginTop: 8 }}>기록을 찾고 있어요…</p>
          </div>
        )}

        {/* 오류 */}
        {!loading && error && (
          <div style={{ flex: "0 0 auto", marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "var(--red-bg)", border: "1px solid #FFC2C4", fontSize: 13, fontWeight: 700, color: "var(--red-d)" }}>
            ⚠️ {error}
          </div>
        )}

        {/* 검색 전 안내 */}
        {!loading && !searched && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", paddingBottom: 40 }}>
            <MoleSVG pose="idle" size={90} />
            <p className="muted" style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, maxWidth: 270, marginTop: 12 }}>
              찾고 싶은 기록을 말로 입력하세요.<br />예) "지난달 제주도 흑돼지"
            </p>
          </div>
        )}

        {/* 결과 0건 */}
        {!loading && searched && !error && result && evidenceList.length === 0 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", paddingBottom: 40 }}>
            <MoleSVG pose="curious" size={90} />
            <div className="h-md" style={{ marginTop: 14 }}>딱 맞는 기록이 없어요</div>
            <p className="muted" style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, marginTop: 8, maxWidth: 270 }}>
              필터를 바꾸거나, 이 시기의 사진을 올리면 다시 찾을 수 있어요.
            </p>
          </div>
        )}

        {/* 답변 — 두더지 surfacing */}
        {!loading && result && evidenceList.length > 0 && (
          <>
            {/* 두더지 + 답변 박스 */}
            <div style={{ flex: "0 0 auto", display: "flex", alignItems: "flex-end", gap: 12, marginTop: 16 }}>
              <div className="mole-surface-in" style={{ flexShrink: 0 }}>
                <MoleSVG pose="surfacing" size={72} />
              </div>
              <div style={{ flex: 1, background: "var(--primary-bg)", border: "1.5px solid var(--accent)", borderRadius: 14, padding: "10px 14px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-d)", marginBottom: 3 }}>모리의 답변</div>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, lineHeight: 1.6, color: "var(--ink)" }}>
                  {result.answer}
                </p>
              </div>
            </div>

            {/* 근거 기록 */}
            <div className="rowflex spread" style={{ marginTop: 18, marginBottom: 8, flex: "0 0 auto" }}>
              <span className="eyebrow">근거가 된 기록 · {evidenceList.length}건</span>
              <span className="muted tiny" style={{ fontWeight: 700 }}>관련도순</span>
            </div>
            <div className="stack-sm" style={{ flex: "0 0 auto" }}>
              {evidenceList.map((ev) => (
                <button key={ev.item_id} className="row" style={{ padding: 10, gap: 12, cursor: "pointer", width: "100%", textAlign: "left" }} onClick={() => navigate(`/detail/${ev.item_id}`)}>
                  <div style={{ width: 54, height: 54, borderRadius: 10, background: "var(--primary-bg)", display: "grid", placeItems: "center", fontSize: 26, flex: "0 0 auto" }}>
                    {categoryEmoji(ev.category)}
                  </div>
                  <div className="row-main">
                    <div style={{ fontSize: 13.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ev.summary ?? ev.item_id}
                    </div>
                    <div className="muted tiny" style={{ marginTop: 3, fontWeight: 600 }}>
                      {ev.place ? `${ev.place} · ` : ""}{formatDate(ev.captured_at)}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <Pill tone={categoryTone(ev.category)}>{categoryEmoji(ev.category)} {ev.category ?? "기타"}</Pill>
                    </div>
                  </div>
                  <span className="chev">›</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="dock">
        {result && evidenceList.length > 0 ? (
          <div style={{ display: "flex", gap: 8 }}>
            <Btn style={{ flex: 1 }} onClick={() => navigate("/timeline")}>타임라인에서 보기</Btn>
            <Btn variant="ghost" icon="↻" style={{ flex: "0 0 auto", width: 56, padding: "13px" }} onClick={() => { setResult(null); setSearched(false); setQuery(""); }} />
          </div>
        ) : searched && !loading ? (
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost" style={{ flex: 1 }} onClick={clearFilters}>필터 지우기</Btn>
            <Btn style={{ flex: 1 }} onClick={() => navigate("/upload")}>사진 올리기</Btn>
          </div>
        ) : (
          <Btn onClick={() => handleSearch()} disabled={!query.trim() || loading}>
            <span style={{ fontSize: 18 }}>🔍</span> 검색
          </Btn>
        )}
      </div>
    </Phone>
  );
}
