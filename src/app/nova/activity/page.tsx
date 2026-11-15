import { ACTIVITY, agentDisplayName } from "@/lib/nova/data";

export default function NovaActivityPage() {
  return (
    <div className="nova-page">
      <header style={{ marginBottom: 36 }}>
        <h1 className="n-title">Activity</h1>
        <p className="n-secondary" style={{ marginTop: 10 }}>
          What your team is doing — without the noise.
        </p>
      </header>
      <div className="n-feed">
        {ACTIVITY.map((e) => (
          <div
            key={e.id}
            className="n-feed__item"
            style={{
              display: "grid",
              gridTemplateColumns: "20px 1fr auto",
              gap: 12,
              alignItems: "start",
            }}
          >
            <span className="n-meta" style={{ paddingTop: 2 }}>
              {e.kind === "done"
                ? "✓"
                : e.kind === "working"
                  ? "●"
                  : e.kind === "waiting"
                    ? "○"
                    : e.kind === "approval"
                      ? "!"
                      : "·"}
            </span>
            <div>
              <div className="n-body">{e.text}</div>
              {e.agent ? (
                <div className="n-meta" style={{ marginTop: 4 }}>
                  {agentDisplayName(e.agent)}
                  {e.agent !== "nova" ? ` · @${e.agent}` : ""}
                </div>
              ) : null}
            </div>
            <div className="n-meta">{e.at}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
