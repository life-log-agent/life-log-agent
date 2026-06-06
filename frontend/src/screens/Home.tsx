/* 2b · 홈 — 기록 있음 (1차 화면) */
import type { ReactNode } from "react";
import { Phone, BottomNav, Thumb, Pill, Track, DemoTag } from "../components/ui";
import { CAT, type CategoryKey } from "../data/samples";

function item(
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
        h={56}
        style={{ width: 56, flex: "0 0 auto", borderRadius: 10 }}
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
    </div>
  );
}

export default function Home() {
  return (
    <Phone>
      <div className="appbar" style={{ paddingTop: 6, paddingBottom: 10 }}>
        <span className="wordmark" style={{ fontSize: 22, color: "var(--green-d)", flex: 1 }}>
          life_log
        </span>
        <div className="back" style={{ fontSize: 20 }}>
          ⚙
        </div>
      </div>

      <div className="body">
        {/* search entry */}
        <div className="field" style={{ flex: "0 0 auto" }}>
          <span className="si">🔍</span>
          <span className="muted" style={{ fontWeight: 600 }}>
            말로 기록 찾기…
          </span>
        </div>

        {/* processing banner */}
        <div
          className="card card-pad"
          style={{
            marginTop: 12,
            flex: "0 0 auto",
            borderColor: "#B6E3FA",
            boxShadow: "0 2px 0 #B6E3FA",
          }}
        >
          <div className="rowflex spread">
            <div className="rowflex gap8">
              <span style={{ fontSize: 18 }}>⏳</span>
              <b style={{ fontSize: 14, whiteSpace: "nowrap" }}>3장 처리 중</b>
            </div>
            <Pill tone="blue" dot>
              분석 중
            </Pill>
          </div>
          <div style={{ marginTop: 10 }}>
            <Track pct={66} tone="blue" thin />
          </div>
        </div>

        {/* recent timeline summary */}
        <div
          className="rowflex spread"
          style={{ marginTop: 18, marginBottom: 8, flex: "0 0 auto" }}
        >
          <span className="eyebrow">최근 기록</span>
          <span
            className="tiny"
            style={{ color: "var(--blue-d)", fontWeight: 800, whiteSpace: "nowrap" }}
          >
            타임라인 전체 ›
          </span>
        </div>

        <div style={{ flex: "0 0 auto", marginBottom: 6 }}>
          <div className="muted tiny" style={{ fontWeight: 800, margin: "2px 0 8px" }}>
            오늘
          </div>
          <div className="stack-sm">
            {item("cosmetic", "cosmetic_lipstick.png", "벨벳 틴트 — 데모 12호", "올리브영(샘플)", "오늘 14:02")}
            {item("food", "food_restaurant.png", "흑돼지 구이 한 상", "샘플 식당 · 제주", "오늘 12:40")}
          </div>
          <div className="muted tiny" style={{ fontWeight: 800, margin: "12px 0 8px" }}>
            어제
          </div>
          <div className="stack-sm">
            {item("travel", "jeju_travel.png", "성산일출봉 입장 안내", "제주(샘플)", "어제 09:15")}
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 4 }}>
          <DemoTag>샘플 데이터</DemoTag>
        </div>
      </div>

      <BottomNav active="home" />
    </Phone>
  );
}
