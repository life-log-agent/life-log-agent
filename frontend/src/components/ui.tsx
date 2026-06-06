/* life_log — shared UI primitives (typed ports of the design handoff).
   NOTE: the prototype's iOS StatusBar ("9:41" + signal/wifi/battery) and the
   .home-ind home indicator are intentionally NOT ported — a real PWA must not
   fake OS chrome. Phone still wraps content in the .screen shell. The onColor /
   lightHome props are accepted-but-ignored so screen call sites stay unchanged. */

import type { CSSProperties, ReactNode } from "react";
import { NavLink } from "react-router-dom";
import type { CategoryKey, Tone } from "../data/samples";

// pill tones include "pink" (CAT.cosmetic) to mirror the source faithfully,
// even though .pill--pink has no dedicated rule in the copied design system.
type PillTone = Tone | "pink";

interface PhoneProps {
  children: ReactNode;
  /** accepted for call-site compatibility; no-op (used to theme the dropped StatusBar) */
  onColor?: boolean;
  /** accepted for call-site compatibility; no-op (used to theme the dropped home indicator) */
  lightHome?: boolean;
}

// phone shell wrapper (StatusBar + home indicator dropped)
export function Phone({ children }: PhoneProps) {
  return <div className="screen">{children}</div>;
}

interface AppBarProps {
  title: ReactNode;
  back?: boolean;
  right?: ReactNode;
}

export function AppBar({ title, back = true, right }: AppBarProps) {
  return (
    <div className="appbar">
      {back && <div className="back">‹</div>}
      <h1 style={{ flex: 1 }}>{title}</h1>
      {right}
    </div>
  );
}

interface BtnProps {
  children?: ReactNode;
  variant?: "green" | "blue" | "red" | "yellow" | "ghost" | "locked" | "sm";
  icon?: ReactNode;
  style?: CSSProperties;
}

export function Btn({ children, variant, icon, style }: BtnProps) {
  const cls = "btn" + (variant ? " btn--" + variant : "");
  return (
    <button className={cls} style={style}>
      {icon && <span className="ico">{icon}</span>}
      {children}
    </button>
  );
}

interface PillProps {
  tone?: PillTone;
  dot?: boolean;
  children: ReactNode;
}

export function Pill({ tone = "gray", dot, children }: PillProps) {
  return (
    <span className={"pill pill--" + tone}>
      {dot && <span className="dot" style={{ background: "currentColor" }}></span>}
      {children}
    </span>
  );
}

interface DemoTagProps {
  children?: ReactNode;
}

export function DemoTag({ children = "데모용" }: DemoTagProps) {
  return <span className="demo-tag">◇ {children}</span>;
}

interface ThumbProps {
  glyph: ReactNode;
  fname?: string;
  bg?: string;
  h?: number;
  style?: CSSProperties;
}

// synthetic thumbnail — clearly fake, never a real photo
export function Thumb({ glyph, fname, bg, h = 92, style }: ThumbProps) {
  return (
    <div className="thumb" style={{ height: h, background: bg, ...style }}>
      <span className="glyph">{glyph}</span>
      {fname && <span className="fname">{fname}</span>}
    </div>
  );
}

interface TrackProps {
  pct: number;
  tone?: "green" | "blue" | "yellow" | "red";
  thin?: boolean;
}

export function Track({ pct, tone, thin }: TrackProps) {
  const colors: Record<string, string> = {
    green: "var(--green)",
    blue: "var(--blue)",
    yellow: "var(--yellow)",
    red: "var(--red)",
  };
  return (
    <div className={"track" + (thin ? " thin" : "")}>
      <div
        className="fill"
        style={{ width: pct + "%", background: (tone && colors[tone]) || "var(--green)" }}
      ></div>
    </div>
  );
}

type NavId = "home" | "time" | "search" | "me";

interface BottomNavProps {
  active?: NavId;
}

// shared bottom nav with raised upload FAB
export function BottomNav({ active }: BottomNavProps) {
  const tabs: { id: NavId; to: string; ti: string; label: string }[] = [
    { id: "home", to: "/home", ti: "🏠", label: "홈" },
    { id: "time", to: "/timeline", ti: "🗂️", label: "타임라인" },
  ];
  const tail: { id: NavId; to: string; ti: string; label: string }[] = [
    { id: "search", to: "/search", ti: "🔍", label: "검색" },
    { id: "me", to: "/timeline", ti: "👤", label: "내 기록" },
  ];

  const tab = (t: { id: NavId; to: string; ti: string; label: string }) => (
    <NavLink
      key={t.id}
      to={t.to}
      className={"tab" + (active === t.id ? " active" : "")}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <span className="ti">{t.ti}</span>
      {t.label}
    </NavLink>
  );

  return (
    <div className="tabbar" style={{ position: "relative", overflow: "visible" }}>
      {tabs.map(tab)}
      {/* center upload FAB */}
      <div style={{ flex: 1, position: "relative" }}>
        <NavLink
          to="/upload"
          style={{
            position: "absolute",
            left: "50%",
            top: -26,
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 20,
              background: "var(--green)",
              boxShadow: "0 4px 0 var(--green-d)",
              display: "grid",
              placeItems: "center",
              color: "#fff",
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            ＋
          </div>
          <span style={{ fontSize: 10, fontWeight: 800, color: "var(--green-d)", marginTop: 30 }}>
            업로드
          </span>
        </NavLink>
      </div>
      {tail.map(tab)}
    </div>
  );
}

interface StagesProps {
  /** index of current stage (0..4). 4 = done */
  at: number;
}

// stage chip row for an item (업로드 → 추출 → 분류 → 색인)
export function Stages({ at }: StagesProps) {
  const labels = ["업로드", "내용 추출", "자동 분류", "검색 색인"];
  return (
    <div className="rowflex" style={{ gap: 4, marginTop: 8 }}>
      {labels.map((l, i) => {
        const done = i < at;
        const active = i === at;
        return (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                height: 6,
                borderRadius: 999,
                background: done ? "var(--green)" : active ? "var(--blue)" : "var(--line)",
              }}
            ></div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                marginTop: 4,
                color: done ? "var(--green-d)" : active ? "var(--blue-d)" : "var(--gray-2)",
              }}
            >
              {l}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// re-export the category type for screens that need the key union
export type { CategoryKey };
