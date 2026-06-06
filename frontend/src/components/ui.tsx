/* life_log — shared UI primitives + mole mascot (v2 design) */

import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import type { CategoryKey, Tone } from "../data/samples";

type PillTone = Tone | "pink" | "warm";

// ── Phone Shell ──────────────────────────────────────────────
interface PhoneProps {
  children: ReactNode;
  onColor?: boolean;
  lightHome?: boolean;
}
export function Phone({ children }: PhoneProps) {
  return <div className="screen">{children}</div>;
}

// ── App Bar ──────────────────────────────────────────────────
interface AppBarProps {
  title: ReactNode;
  back?: boolean;
  right?: ReactNode;
  onBack?: () => void;
}
export function AppBar({ title, back = true, right, onBack }: AppBarProps) {
  const navigate = useNavigate();
  return (
    <div className="appbar">
      {back && (
        <div className="back" onClick={onBack ?? (() => navigate(-1))}>‹</div>
      )}
      <h1 style={{ flex: 1 }}>{title}</h1>
      {right}
    </div>
  );
}

// ── Button ───────────────────────────────────────────────────
interface BtnProps {
  children?: ReactNode;
  variant?: "green" | "blue" | "red" | "yellow" | "ghost" | "locked" | "sm";
  icon?: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}
export function Btn({ children, variant, icon, style, onClick, disabled, type = "button" }: BtnProps) {
  const cls = "btn" + (variant ? " btn--" + variant : "");
  return (
    <button className={cls} style={style} onClick={onClick} disabled={disabled} type={type}>
      {icon && <span className="ico">{icon}</span>}
      {children}
    </button>
  );
}

// ── Pill ─────────────────────────────────────────────────────
interface PillProps {
  tone?: PillTone;
  dot?: boolean;
  children: ReactNode;
}
export function Pill({ tone = "gray", dot, children }: PillProps) {
  return (
    <span className={"pill pill--" + tone}>
      {dot && <span className="dot" style={{ background: "currentColor" }} />}
      {children}
    </span>
  );
}

// ── Demo Tag ─────────────────────────────────────────────────
interface DemoTagProps { children?: ReactNode; }
export function DemoTag({ children = "데모용" }: DemoTagProps) {
  return <span className="demo-tag">◇ {children}</span>;
}

// ── Thumbnail ────────────────────────────────────────────────
interface ThumbProps {
  glyph: ReactNode;
  fname?: string;
  bg?: string;
  h?: number;
  style?: CSSProperties;
}
export function Thumb({ glyph, fname, bg, h = 92, style }: ThumbProps) {
  return (
    <div className="thumb" style={{ height: h, background: bg, ...style }}>
      <span className="glyph">{glyph}</span>
      {fname && <span className="fname">{fname}</span>}
    </div>
  );
}

// ── Progress Track ────────────────────────────────────────────
interface TrackProps {
  pct: number;
  tone?: "green" | "blue" | "yellow" | "red";
  thin?: boolean;
}
export function Track({ pct, tone, thin }: TrackProps) {
  const colors: Record<string, string> = {
    green: "var(--green)", blue: "var(--blue)",
    yellow: "var(--yellow)", red: "var(--red)",
  };
  return (
    <div className={"track" + (thin ? " thin" : "")}>
      <div className="fill" style={{ width: pct + "%", background: (tone && colors[tone]) || "var(--primary)" }} />
    </div>
  );
}

