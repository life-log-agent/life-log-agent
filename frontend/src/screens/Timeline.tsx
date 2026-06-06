/* 6 · 분류 결과 / 타임라인 (실제 API 연동) */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, BottomNav, Pill } from "../components/ui";
import { getItems } from "../lib/api";
import type { Item } from "../lib/api";

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / 86400000,
  );
  const label =
    diffDays === 0 ? "오늘" : diffDays === 1 ? "어제" : "";
  const ymd = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  return label ? `${ymd} · ${label}` : ymd;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function groupByDate(items: Item[]): Map<string, Item[]> {
  const map = new Map<string, Item[]>();
  for (const item of items) {
    const d = new Date(item.captured_at ?? item.created_at);
    const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
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

const CATEGORY_FILTERS = ["전체", "화장품", "여행지", "맛집", "기타"];

export default function Timeline() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("전체");

  useEffect(() => {
    getItems()
      .then((data) => setItems(data.filter((it) => it.status === "ready")))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "기록을 불러오지 못했습니다."),
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    activeFilter === "전체"
      ? items
      : items.filter((it) => {
          if (activeFilter === "기타") {
            return !["화장품", "여행지", "맛집"].includes(it.category ?? "");
          }
          return it.category === activeFilter;
        });

  const grouped = groupByDate(filtered);
  const sortedDates = Array.from(grouped.keys()).sort((a, b) => (a < b ? 1 : -1));

  // 카테고리별 개수
  const countOf = (cat: string) => {
    if (cat === "전체") return items.length;
    if (cat === "기타") return items.filter((it) => !["화장품", "여행지", "맛집"].includes(it.category ?? "")).length;
    return items.filter((it) => it.category === cat).length;
  };

  return (
    <Phone>
      <div className="appbar" style={{ paddingTop: 6 }}>
        <h1 style={{ flex: 1 }}>타임라인</h1>
      </div>

      <div className="body">
        {/* 카테고리 필터 */}
        <div
          className="rowflex gap8"
          style={{ flex: "0 0 auto", overflowX: "auto", paddingBottom: 4 }}
        >
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat}
              className={"chip" + (activeFilter === cat ? " active" : "")}
              onClick={() => setActiveFilter(cat)}
              style={{ whiteSpace: "nowrap", cursor: "pointer" }}
            >
              {cat === "화장품" ? "💄 " : cat === "여행지" ? "✈️ " : cat === "맛집" ? "🍽️ " : ""}
              {cat} {countOf(cat)}
            </button>
          ))}
        </div>

        {/* 오류 */}
        {error && (
          <div
            style={{
              flex: "0 0 auto",
              marginTop: 14,
              padding: "10px 14px",
              borderRadius: 10,
              background: "#FFF0F0",
              border: "1px solid #FFC2C4",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--red-d)",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* 로딩 */}
        {loading && (
          <div
            className="muted tiny"
            style={{ flex: "0 0 auto", marginTop: 24, textAlign: "center", fontWeight: 700 }}
          >
            불러오는 중…
          </div>
        )}

        {/* 빈 상태 */}
        {!loading && filtered.length === 0 && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              paddingBottom: 40,
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 16 }}>🗂️</div>
            <div className="h-md">기록이 없어요</div>
            <p className="muted" style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, marginTop: 8, maxWidth: 260 }}>
              {activeFilter === "전체"
                ? "아직 완료된 기록이 없어요. 사진을 올려보세요."
                : `${activeFilter} 카테고리 기록이 없어요.`}
            </p>
          </div>
        )}

        {/* 날짜별 그룹 */}
        {!loading && sortedDates.length > 0 && (
          <div style={{ marginTop: 16, flex: "0 0 auto" }}>
            {sortedDates.map((dateKey) => {
              const dayItems = grouped.get(dateKey)!;
              const sample = dayItems[0];
              return (
                <div key={dateKey}>
                  <div className="muted tiny" style={{ fontWeight: 800, margin: "0 0 8px" }}>
                    {formatDateLabel(sample.captured_at ?? sample.created_at)}
                  </div>
                  <div className="stack-sm" style={{ marginBottom: 14 }}>
                    {dayItems.map((item) => (
                      <button
                        key={item.id}
                        className="row"
                        style={{ padding: 10, gap: 12, cursor: "pointer", width: "100%", textAlign: "left" }}
                        onClick={() => navigate(`/detail/${item.id}`)}
                      >
                        <div
                          style={{
                            width: 58,
                            height: 58,
                            borderRadius: 10,
                            background: "var(--snow)",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 28,
                            flex: "0 0 auto",
                          }}
                        >
                          {categoryEmoji(item.category)}
                        </div>
                        <div className="row-main">
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 800,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.summary ?? item.original_filename ?? item.id}
                          </div>
                          <div className="muted tiny" style={{ marginTop: 3, fontWeight: 600 }}>
                            {item.place ? `${item.place} · ` : ""}
                            {formatTime(item.captured_at ?? item.created_at)}
                          </div>
                          <div style={{ marginTop: 6 }}>
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
              );
            })}
          </div>
        )}
      </div>

      <BottomNav active="time" />
    </Phone>
  );
}
