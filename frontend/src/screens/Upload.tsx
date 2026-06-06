/* 3 · 업로드 (실제 연동) */
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { Phone, AppBar, Btn, Pill } from "../components/ui";
import { supabase } from "../lib/supabase";
import { ingest } from "../lib/api";
import { useAuth } from "../lib/auth";

interface PreviewFile {
  file: File;
  previewUrl: string;
}

export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [selected, setSelected] = useState<PreviewFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const previews: PreviewFile[] = files.map((f) => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));
    setSelected((prev) => [...prev, ...previews]);
    // reset input so same files can be re-selected
    e.target.value = "";
  }

  function removeFile(index: number) {
    setSelected((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleUpload() {
    if (!selected.length || !user) return;
    setUploading(true);
    setError(null);

    try {
      for (let i = 0; i < selected.length; i++) {
        const { file } = selected[i];
        const ext = file.name.split(".").pop() ?? "jpg";
        const storagePath = `${user.id}/${uuidv4()}.${ext}`;

        setProgress(`업로드 중… (${i + 1}/${selected.length})`);

        // 1. Supabase Storage에 직접 업로드
        const { error: storageError } = await supabase.storage
          .from("life-log-images")
          .upload(storagePath, file, { upsert: false });

        if (storageError) throw new Error(`Storage 오류: ${storageError.message}`);

        // 2. FastAPI /ingest 호출
        await ingest(storagePath, file.name);
      }

      // 업로드 완료 → 처리 상태 화면으로
      navigate("/processing");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
      setProgress("");
    }
  }

  return (
    <Phone>
      <AppBar title="업로드" />
      {/* 숨겨진 파일 입력 */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div className="body">
        <div className="rowflex spread" style={{ flex: "0 0 auto" }}>
          <div>
            <div className="h-md">선택한 사진</div>
            <div className="muted tiny" style={{ fontWeight: 700, marginTop: 2 }}>
              갤러리에서 여러 장 한 번에 고를 수 있어요
            </div>
          </div>
          {selected.length > 0 && (
            <Pill tone="green">{selected.length}장 선택</Pill>
          )}
        </div>

        {/* 미리보기 그리드 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            marginTop: 14,
            flex: "0 0 auto",
          }}
        >
          {selected.map((pf, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img
                src={pf.previewUrl}
                alt={pf.file.name}
                style={{
                  width: "100%",
                  height: 104,
                  objectFit: "cover",
                  borderRadius: 12,
                  display: "block",
                }}
              />
              <button
                onClick={() => removeFile(i)}
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,.55)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                ×
              </button>
            </div>
          ))}
          {/* 추가 타일 */}
          <button
            onClick={() => inputRef.current?.click()}
            style={{
              height: 104,
              border: "2px dashed var(--line)",
              borderRadius: 12,
              background: "var(--snow)",
              display: "grid",
              placeItems: "center",
              color: "var(--gray-2)",
              cursor: "pointer",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26, lineHeight: 1 }}>＋</div>
              <div style={{ fontSize: 10, fontWeight: 800, marginTop: 4 }}>
                {selected.length === 0 ? "사진 선택" : "더 추가"}
              </div>
            </div>
          </button>
        </div>

        {/* 오류 표시 */}
        {error && (
          <div
            style={{
              flex: "0 0 auto",
              marginTop: 14,
              padding: "10px 14px",
              borderRadius: 10,
              background: "#FFF0F0",
              border: "1px solid #FFC2C4",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--red-d)",
              lineHeight: 1.45,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* EXIF 안내 */}
        <div
          className="card card-pad"
          style={{
            marginTop: 18,
            flex: "0 0 auto",
            background: "var(--snow)",
            boxShadow: "none",
            padding: "12px 14px",
          }}
        >
          <div className="rowflex gap10">
            <span style={{ fontSize: 18 }}>📅</span>
            <div className="muted tiny" style={{ fontWeight: 700, lineHeight: 1.45 }}>
              촬영 시각·위치는 사진 정보에서{" "}
              <b style={{ color: "var(--ink-2)" }}>자동으로 추출</b>해요. 직접 입력할 필요 없어요.
            </div>
          </div>
        </div>
      </div>

      {/* 업로드 버튼 */}
      <div className="dock">
        <Btn
          variant={selected.length > 0 && !uploading ? "green" : "locked"}
          icon={uploading ? undefined : "↑"}
          onClick={handleUpload}
          disabled={selected.length === 0 || uploading}
        >
          {uploading ? progress || "업로드 중…" : `${selected.length > 0 ? selected.length + "장 " : ""}업로드`}
        </Btn>
      </div>
    </Phone>
  );
}
