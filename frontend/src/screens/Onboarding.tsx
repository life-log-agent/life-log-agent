/* 1 · 로그인 / 온보딩 */
import { Phone, Btn, DemoTag, Thumb } from "../components/ui";

export default function Onboarding() {
  return (
    <Phone onColor lightHome>
      {/* green hero */}
      <div
        style={{
          background: "var(--green)",
          padding: "8px 26px 30px",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", right: -30, top: -20, fontSize: 150, opacity: 0.14 }}>
          🗂️
        </div>
        <div className="wordmark" style={{ fontSize: 30, marginTop: 6 }}>
          life_log
        </div>
        <div style={{ fontWeight: 700, opacity: 0.92, marginTop: 2, fontSize: 14 }}>
          나의 기록 보관함
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 26, marginBottom: 4 }}>
          <Thumb
            glyph="💄"
            fname="cosmetic_lipstick.png"
            bg="#FF9ED6"
            h={86}
            style={{ flex: 1, transform: "rotate(-4deg)" }}
          />
          <Thumb
            glyph="✈️"
            fname="jeju_travel.png"
            bg="#7FC9FF"
            h={96}
            style={{ flex: 1, marginTop: -6 }}
          />
          <Thumb
            glyph="🍽️"
            fname="food_restaurant.png"
            bg="#FFD86B"
            h={86}
            style={{ flex: 1, transform: "rotate(4deg)" }}
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <DemoTag>샘플 기록</DemoTag>
        </div>
      </div>

      <div className="body" style={{ paddingTop: 22 }}>
        <div className="h-xl" style={{ textWrap: "balance" }}>
          갤러리에 흩어진 기록,
          <br />
          <span style={{ color: "var(--green-d)" }}>한 곳에서 다시 찾기</span>
        </div>
        <p
          className="muted"
          style={{ fontSize: 15, lineHeight: 1.5, marginTop: 12, fontWeight: 600 }}
        >
          사진·스크린샷·캡처를 올리면 AI가 내용을 읽고 자동으로 분류해요. 그다음엔 그냥 말로 찾으면
          됩니다.
        </p>

        <div className="stack" style={{ marginTop: 22 }}>
          <div className="rowflex gap12">
            <div
              className="row-ico"
              style={{
                background: "var(--blue-bg)",
                width: 42,
                height: 42,
                borderRadius: 12,
                display: "grid",
                placeItems: "center",
                fontSize: 21,
                flex: "0 0 auto",
              }}
            >
              📥
            </div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>갤러리에서 골라 한 번에 업로드</div>
          </div>
          <div className="rowflex gap12">
            <div
              className="row-ico"
              style={{
                background: "var(--yellow-bg)",
                width: 42,
                height: 42,
                borderRadius: 12,
                display: "grid",
                placeItems: "center",
                fontSize: 21,
                flex: "0 0 auto",
              }}
            >
              🏷️
            </div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>화장품·여행지·맛집으로 자동 분류</div>
          </div>
          <div className="rowflex gap12">
            <div
              className="row-ico"
              style={{
                background: "var(--green-bg)",
                width: 42,
                height: 42,
                borderRadius: 12,
                display: "grid",
                placeItems: "center",
                fontSize: 21,
                flex: "0 0 auto",
              }}
            >
              💬
            </div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>“그때 그 립스틱” 처럼 말로 검색</div>
          </div>
        </div>
      </div>

      <div className="dock no-border">
        <div className="stack-sm">
          <Btn variant="green" icon="✉">
            이메일로 시작하기
          </Btn>
          <Btn variant="ghost">이미 계정이 있어요</Btn>
        </div>
        <p
          className="muted tiny"
          style={{ textAlign: "center", marginTop: 12, marginBottom: 0, lineHeight: 1.4 }}
        >
          계속하면 이용약관과 개인정보처리방침에 동의합니다
        </p>
      </div>
    </Phone>
  );
}
