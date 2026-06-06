/* 9 · 항목 상세 */
import type { ReactNode } from "react";
import { Phone, AppBar, Btn, Pill, DemoTag, Thumb } from "../components/ui";
import { CAT } from "../data/samples";

function meta(k: string, v: string): ReactNode {
  return (
    <div className="rowflex spread" style={{ padding: "9px 0" }}>
      <span className="muted tiny" style={{ fontWeight: 700 }}>
        {k}
      </span>
      <span style={{ fontSize: 13, fontWeight: 800 }}>{v}</span>
    </div>
  );
}

export default function Detail() {
  const c = CAT.cosmetic;
  return (
    <Phone>
      <AppBar
        title="기록 상세"
        right={
          <div className="back" style={{ fontSize: 18 }}>
            ⋯
          </div>
        }
      />
      <div className="body">
        {/* original preview */}
        <Thumb
          glyph={c.emoji}
          fname="cosmetic_lipstick.png"
          bg={c.bg}
          h={188}
          style={{ flex: "0 0 auto" }}
        />
        <div className="rowflex gap8" style={{ marginTop: 10, flex: "0 0 auto" }}>
          <Pill tone={c.tone}>{c.emoji} 화장품</Pill>
          <DemoTag>데모용 이미지</DemoTag>
        </div>

        <div className="h-md" style={{ marginTop: 14, flex: "0 0 auto" }}>
          벨벳 틴트 — 데모 12호
        </div>

        {/* extracted text */}
        <div className="eyebrow" style={{ marginTop: 16, flex: "0 0 auto" }}>
          AI가 읽은 내용
        </div>
        <div
          className="card card-pad"
          style={{ marginTop: 8, flex: "0 0 auto", background: "var(--snow)", boxShadow: "none" }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13.5,
              lineHeight: 1.6,
              fontWeight: 600,
              color: "var(--ink-2)",
            }}
          >
            “벨벳 매트 립틴트 12호, 한정 기획 세트. 메모:{" "}
            <b style={{ color: "var(--ink)" }}>다음에 꼭 사기</b>.” 스크린샷에서 추출한 설명·문구예요.
          </p>
        </div>

        {/* metadata */}
        <div className="eyebrow" style={{ marginTop: 16, flex: "0 0 auto" }}>
          메타데이터
        </div>
        <div
          className="card card-pad"
          style={{ marginTop: 8, flex: "0 0 auto", paddingTop: 4, paddingBottom: 4 }}
        >
          {meta("촬영 시각", "2026.06.06 14:02")}
          <hr className="hr" />
          {meta("장소(추정)", "올리브영 · 샘플")}
          <hr className="hr" />
          {meta("태그", "위시리스트 · 립")}
          <hr className="hr" />
          {meta("출처 파일", "cosmetic_lipstick.png")}
        </div>
      </div>

      <div className="dock">
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="green" style={{ flex: 1 }}>
            비슷한 기록 찾기
          </Btn>
          <Btn variant="ghost" style={{ flex: "0 0 auto", width: 56 }}>
            🗑
          </Btn>
        </div>
      </div>
    </Phone>
  );
}
