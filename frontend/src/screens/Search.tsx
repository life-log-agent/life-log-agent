/* 7 · 검색 / 질의응답 (RAG) — 답변 + 근거 + 다음 행동 */
import type { ReactNode } from "react";
import { Phone, Btn, Thumb, Pill, DemoTag } from "../components/ui";
import { CAT, type CategoryKey } from "../data/samples";

function evidence(
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
        h={54}
        style={{ width: 54, flex: "0 0 auto", borderRadius: 10 }}
      />
      <div className="row-main">
        <div
          style={{
            fontSize: 13.5,
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

export default function Search() {
  return (
    <Phone>
      <div className="appbar" style={{ paddingTop: 6 }}>
        <div className="back">‹</div>
        <h1 style={{ flex: 1 }}>검색</h1>
      </div>
      <div className="body">
        {/* query field */}
        <div className="field focus" style={{ flex: "0 0 auto" }}>
          <span className="si" style={{ color: "var(--blue)" }}>
            🔍
          </span>
          <span style={{ fontWeight: 700, color: "var(--ink)" }}>사고 싶었던 화장품 보여줘</span>
        </div>
        {/* applied filters */}
        <div className="rowflex gap8 wrap" style={{ marginTop: 10, flex: "0 0 auto" }}>
          <span className="muted tiny" style={{ fontWeight: 800 }}>
            필터
          </span>
          <span className="chip active" style={{ padding: "5px 10px", fontSize: 12 }}>
            💄 화장품 ✕
          </span>
          <span className="chip active" style={{ padding: "5px 10px", fontSize: 12 }}>
            최근 30일 ✕
          </span>
          <span className="chip" style={{ padding: "5px 10px", fontSize: 12 }}>
            ＋ 장소
          </span>
        </div>

        {/* ── 답변 (summary) ── */}
        <div className="eyebrow" style={{ marginTop: 18, flex: "0 0 auto" }}>
          답변
        </div>
        <div className="answer" style={{ marginTop: 8, flex: "0 0 auto" }}>
          <div className="rowflex gap8" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>💬</span>
            <b style={{ fontSize: 14, color: "var(--green-d)", whiteSpace: "nowrap" }}>
              이렇게 찾았어요
            </b>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.55,
              fontWeight: 600,
              color: "var(--ink)",
            }}
          >
            최근 저장한 <b>화장품 위시리스트 2건</b>이에요. 둘 다 “사고 싶다”는 메모와 함께
            캡처됐고, 가장 최근 건 <b>오늘 올린 벨벳 틴트</b>예요.
          </p>
        </div>

        {/* ── 근거 (evidence) ── */}
        <div
          className="rowflex spread"
          style={{ marginTop: 18, marginBottom: 8, flex: "0 0 auto" }}
        >
          <span className="eyebrow">근거가 된 기록 · 2건</span>
          <span className="muted tiny" style={{ fontWeight: 700 }}>
            관련도순
          </span>
        </div>
        <div className="stack-sm" style={{ flex: "0 0 auto" }}>
          {evidence("cosmetic", "cosmetic_lipstick.png", "벨벳 틴트 — 데모 12호", "올리브영(샘플)", "오늘")}
          {evidence("cosmetic", "cosmetic_wishlist.png", "쿠션 팩트 위시리스트", "샘플 캡처", "3일 전")}
        </div>
        <div style={{ marginTop: 10, flex: "0 0 auto" }}>
          <DemoTag>샘플 검색 결과</DemoTag>
        </div>
      </div>

      {/* ── 다음 행동 (next action) ── */}
      <div className="dock">
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="green" style={{ flex: 1 }}>
            타임라인에서 보기
          </Btn>
          <Btn variant="ghost" icon="↻" style={{ flex: "0 0 auto", width: 56, padding: 13 }}>
            {" "}
          </Btn>
        </div>
      </div>
    </Phone>
  );
}
