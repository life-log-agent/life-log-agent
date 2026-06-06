/* 3 · 업로드 (입력) */
import { Phone, AppBar, Btn, Pill, DemoTag, Thumb } from "../components/ui";
import { CAT, type CategoryKey } from "../data/samples";

export default function Upload() {
  const sel: { cat: CategoryKey; fname: string }[] = [
    { cat: "cosmetic", fname: "cosmetic_lipstick.png" },
    { cat: "travel", fname: "jeju_travel.png" },
    { cat: "food", fname: "food_restaurant.png" },
  ];
  return (
    <Phone>
      <AppBar title="업로드" />
      <div className="body">
        <div className="rowflex spread" style={{ flex: "0 0 auto" }}>
          <div>
            <div className="h-md">선택한 사진</div>
            <div className="muted tiny" style={{ fontWeight: 700, marginTop: 2 }}>
              갤러리에서 여러 장 한 번에 고를 수 있어요
            </div>
          </div>
          <Pill tone="green">3장 선택</Pill>
        </div>

        {/* preview grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            marginTop: 14,
            flex: "0 0 auto",
          }}
        >
          {sel.map((s, i) => {
            const c = CAT[s.cat];
            return (
              <div key={i} style={{ position: "relative" }}>
                <Thumb glyph={c.emoji} fname={s.fname} bg={c.bg} h={104} />
                <div
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,.55)",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  ×
                </div>
              </div>
            );
          })}
          {/* add more tile */}
          <div
            style={{
              height: 104,
              border: "2px dashed var(--line)",
              borderRadius: 12,
              background: "var(--snow)",
              display: "grid",
              placeItems: "center",
              color: "var(--gray-2)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26, lineHeight: 1 }}>＋</div>
              <div style={{ fontSize: 10, fontWeight: 800, marginTop: 4 }}>더 추가</div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 10, flex: "0 0 auto" }}>
          <DemoTag>데모용 합성 이미지</DemoTag>
        </div>

        {/* optional memo / tag hint */}
        <div style={{ marginTop: 20, flex: "0 0 auto" }}>
          <div className="rowflex spread" style={{ marginBottom: 8 }}>
            <span className="eyebrow">메모·태그 힌트</span>
            <span className="muted tiny" style={{ fontWeight: 700, whiteSpace: "nowrap" }}>
              선택
            </span>
          </div>
          <div className="field" style={{ alignItems: "flex-start", height: 76 }}>
            <span className="muted" style={{ fontWeight: 600, fontSize: 14 }}>
              예) 제주 여행에서 가고 싶었던 곳…
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <span className="chip">＋ 여행</span>
            <span className="chip">＋ 위시리스트</span>
            <span className="chip">＋ 영수증</span>
          </div>
        </div>

        {/* EXIF auto note */}
        <div
          className="card card-pad"
          style={{
            marginTop: 18,
            flex: "0 0 auto",
            background: "var(--snow)",
            boxShadow: "none",
            padding: "12px 14px",
          }}
        >
          <div className="rowflex gap10">
            <span style={{ fontSize: 18 }}>📅</span>
            <div className="muted tiny" style={{ fontWeight: 700, lineHeight: 1.45 }}>
              촬영 시각·위치는 사진 정보에서{" "}
              <b style={{ color: "var(--ink-2)" }}>자동으로 추출</b>해요. 직접 입력할 필요 없어요.
            </div>
          </div>
        </div>
      </div>

      {/* thumb-reach primary action */}
      <div className="dock">
        <Btn variant="green" icon="↑">
          3장 업로드
        </Btn>
      </div>
    </Phone>
  );
}
