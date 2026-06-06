/* 9 · 항목 상세 (실제 API 연동) */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Phone, AppBar, Btn, Pill } from "../components/ui";
import { getItem, getSignedUrl, deleteItem } from "../lib/api";
import type { Item } from "../lib/api";

function meta(k: string, v: string) {
  return (
    <div className="rowflex spread" style={{ padding: "9px 0" }}>
      <span className="muted tiny" style={{ fontWeight: 700 }}>{k}</span>
      <span style={{ fontSize: 13, fontWeight: 800, maxWidth: "60%", textAlign: "right", wordBreak: "break-all" }}>{v}</span>
    </div>
  );
}

function formatDatetime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getDate().toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
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

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<Item | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        const [itemData, urlData] = await Promise.all([
          getItem(id!),
          getSignedUrl(id!).catch(() => null),
        ]);
        setItem(itemData);
        setSignedUrl(urlData?.signed_url ?? null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "기록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  async function handleDelete() {
    if (!id || !item) return;
    if (!window.confirm("이 기록을 삭제할까요?")) return;
    setDeleting(true);
    try {
      await deleteItem(id);
      navigate("/timeline", { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <Phone>
        <AppBar title="기록 상세" />
        <div className="body" style={{ alignItems: "center", justifyContent: "center" }}>
          <div className="muted tiny" style={{ fontWeight: 700 }}>불러오는 중…</div>
        </div>
      </Phone>
    );
  }

  if (error || !item) {
    return (
      <Phone>
        <AppBar title="기록 상세" />
        <div className="body" style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <div className="h-md">불러오지 못했어요</div>
          <p className="muted" style={{ fontSize: 14, fontWeight: 600, marginTop: 8 }}>
            {error ?? "기록을 찾을 수 없습니다."}
          </p>
        </div>
        <div className="dock">
          <Btn variant="ghost" onClick={() => navigate(-1)}>뒤로</Btn>
        </div>
      </Phone>
    );
  }

  return (
    <Phone>
      <AppBar
        title="기록 상세"
        right={
          <button
            className="back"
            style={{ fontSize: 18, background: "none", border: "none", cursor: "pointer" }}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "…" : "🗑"}
          </button>
        }
      />
      <div className="body">
        {/* 원본 미리보기 */}
        {signedUrl ? (
          <img
            src={signedUrl}
            alt={item.original_filename ?? "기록 이미지"}
            style={{
              width: "100%",
              height: 188,
              objectFit: "cover",
              borderRadius: 14,
              flex: "0 0 auto",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: 188,
              borderRadius: 14,
              background: "var(--snow)",
              display: "grid",
              placeItems: "center",
              fontSize: 54,
              flex: "0 0 auto",
            }}
          >
            {categoryEmoji(item.category)}
          </div>
        )}

        <div className="rowflex gap8" style={{ marginTop: 10, flex: "0 0 auto" }}>
          <Pill tone={categoryTone(item.category)}>
            {categoryEmoji(item.category)} {item.category ?? "기타"}
          </Pill>
        </div>

        <div className="h-md" style={{ marginTop: 14, flex: "0 0 auto" }}>
          {item.summary ?? item.original_filename ?? item.id}
        </div>

        {/* AI가 읽은 내용 */}
        {item.summary && (
          <>
            <div className="eyebrow" style={{ marginTop: 16, flex: "0 0 auto" }}>AI가 읽은 내용</div>
            <div
              className="card card-pad"
              style={{ marginTop: 8, flex: "0 0 auto", background: "var(--snow)", boxShadow: "none" }}
            >
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, fontWeight: 600, color: "var(--ink-2)" }}>
                {item.summary}
              </p>
            </div>
          </>
        )}

        {/* 메타데이터 */}
        <div className="eyebrow" style={{ marginTop: 16, flex: "0 0 auto" }}>메타데이터</div>
        <div
          className="card card-pad"
          style={{ marginTop: 8, flex: "0 0 auto", paddingTop: 4, paddingBottom: 4 }}
        >
          {meta("촬영 시각", formatDatetime(item.captured_at))}
          <hr className="hr" />
          {meta("장소(추정)", item.place ?? "—")}
          <hr className="hr" />
          {meta("태그", item.tags?.join(" · ") ?? "—")}
          <hr className="hr" />
          {meta("카테고리", item.category ?? "—")}
          <hr className="hr" />
          {meta("출처 파일", item.original_filename ?? "—")}
          <hr className="hr" />
          {meta("처리 상태", item.status)}
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
      </div>

      <div className="dock">
        <div style={{ display: "flex", gap: 8 }}>
          <Btn
            variant="green"
            style={{ flex: 1 }}
            onClick={() => navigate(`/search?q=${encodeURIComponent(item.summary ?? item.category ?? "")}`)}
          >
            비슷한 기록 찾기
          </Btn>
          <Btn
            variant="ghost"
            style={{ flex: "0 0 auto", width: 56 }}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "…" : "🗑"}
          </Btn>
        </div>
      </div>
    </Phone>
  );
}
