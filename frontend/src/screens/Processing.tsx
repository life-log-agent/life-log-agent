/* 4 · 처리 상태 (정상 진행) */
import { Phone, AppBar, Btn, Pill, DemoTag, Thumb, Track, Stages } from "../components/ui";
import { CAT } from "../data/samples";

export default function Processing() {
  return (
    <Phone>
      <AppBar title="처리 상태" />
      <div className="body">
        {/* overall */}
        <div className="card card-pad" style={{ flex: "0 0 auto" }}>
          <div className="rowflex spread">
            <b style={{ fontSize: 15 }}>전체 진행</b>
            <span className="muted tiny" style={{ fontWeight: 800 }}>
              1 / 3 완료
            </span>
          </div>
          <div style={{ marginTop: 10 }}>
            <Track pct={55} tone="blue" />
          </div>
          <div className="muted tiny" style={{ fontWeight: 700, marginTop: 8 }}>
            처리가 끝나면 자동으로 타임라인에 정리돼요. 이 화면을 닫아도 계속 진행됩니다.
          </div>
        </div>

        {/* item list */}
        <div className="stack-sm" style={{ marginTop: 16, flex: "0 0 auto" }}>
          {/* ready */}
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
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  cosmetic_lipstick.png
                </div>
                <div style={{ marginTop: 5 }}>
                  <Pill tone="green" dot>
                    완료 · 화장품으로 분류
                  </Pill>
                </div>
              </div>
            </div>
          </div>

          {/* processing (expanded steps) */}
          <div
            className="card card-pad"
            style={{ padding: 12, borderColor: "#B6E3FA", boxShadow: "0 2px 0 #B6E3FA" }}
          >
            <div className="rowflex gap12">
              <Thumb
                glyph="✈️"
                fname="jeju_travel.png"
                bg={CAT.travel.bg}
                h={48}
                style={{ width: 48, flex: "0 0 auto", borderRadius: 10 }}
              />
              <div className="row-main">
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  jeju_travel.png
                </div>
                <div style={{ marginTop: 5 }}>
                  <Pill tone="blue" dot>
                    처리 중 · 자동 분류
                  </Pill>
                </div>
              </div>
            </div>
            <Stages at={2} />
          </div>

          {/* pending */}
          <div className="card card-pad" style={{ padding: 12 }}>
            <div className="rowflex gap12">
              <Thumb
                glyph="🍽️"
                fname="food_restaurant.png"
                bg={CAT.food.bg}
                h={48}
                style={{ width: 48, flex: "0 0 auto", borderRadius: 10 }}
              />
              <div className="row-main">
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  food_restaurant.png
                </div>
                <div style={{ marginTop: 5 }}>
                  <Pill tone="gray" dot>
                    대기 중
                  </Pill>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 14 }}>
          <DemoTag>샘플 처리 흐름</DemoTag>
        </div>
      </div>

      <div className="dock">
        <Btn variant="ghost">백그라운드로 두기</Btn>
      </div>
    </Phone>
  );
}
