/* 8 · 검색 결과 0건 (빈 상태) */
import { Phone, Btn } from "../components/ui";

export default function SearchEmpty() {
  return (
    <Phone>
      <div className="appbar" style={{ paddingTop: 6 }}>
        <div className="back">‹</div>
        <h1 style={{ flex: 1 }}>검색</h1>
      </div>
      <div className="body">
        <div className="field" style={{ flex: "0 0 auto" }}>
          <span className="si">🔍</span>
          <span style={{ fontWeight: 700, color: "var(--ink)" }}>작년 가을 단풍 사진</span>
        </div>
        <div className="rowflex gap8 wrap" style={{ marginTop: 10, flex: "0 0 auto" }}>
          <span className="muted tiny" style={{ fontWeight: 800 }}>
            필터
          </span>
          <span className="chip active" style={{ padding: "5px 10px", fontSize: 12 }}>
            2025 가을 ✕
          </span>
          <span className="chip active" style={{ padding: "5px 10px", fontSize: 12 }}>
            ✈️ 여행지 ✕
          </span>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            paddingBottom: 30,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 26,
              background: "var(--snow)",
              border: "2px dashed var(--line)",
              display: "grid",
              placeItems: "center",
              fontSize: 44,
            }}
          >
            🔎
          </div>
          <div className="h-md" style={{ marginTop: 18, whiteSpace: "nowrap" }}>
            딱 맞는 기록이 없어요
          </div>
          <p
            className="muted"
            style={{
              fontSize: 14,
              fontWeight: 600,
              lineHeight: 1.5,
              marginTop: 8,
              maxWidth: 270,
            }}
          >
            필터를 바꾸거나, 이 시기의 사진을 올리면 다시 찾을 수 있어요.
          </p>
        </div>
      </div>

      {/* next actions for empty */}
      <div className="dock">
        <div className="stack-sm">
          <Btn variant="blue" icon="⟲">
            필터 지우고 다시 검색
          </Btn>
          <Btn variant="ghost" icon="↑">
            이 시기 사진 올리기
          </Btn>
        </div>
      </div>
    </Phone>
  );
}
