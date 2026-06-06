/* 6 · 분류 결과 / 타임라인 */
import type { ReactNode } from "react";
import { Phone, BottomNav, Thumb, Pill, DemoTag } from "../components/ui";
import { CAT, type CategoryKey } from "../data/samples";

function card(
  cat: CategoryKey,
  fname: string,
  title: string,
  place: string,
  date: string,
): ReactNode {
  const c = CAT[cat];
  return (
    <div className="row" style={{ padding: 10, gap: 12 }}>
      <Thumb
        glyph={c.emoji}
        fname={fname}
        bg={c.bg}
        h={58}
        style={{ width: 58, flex: "0 0 auto", borderRadius: 10 }}
      />
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
          {title}
        </div>
        <div className="muted tiny" style={{ marginTop: 3, fontWeight: 600 }}>
          {place} · {date}
        </div>
        <div style={{ marginTop: 6 }}>
          <Pill tone={c.tone}>
            {c.emoji} {c.label}
          </Pill>
        </div>
      </div>
      <span className="chev">›</span>
    </div>
  );
}

export default function Timeline() {
  return (
    <Phone>
      <div className="appbar" style={{ paddingTop: 6 }}>
        <h1 style={{ flex: 1 }}>타임라인</h1>
        <div className="back" style={{ fontSize: 18 }}>
          ⤢
        </div>
      </div>
      <div className="body">
        {/* category filter */}
        <div className="rowflex gap8" style={{ flex: "0 0 auto", overflow: "hidden" }}>
          <span className="chip active">전체 24</span>
          <span className="chip">💄 화장품 9</span>
          <span className="chip">✈️ 여행지 7</span>
          <span className="chip">🍽️ 맛집 6</span>
        </div>

        <div style={{ marginTop: 16, flex: "0 0 auto" }}>
          <div className="muted tiny" style={{ fontWeight: 800, margin: "0 0 8px" }}>
            2026년 6월 6일 · 오늘
          </div>
          <div className="stack-sm">
            {card("cosmetic", "cosmetic_lipstick.png", "벨벳 틴트 — 데모 12호", "올리브영(샘플)", "14:02")}
            {card("food", "food_restaurant.png", "흑돼지 구이 한 상", "샘플 식당 · 제주", "12:40")}
          </div>

          <div className="muted tiny" style={{ fontWeight: 800, margin: "14px 0 8px" }}>
            2026년 6월 5일 · 어제
          </div>
          <div className="stack-sm">
            {card("travel", "jeju_travel.png", "성산일출봉 입장 안내", "제주(샘플)", "09:15")}
            {card("etc", "receipt_demo.png", "영수증 — 합계 ₩—,—", "샘플 매장", "08:30")}
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <DemoTag>샘플 데이터</DemoTag>
        </div>
      </div>
      <BottomNav active="time" />
    </Phone>
  );
}
