/* 5 · 처리 상태 — 실패 / 재시도 (오류 상태) */
import { Phone, AppBar, Btn, Pill, DemoTag, Thumb, Track } from "../components/ui";
import { CAT } from "../data/samples";

export default function ProcessingFailed() {
  return (
    <Phone>
      <AppBar title="처리 상태" />
      <div className="body">
        <div className="card card-pad" style={{ flex: "0 0 auto" }}>
          <div className="rowflex spread">
            <b style={{ fontSize: 15 }}>전체 진행</b>
            <span className="muted tiny" style={{ fontWeight: 800 }}>
              2 / 3 완료
            </span>
          </div>
          <div style={{ marginTop: 10 }}>
            <Track pct={66} tone="green" />
          </div>
        </div>

        <div className="stack-sm" style={{ marginTop: 16, flex: "0 0 auto" }}>
          <div className="card card-pad" style={{ padding: 12 }}>
            <div className="rowflex gap12">
              <Thumb
                glyph="💄"
                fname="cosmetic_lipstick.png"
                bg={CAT.cosmetic.bg}
                h={48}
                style={{ width: 48, flex: "0 0 auto", borderRadius: 10 }}
              />
              <div className="row-main">
                <div style={{ fontSize: 13, fontWeight: 800 }}>cosmetic_lipstick.png</div>
                <div style={{ marginTop: 5 }}>
                  <Pill tone="green" dot>
                    완료
                  </Pill>
                </div>
              </div>
            </div>
          </div>

          {/* failed item */}
          <div
            className="card card-pad"
            style={{
              padding: 14,
              borderColor: "#FFC2C4",
              boxShadow: "0 2px 0 #FFC2C4",
              background: "#FFF6F6",
            }}
          >
            <div className="rowflex gap12">
              <Thumb
                glyph="🖼️"
                fname="food_restaurant.png"
                bg="#F0D0D0"
                h={48}
                style={{ width: 48, flex: "0 0 auto", borderRadius: 10 }}
              />
              <div className="row-main">
                <div style={{ fontSize: 13, fontWeight: 800 }}>food_restaurant.png</div>
                <div style={{ marginTop: 5 }}>
                  <Pill tone="red" dot>
                    실패 · 내용 추출 단계
                  </Pill>
                </div>
              </div>
            </div>
            <div className="rowflex gap8" style={{ marginTop: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 15 }}>⚠️</span>
              <div
                className="tiny"
                style={{ fontWeight: 700, color: "var(--red-d)", lineHeight: 1.45 }}
              >
                이미지가 흐려 글자를 읽지 못했어요. 같은 처리를 다시 시도할 수 있어요.
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <Btn variant="red" icon="↻" style={{ flex: 2 }}>
                재시도
              </Btn>
              <Btn variant="ghost" style={{ flex: 1 }}>
                건너뛰기
              </Btn>
            </div>
          </div>

          <div className="card card-pad" style={{ padding: 12 }}>
            <div className="rowflex gap12">
              <Thumb
                glyph="✈️"
                fname="jeju_travel.png"
                bg={CAT.travel.bg}
                h={48}
                style={{ width: 48, flex: "0 0 auto", borderRadius: 10 }}
              />
              <div className="row-main">
                <div style={{ fontSize: 13, fontWeight: 800 }}>jeju_travel.png</div>
                <div style={{ marginTop: 5 }}>
                  <Pill tone="green" dot>
                    완료
                  </Pill>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 14 }}>
          <DemoTag>샘플 오류 상태</DemoTag>
        </div>
      </div>

      <div className="dock">
        <Btn variant="green">완료된 기록 보기</Btn>
      </div>
    </Phone>
  );
}
