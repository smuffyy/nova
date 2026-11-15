import Link from "next/link";
import { PortalLogo } from "@/components/PortalLogo";
import { BRAND } from "@/brand";

const templates = [
  {
    href: "/templates/one",
    id: "01",
    name: "Template One",
    blurb: "Classic Sentry — logo-forward mobile, bold glow stack on desktop.",
  },
  {
    href: "/",
    id: "02",
    name: "Axiom (live)",
    blurb: "Observation-lab aesthetic — the current homepage.",
  },
  {
    href: "/templates/three",
    id: "03",
    name: "Template Three",
    blurb: "Frozen snapshot — Chat / Sidekick / Agents / Digest product story.",
  },
  {
    href: "/templates/four",
    id: "04",
    name: "Template Four",
    blurb: "Experiment — Active Theory method: agent cards on a backbone, scroll brings one forward.",
  },
];

export default function TemplatesIndexPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-16 text-[var(--fg)]">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="mb-12 flex items-center gap-3">
          <PortalLogo size={28} animated={false} />
          <span className="text-xs tracking-[0.32em]">{BRAND.nameUpper}</span>
        </Link>
        <p className="font-mono text-[11px] tracking-[0.2em] text-white/40">
          SITE VERSIONS
        </p>
        <h1 className="mt-3 text-3xl font-medium tracking-wide">Templates</h1>
        <p className="mt-3 max-w-lg font-light text-white/45">
          Saved homepage directions. Experiments land on new templates so the
          live site and Template Three stay easy to restore.
        </p>
        <ul className="mt-12 space-y-4">
          {templates.map((t) => (
            <li key={t.id}>
              <Link
                href={t.href}
                className="panel block px-5 py-5 transition hover:border-white/25"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-mono text-[11px] text-white/35">{t.id}</span>
                  <span className="text-xs text-white/35">OPEN →</span>
                </div>
                <div className="mt-2 text-xl font-medium tracking-wide">{t.name}</div>
                <p className="mt-2 text-sm font-light text-white/45">{t.blurb}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