// ── Stages ───────────────────────────────────────────────────
interface StagesProps { at: number; }
export function Stages({ at }: StagesProps) {
  const labels = ["업로드", "내용 추출", "자동 분류", "검색 색인"];
  return (
    <div className="rowflex" style={{ gap: 4, marginTop: 8 }}>
      {labels.map((l, i) => {
        const done = i < at;
        const active = i === at;
        return (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ height: 6, borderRadius: 999, background: done ? "var(--green)" : active ? "var(--blue)" : "var(--line)" }} />
            <div style={{ fontSize: 9, fontWeight: 800, marginTop: 4, color: done ? "var(--green-d)" : active ? "var(--blue-d)" : "var(--gray-2)" }}>
              {l}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Bottom Nav ───────────────────────────────────────────────
type NavId = "home" | "time" | "search" | "me";
interface BottomNavProps { active?: NavId; }
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
    <NavLink key={t.id} to={t.to} className={"tab" + (active === t.id ? " active" : "")} style={{ textDecoration: "none", color: "inherit" }}>
      <span className="ti">{t.ti}</span>
      {t.label}
    </NavLink>
  );
  return (
    <div className="tabbar" style={{ position: "relative", overflow: "visible" }}>
      {tabs.map(tab)}
      <div style={{ flex: 1, position: "relative" }}>
        <NavLink to="/upload" style={{ position: "absolute", left: "50%", top: -26, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none" }}>
          <div style={{ width: 60, height: 60, borderRadius: 20, background: "var(--primary)", boxShadow: "0 4px 0 var(--primary-d)", display: "grid", placeItems: "center", color: "#fff", fontSize: 30, fontWeight: 800 }}>＋</div>
          <span style={{ fontSize: 10, fontWeight: 800, color: "var(--primary-d)", marginTop: 30 }}>업로드</span>
        </NavLink>
      </div>
      {tail.map(tab)}
    </div>
  );
}

// ── Mole SVG — 6 poses ───────────────────────────────────────

function moleEyes(type: string) {
  if (type === "happy") return (
    <>
      <path d="M55 88 Q64 78 73 88" stroke="#1A0A02" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M87 88 Q96 78 105 88" stroke="#1A0A02" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
    </>
  );
  if (type === "wide") return (
    <>
      <circle cx="64" cy="89" r="11" fill="#1A0A02"/><circle cx="68" cy="85" r="4" fill="rgba(255,255,255,.92)"/>
      <circle cx="96" cy="89" r="11" fill="#1A0A02"/><circle cx="100" cy="85" r="4" fill="rgba(255,255,255,.92)"/>
    </>
  );
  if (type === "squint") return (
    <>
      <path d="M55 88 Q64 83 73 88" stroke="#1A0A02" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M87 88 Q96 83 105 88" stroke="#1A0A02" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
    </>
  );
  return (
    <>
      <circle cx="64" cy="89" r="10" fill="#1A0A02"/><circle cx="67" cy="86" r="3.5" fill="rgba(255,255,255,.92)"/>
      <circle cx="96" cy="89" r="10" fill="#1A0A02"/><circle cx="99" cy="86" r="3.5" fill="rgba(255,255,255,.92)"/>
    </>
  );
}

function moleFace(eyes = "normal", smile = true) {
  return (
    <>
      <circle cx="80" cy="94" r="43" fill="#7B4A2B"/>
      <circle cx="50" cy="62" r="8" fill="#7B4A2B"/>
      <circle cx="110" cy="62" r="8" fill="#7B4A2B"/>
      <ellipse cx="80" cy="111" rx="25" ry="20" fill="#F5D0A8"/>
      {moleEyes(eyes)}
      <ellipse cx="80" cy="116" rx="8" ry="6" fill="#E87070"/>
      <circle cx="77" cy="117.5" r="2" fill="#B84040"/>
      <circle cx="83" cy="117.5" r="2" fill="#B84040"/>
      {smile && <path d="M71 125 Q80 133 89 125" stroke="#B84040" strokeWidth="2.5" fill="none" strokeLinecap="round"/>}
      <ellipse cx="47" cy="102" rx="12" ry="8" fill="rgba(200,80,80,.18)"/>
      <ellipse cx="113" cy="102" rx="12" ry="8" fill="rgba(200,80,80,.18)"/>
    </>
  );
}

function moleMound(yShift = 0) {
  const y = 170 + yShift;
  return (
    <>
      <ellipse cx="80" cy={y + 8} rx="76" ry="22" fill="#4A2810"/>
      <ellipse cx="80" cy={y}     rx="64" ry="17" fill="#6B3E1E"/>
      <ellipse cx="80" cy={y - 9} rx="52" ry="12" fill="#9B6B3D"/>
    </>
  );
}

function MoleIdle({ size = 120 }: { size?: number }) {
  const h = size * 200 / 160;
  return (
    <svg viewBox="0 0 160 200" width={size} height={h} style={{ display: "block" }}>
      <ellipse cx="80" cy="155" rx="37" ry="32" fill="#7B4A2B"/>
      <ellipse cx="80" cy="162" rx="20" ry="22" fill="#F5D0A8"/>
      {moleMound(-5)}
      <ellipse cx="32" cy="150" rx="22" ry="10" fill="#7B4A2B" transform="rotate(-18 32 150)"/>
      <ellipse cx="128" cy="150" rx="22" ry="10" fill="#7B4A2B" transform="rotate(18 128 150)"/>
      <line x1="16" y1="144" x2="12" y2="140" stroke="#5A3018" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="24" y1="141" x2="21" y2="137" stroke="#5A3018" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="32" y1="141" x2="30" y2="136" stroke="#5A3018" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="128" y1="141" x2="130" y2="136" stroke="#5A3018" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="136" y1="141" x2="139" y2="137" stroke="#5A3018" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="144" y1="144" x2="148" y2="140" stroke="#5A3018" strokeWidth="2.5" strokeLinecap="round"/>
      {moleFace("normal", true)}
    </svg>
  );
}

function MoleCurious({ size = 120 }: { size?: number }) {
  const h = size * 200 / 160;
  return (
    <svg viewBox="0 0 160 200" width={size} height={h} style={{ display: "block" }}>
      <ellipse cx="80" cy="155" rx="37" ry="32" fill="#7B4A2B"/>
      <ellipse cx="80" cy="162" rx="20" ry="22" fill="#F5D0A8"/>
      {moleMound(-5)}
      <ellipse cx="32" cy="150" rx="22" ry="10" fill="#7B4A2B" transform="rotate(-18 32 150)"/>
      <ellipse cx="132" cy="122" rx="10" ry="22" fill="#7B4A2B" transform="rotate(22 132 122)"/>
      <text x="144" y="102" fontSize="18" fill="var(--accent)" fontWeight="800">?</text>
      <g transform="rotate(-12 80 94)">{moleFace("wide", true)}</g>
    </svg>
  );
}

function MoleDigging({ size = 120 }: { size?: number }) {
  const h = size * 200 / 160;
  return (
    <svg viewBox="0 0 160 200" width={size} height={h} style={{ display: "block" }}>
      <circle cx="26" cy="110" r="7"  fill="#9B6B3D" opacity=".75"/>
      <circle cx="136" cy="106" r="5" fill="#7A4E2D" opacity=".7"/>
      <circle cx="44"  cy="96"  r="4" fill="#9B6B3D" opacity=".6"/>
      <circle cx="120" cy="100" r="6" fill="#6B3E1E" opacity=".65"/>
      <ellipse cx="80" cy="176" rx="76" ry="22" fill="#4A2810"/>
      <ellipse cx="80" cy="164" rx="66" ry="18" fill="#6B3E1E"/>
      <ellipse cx="80" cy="152" rx="56" ry="15" fill="#9B6B3D"/>
      <ellipse cx="16" cy="148" rx="28" ry="11" fill="#7B4A2B" transform="rotate(-35 16 148)"/>
      <ellipse cx="144" cy="148" rx="28" ry="11" fill="#7B4A2B" transform="rotate(35 144 148)"/>
      <g transform="translate(0 20)">
        <circle cx="80" cy="94" r="43" fill="#7B4A2B"/>
        <circle cx="50" cy="62" r="8" fill="#7B4A2B"/>
        <circle cx="110" cy="62" r="8" fill="#7B4A2B"/>
        <ellipse cx="80" cy="111" rx="25" ry="20" fill="#F5D0A8"/>
        {moleEyes("squint")}
        <ellipse cx="80" cy="116" rx="8" ry="6" fill="#E87070"/>
        <circle cx="77" cy="117.5" r="2" fill="#B84040"/>
        <circle cx="83" cy="117.5" r="2" fill="#B84040"/>
        <path d="M71 128 Q80 123 89 128" stroke="#B84040" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <ellipse cx="47" cy="102" rx="12" ry="8" fill="rgba(200,80,80,.18)"/>
        <ellipse cx="113" cy="102" rx="12" ry="8" fill="rgba(200,80,80,.18)"/>
      </g>
    </svg>
  );
}

function MoleSurfacing({ size = 120 }: { size?: number }) {
  const h = size * 200 / 160;
  return (
    <svg viewBox="0 0 160 200" width={size} height={h} style={{ display: "block" }}>
      <ellipse cx="80" cy="178" rx="76" ry="20" fill="#4A2810"/>
      <ellipse cx="80" cy="168" rx="64" ry="16" fill="#6B3E1E"/>
      <ellipse cx="80" cy="159" rx="52" ry="12" fill="#9B6B3D"/>
      <ellipse cx="80" cy="148" rx="37" ry="32" fill="#7B4A2B"/>
      <ellipse cx="80" cy="155" rx="20" ry="22" fill="#F5D0A8"/>
      <ellipse cx="32" cy="148" rx="22" ry="10" fill="#7B4A2B" transform="rotate(-18 32 148)"/>
      <ellipse cx="130" cy="110" rx="10" ry="26" fill="#7B4A2B" transform="rotate(18 130 110)"/>
      <rect x="110" y="14" width="46" height="36" rx="7" fill="#FFF8E0" stroke="#FFD060" strokeWidth="2"/>
      <circle cx="133" cy="26" r="6" fill="#FFD86B" opacity=".8"/>
      <rect x="114" y="36" width="38" height="5" rx="2.5" fill="#FFD060" opacity=".6"/>
      <ellipse cx="133" cy="32" rx="26" ry="22" fill="rgba(255,210,60,.12)"/>
      <line x1="110" y1="10" x2="104" y2="4"  stroke="#FFD060" strokeWidth="2" strokeLinecap="round"/>
      <line x1="134" y1="8"  x2="134" y2="0"  stroke="#FFD060" strokeWidth="2" strokeLinecap="round"/>
      <line x1="158" y1="10" x2="164" y2="4"  stroke="#FFD060" strokeWidth="2" strokeLinecap="round"/>
      {moleFace("wide", true)}
    </svg>
  );
}

function MoleProud({ size = 120 }: { size?: number }) {
  const h = size * 200 / 160;
  return (
    <svg viewBox="0 0 160 200" width={size} height={h} style={{ display: "block" }}>
      <ellipse cx="80" cy="148" rx="37" ry="34" fill="#7B4A2B"/>
      <ellipse cx="80" cy="156" rx="20" ry="24" fill="#F5D0A8"/>
      {moleMound(-10)}
      <ellipse cx="32" cy="146" rx="22" ry="10" fill="#7B4A2B" transform="rotate(-18 32 146)"/>
      <ellipse cx="130" cy="118" rx="10" ry="24" fill="#7B4A2B" transform="rotate(12 130 118)"/>
      <ellipse cx="136" cy="98" rx="9" ry="13" fill="#7B4A2B"/>
      <ellipse cx="138" cy="88" rx="6" ry="9" fill="#7B4A2B"/>
      <text x="14"  y="68" fontSize="16" fill="#FFD060" opacity=".9">✦</text>
      <text x="138" y="60" fontSize="12" fill="#FFD060" opacity=".8">✦</text>
      <text x="24"  y="96" fontSize="10" fill="#D4956A" opacity=".7">✦</text>
      {moleFace("happy", true)}
    </svg>
  );
}

export type MolePose = "idle" | "curious" | "digging" | "surfacing" | "proud";

interface MoleSVGProps {
  pose?: MolePose;
  size?: number;
}
export function MoleSVG({ pose = "idle", size = 120 }: MoleSVGProps) {
  const poses: Record<MolePose, ({ size }: { size?: number }) => JSX.Element> = {
    idle: MoleIdle,
    curious: MoleCurious,
    digging: MoleDigging,
    surfacing: MoleSurfacing,
    proud: MoleProud,
  };
  const Pose = poses[pose] ?? MoleIdle;
  return <Pose size={size} />;
}

// ── Speech Bubble ─────────────────────────────────────────────
const DEFAULT_BUBBLE_MSGS = [
  "안녕! 나는 기억을 지키는 두더지야 🐾",
  "사진이나 스크린샷을 올려줘.",
  "내가 땅속에 꼭꼭 숨겨뒀다가 필요할 때 찾아줄게!",
];

interface SpeechBubbleProps {
  messages?: string[];
  onClose?: () => void;
}
export function SpeechBubble({ messages = DEFAULT_BUBBLE_MSGS, onClose }: SpeechBubbleProps) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % messages.length), 3000);
    return () => clearInterval(t);
  }, [messages.length]);
  return (
    <div className="speech-bubble tail-down bubble-appear">
      {onClose && <button className="bubble-close" onClick={onClose}>✕</button>}
      <p style={{ margin: 0, paddingRight: onClose ? 22 : 0, color: "var(--ink-2)", fontSize: 13.5, fontWeight: 600, lineHeight: 1.6 }}>
        {messages[idx]}
      </p>
      <div className="bubble-dots">
        {messages.map((_, i) => (
          <div key={i} className={"bubble-dot" + (i === idx ? " active" : "")} />
        ))}
      </div>
    </div>
  );
}

