import { BUSINESS } from "@/lib/nova/data";
import { LlmStatus } from "@/components/nova/LlmStatus";

export default function NovaSettingsPage() {
  return (
    <div className="nova-page">
      <header style={{ marginBottom: 36 }}>
        <h1 className="n-title">Settings</h1>
        <p className="n-secondary" style={{ marginTop: 10 }}>
          Workspace context shared with every agent.
        </p>
      </header>

      <section className="n-card" style={{ marginBottom: 16 }}>
        <h2 className="n-h3" style={{ marginBottom: 8 }}>
          AI brain
        </h2>
        <p className="n-secondary" style={{ marginBottom: 14 }}>
          Connect any smart LLM so chat can answer almost anything.
        </p>
        <LlmStatus />
      </section>

      <section className="n-card">
        <h2 className="n-h3" style={{ marginBottom: 16 }}>
          Business profile
        </h2>
        <div className="n-feed">
          {(
            [
              ["Name", BUSINESS.name],
              ["Industry", BUSINESS.industry],
              ["Location", BUSINESS.location],
              ["Employees", String(BUSINESS.employees)],
              ["Customers", String(BUSINESS.customers)],
              ["Monthly revenue", BUSINESS.monthlyRevenue],
              ["Outstanding", BUSINESS.outstanding],
              ["Plan", BUSINESS.plan],
            ] as const
          ).map(([k, v]) => (
            <div
              key={k}
              className="n-feed__item"
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                paddingTop: 14,
                paddingBottom: 14,
              }}
            >
              <span className="n-secondary">{k}</span>
              <strong style={{ fontWeight: 600 }}>{v}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
