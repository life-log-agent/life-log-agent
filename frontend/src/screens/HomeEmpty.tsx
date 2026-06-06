/* 2a · 홈 — 빈 상태 (첫 업로드 유도) */
import { Phone, BottomNav } from "../components/ui";

export default function HomeEmpty() {
  return (
    <Phone>
      <div className="appbar" style={{ paddingTop: 6 }}>
        <span className="wordmark" style={{ fontSize: 22, color: "var(--green-d)", flex: 1 }}>
          life_log
        </span>
        <div className="back" style={{ fontSize: 20 }}>
          ⚙
        </div>
      </div>

      <div
        className="body"
        style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 30,
            background: "var(--snow)",
            border: "2px dashed var(--line)",
            display: "grid",
            placeItems: "center",
            fontSize: 54,
          }}
        >
          🗂️
        </div>
        <div className="h-lg" style={{ marginTop: 22, whiteSpace: "nowrap" }}>
          아직 기록이 없어요
        </div>
        <p
          className="muted"
          style={{
            fontSize: 14.5,
            fontWeight: 600,
            lineHeight: 1.5,
            marginTop: 10,
            maxWidth: 280,
          }}
        >
          갤러리에서 사진·스크린샷을 골라 올리면
          <br />
          AI가 자동으로 정리해 드릴게요.
        </p>
        <div
          style={{
            marginTop: 16,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <span className="chip">💄 화장품</span>
          <span className="chip">✈️ 여행지</span>
          <span className="chip">🍽️ 맛집</span>
        </div>
      </div>

      <BottomNav active="home" />
    </Phone>
  );
}