// ── Hamburger Drawer ──────────────────────────────────────────
interface HamburgerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  active?: string;
}
export function HamburgerDrawer({ isOpen, onClose, active = "home" }: HamburgerDrawerProps) {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const navItems = [
    { id: "home",     icon: "🏠", label: "홈",      to: "/home" },
    { id: "upload",   icon: "📷", label: "업로드",  to: "/upload" },
    { id: "timeline", icon: "🗂️", label: "기록",    to: "/timeline" },
    { id: "search",   icon: "🔍", label: "검색",    to: "/search" },
  ];
  function go(to: string) { onClose(); navigate(to); }
  async function handleSignOut() {
    onClose();
    await signOut().catch(console.error);
    navigate("/onboarding", { replace: true });
  }
  return (
    <>
      {isOpen && <div className="drawer-overlay" onClick={onClose} />}
      <div className={"drawer" + (isOpen ? " open" : "")}>
        <div className="drawer-header">
          <span className="wordmark" style={{ fontSize: 22, color: "var(--primary)" }}>life_log</span>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>
        <nav className="drawer-nav">
          {navItems.map((it) => (
            <div key={it.id} className={"drawer-item" + (it.id === active ? " active" : "")} onClick={() => go(it.to)}>
              <span className="ni">{it.icon}</span>
              <span>{it.label}</span>
            </div>
          ))}
        </nav>
        <div className="drawer-footer" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
          {session && (
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gray)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {session.user.email}
            </div>
          )}
          <button
            onClick={handleSignOut}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: "1.5px solid var(--line)", background: "var(--surface)", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "var(--gray)" }}
          >
            <span style={{ fontSize: 18 }}>🚪</span>
            로그아웃
          </button>
        </div>
      </div>
    </>
  );
}

export type { CategoryKey };
