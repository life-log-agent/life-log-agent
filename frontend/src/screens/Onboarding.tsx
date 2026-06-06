/* 로그인 / 온보딩 — 두더지 마스코트 + 웜 브라운 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Btn, MoleSVG } from "../components/ui";
import { useAuth } from "../lib/auth";

type Mode = "landing" | "signin" | "signup";

export default function Onboarding() {
  const { signInWithEmail, signUp, session } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("landing");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signUpDone, setSignUpDone] = useState(false);

  if (session) {
    navigate("/home", { replace: true });
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
        navigate("/home", { replace: true });
      } else {
        await signUp(email, password);
        setSignUpDone(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  /* 회원가입 완료 */
  if (signUpDone) {
    return (
      <Phone>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "0 32px", gap: 0 }}>
          <div className="mole-bounce"><MoleSVG pose="proud" size={120} /></div>
          <div className="h-lg" style={{ marginTop: 20, textAlign: "center" }}>이메일을 확인해 주세요</div>
          <p className="muted" style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.6, marginTop: 10, textAlign: "center", maxWidth: 280 }}>
            <b>{email}</b>로 확인 링크를 보냈어요.<br />링크를 클릭한 뒤 로그인하세요.
          </p>
        </div>
        <div className="dock no-border">
          <Btn variant="ghost" onClick={() => { setSignUpDone(false); setMode("signin"); }}>
            로그인으로 이동
          </Btn>
        </div>
      </Phone>
    );
  }

  /* 이메일/비밀번호 폼 */
  if (mode === "signin" || mode === "signup") {
    return (
      <Phone>
        <div style={{ background: "var(--primary)", padding: "8px 26px 24px", color: "#fff" }}>
          <div className="wordmark" style={{ fontSize: 28, marginTop: 6 }}>life_log</div>
          <div style={{ fontWeight: 600, opacity: 0.88, marginTop: 2, fontSize: 14 }}>
            {mode === "signin" ? "로그인" : "회원가입"}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "contents" }}>
          <div className="body" style={{ paddingTop: 24 }}>
            <div style={{ flex: "0 0 auto" }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>이메일</div>
              <div className="field">
                <span className="si">✉</span>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com" required autoComplete="email"
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 15, fontWeight: 600, color: "var(--ink)" }}
                />
              </div>
            </div>
            <div style={{ flex: "0 0 auto", marginTop: 16 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>비밀번호</div>
              <div className="field">
                <span className="si">🔒</span>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "6자 이상" : "비밀번호 입력"}
                  required minLength={mode === "signup" ? 6 : undefined}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 15, fontWeight: 600, color: "var(--ink)" }}
                />
              </div>
            </div>
            {error && (
              <div style={{ flex: "0 0 auto", marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "var(--red-bg)", border: "1px solid #FFC2C4", fontSize: 13, fontWeight: 700, color: "var(--red-d)", lineHeight: 1.45 }}>
                ⚠️ {error}
              </div>
            )}
          </div>
          <div className="dock no-border">
            <div className="stack-sm">
              <Btn type="submit" disabled={loading}>
                {loading ? "처리 중…" : mode === "signin" ? "로그인" : "회원가입"}
              </Btn>
              <Btn variant="ghost" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}>
                {mode === "signin" ? "계정이 없어요 → 회원가입" : "이미 계정이 있어요 → 로그인"}
              </Btn>
              <Btn variant="ghost" onClick={() => { setMode("landing"); setError(null); }}>뒤로</Btn>
            </div>
          </div>
        </form>
      </Phone>
    );
  }

  /* 랜딩 */
  return (
    <Phone>
      {/* 두더지 + 브랜딩 */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "0 32px" }}>
        <div className="mole-bounce"><MoleSVG pose="curious" size={120} /></div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, color: "var(--primary)", textAlign: "center", marginTop: 20, letterSpacing: "-.5px" }}>
          life_log
        </div>
        <div style={{ fontSize: 14, color: "var(--gray)", textAlign: "center", marginTop: 8, lineHeight: 1.6, fontWeight: 600 }}>
          기억을 땅속에 모아두는 나만의 기록장
        </div>

        <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 300 }}>
          {[
            { icon: "📷", text: "갤러리 사진을 올리면 AI가 자동 분류" },
            { icon: "🔍", text: "\"제주 흑돼지 식당\" 말로 바로 검색" },
            { icon: "🗂️", text: "날짜·장소·카테고리로 타임라인 정리" },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--primary-bg)", border: "1.5px solid var(--accent)", display: "grid", placeItems: "center", fontSize: 18, flex: "0 0 auto" }}>
                {f.icon}
              </div>
              <span style={{ fontSize: 14, color: "var(--ink-2)", fontWeight: 600, lineHeight: 1.45 }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="dock no-border">
        <div className="stack-sm">
          <Btn onClick={() => setMode("signup")}>이메일로 시작하기</Btn>
          <Btn variant="ghost" onClick={() => setMode("signin")}>이미 계정이 있어요</Btn>
        </div>
        <p className="muted tiny" style={{ textAlign: "center", marginTop: 12, marginBottom: 0, lineHeight: 1.4 }}>
          계속하면 이용약관과 개인정보처리방침에 동의합니다
        </p>
      </div>
    </Phone>
  );
}
