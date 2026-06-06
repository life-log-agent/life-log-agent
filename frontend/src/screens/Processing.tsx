/* 4 · 처리 상태 (실제 API 폴링) */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, AppBar, Btn, Pill, Track } from "../components/ui";
import { getItems, retryItem } from "../lib/api";
import type { Item } from "../lib/api";

function statusPill(status: Item["status"]) {
  switch (status) {
    case "ready":
      return <Pill tone="green" dot>완료</Pill>;
    case "processing":
      return <Pill tone="blue" dot>처리 중</Pill>;
    case "pending":
      return <Pill tone="gray" dot>대기 중</Pill>;
    case "failed":
      return <Pill tone="red" dot>실패</Pill>;
  }
}

export default function Processing() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<Record<string, boolean>>({});

  async function fetchItems() {
    try {
      const data = await getItems();
      setItems(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "기록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchItems();

    const interval = setInterval(() => {
      const hasPending = items.some(
        (it) => it.status === "pending" || it.status === "processing",
      );
      if (hasPending || items.length === 0) {
        fetchItems();
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
    // items는 의존성에서 의도적으로 제외 (interval 안에서 최신 판단)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // items가 바뀌면 pending/processing 없을 때 interval 재평가
  useEffect(() => {
    const hasPending = items.some(
      (it) => it.status === "pending" || it.status === "processing",
    );
    if (!hasPending && items.length > 0) {
      // 폴링 불필요 — 상태 유지
    }
  }, [items]);

  async function handleRetry(id: string) {
    setRetrying((r) => ({ ...r, [id]: true }));
    try {
      await retryItem(id);
      await fetchItems();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "재시도 중 오류가 발생했습니다.");
    } finally {
      setRetrying((r) => ({ ...r, [id]: false }));
    }
  }

  const total = items.length;
  const doneCount = items.filter((it) => it.status === "ready" || it.status === "failed").length;
  const readyCount = items.filter((it) => it.status === "ready").length;
  const failedItems = items.filter((it) => it.status === "failed");
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <Phone>
      <AppBar title="처리 상태" />
      <div className="body">
        {/* 전체 진행 */}
        <div className="card card-pad" style={{ flex: "0 0 auto" }}>
          <div className="rowflex spread">
            <b style={{ fontSize: 15 }}>전체 진행</b>
            <span className="muted tiny" style={{ fontWeight: 800 }}>
              {loading ? "불러오는 중…" : `${readyCount} / ${total} 완료`}
            </span>
          </div>
          <div style={{ marginTop: 10 }}>
            <Track pct={pct} tone="blue" />
          </div>
          <div className="muted tiny" style={{ fontWeight: 700, marginTop: 8 }}>
            처리가 끝나면 자동으로 타임라인에 정리돼요. 이 화면을 닫아도 계속 진행됩니다.
          </div>
        </div>

        {/* 오류 */}
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
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* 항목 목록 */}
        {loading ? (
          <div className="muted tiny" style={{ flex: "0 0 auto", marginTop: 20, textAlign: "center", fontWeight: 700 }}>
            불러오는 중…
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              flex: "0 0 auto",
              marginTop: 24,
              textAlign: "center",
              color: "var(--gray-2)",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            처리 중인 항목이 없습니다.
          </div>
        ) : (
          <div className="stack-sm" style={{ marginTop: 16, flex: "0 0 auto" }}>
            {items.map((item) => (
              <div
                key={item.id}
                className="card card-pad"
                style={{
                  padding: 12,
                  borderColor: item.status === "processing"
                    ? "#B6E3FA"
                    : item.status === "failed"
                    ? "#FFC2C4"
                    : undefined,
                  boxShadow: item.status === "processing"
                    ? "0 2px 0 #B6E3FA"
                    : item.status === "failed"
                    ? "0 2px 0 #FFC2C4"
                    : undefined,
                  background: item.status === "failed" ? "#FFF6F6" : undefined,
                }}
              >
                <div className="rowflex gap12">
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 10,
                      background: "var(--snow)",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 24,
                      flex: "0 0 auto",
                    }}
                  >
                    🖼️
                  </div>
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
                      {item.original_filename ?? item.id}
                    </div>
                    <div style={{ marginTop: 5 }}>{statusPill(item.status)}</div>
                  </div>
                </div>

                {/* 실패 시 재시도 버튼 */}
                {item.status === "failed" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <Btn
                      variant="red"
                      icon="↻"
                      style={{ flex: 2 }}
                      onClick={() => handleRetry(item.id)}
                      disabled={retrying[item.id]}
                    >
                      {retrying[item.id] ? "재시도 중…" : "재시도"}
                    </Btn>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 실패 항목 없고 모두 완료 시 홈 이동 유도 */}
        {!loading && total > 0 && failedItems.length === 0 && doneCount === total && (
          <div
            style={{
              flex: "0 0 auto",
              marginTop: 18,
              textAlign: "center",
              color: "var(--green-d)",
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            모두 완료됐어요!
          </div>
        )}
      </div>

      <div className="dock">
        <div style={{ display: "flex", gap: 8 }}>
          <Btn
            variant="green"
            style={{ flex: 1 }}
            onClick={() => navigate("/home")}
          >
            홈으로 이동
          </Btn>
          <Btn variant="ghost" style={{ flex: 1 }} onClick={() => navigate("/timeline")}>
            타임라인 보기
          </Btn>
        </div>
      </div>
    </Phone>
  );
}
