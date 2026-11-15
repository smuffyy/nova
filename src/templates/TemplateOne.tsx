import Link from "next/link";
import { DemoButton } from "@/components/DemoButton";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { PortalLogo } from "@/components/PortalLogo";
import { WaitlistForm } from "@/components/WaitlistForm";
import { BRAND } from "@/brand";

/** Classic Sentry marketing layout (mobile logo hero + desktop glow stack). */
export function TemplateOne() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black">
      <div className="portal-grid lg:hidden">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <Link href="/templates/one" className="flex items-center gap-3">
            <PortalLogo size={34} animated />
            <span className="text-sm font-medium tracking-[0.32em]">{BRAND.nameUpper}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/templates"
              className="text-xs tracking-[0.16em] text-[var(--muted)] hover:text-[var(--fg)]"
            >
              TEMPLATES
            </Link>
            <Link href="/login" className="btn btn-ghost !px-4 !py-2 text-sm">
              Sign in
            </Link>
          </div>
        </header>

        <section className="relative mx-auto flex min-h-[calc(100vh-5.5rem)] w-full max-w-6xl flex-col items-center justify-center px-6 pb-20 pt-4 text-center">
          <div className="pointer-events-none absolute inset-x-0 top-8 -z-0 flex justify-center">
            <div className="animate-pulse-ring h-[min(72vw,520px)] w-[min(72vw,520px)] rounded-full border border-[var(--line)] opacity-40" />
          </div>

          <div className="animate-drift relative z-10 mb-8 drop-shadow-[0_30px_80px_rgba(125,155,106,0.22)]">
            <PortalLogo size={240} animated />
          </div>

          <h1 className="animate-rise relative z-10 text-5xl font-medium tracking-[0.28em]">
            {BRAND.nameUpper}
          </h1>
          <p className="animate-rise-delay relative z-10 mt-5 max-w-xl text-lg font-light tracking-wide text-[var(--muted)]">
            The company watcher — already knows how you operate.
          </p>
          <div className="animate-rise-delay-2 relative z-10 mt-10 flex flex-col items-center gap-3">
            <DemoButton label="Start with your books & docs" />
            <a href="#waitlist" className="btn btn-ghost">
              Book a pilot
            </a>
          </div>
        </section>
      </div>

      <section className="relative hidden min-h-screen flex-col lg:flex">
        <HeroBackdrop />

        <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-8 py-8">
          <Link href="/templates/one" className="flex items-center gap-3">
            <PortalLogo size={32} animated />
            <span className="text-xs font-medium tracking-[0.36em]">{BRAND.nameUpper}</span>
          </Link>
          <nav className="absolute left-1/2 flex -translate-x-1/2 items-center gap-8 text-[11px] font-medium tracking-[0.22em] text-white/75">
            <a href="#how" className="hover:text-white">
              HOW IT WORKS
            </a>
            <a href="#use-cases" className="hover:text-white">
              USE CASES
            </a>
            <a href="#waitlist" className="hover:text-white">
              PILOT
            </a>
          </nav>
          <DemoButton
            className="btn btn-ghost !gap-2 !px-5 !py-2.5 text-[11px] font-medium tracking-[0.18em]"
            label="TRY DEMO →"
          />
        </header>

        <div className="relative z-20 flex flex-1 flex-col items-center justify-center px-8 text-center">
          <h1 className="hero-stack animate-rise">
            <span className="hero-stack-primary">ASK YOUR COMPANY.</span>
            <span className="hero-stack-secondary">ALREADY KNOWS</span>
          </h1>
        </div>

        <div className="relative z-20 mx-auto flex w-full max-w-xl flex-col items-center px-8 pb-16 text-center">
          <p className="animate-rise-delay text-[13px] font-light leading-relaxed tracking-wide text-white/40">
            From boardroom policies to vendor terms and SOPs — private answers
            grounded in your own data, with sources you can trust. The employee
            who already knows your company.
          </p>
        </div>
      </section>

      <div className="portal-grid">
        <section id="how" className="mx-auto w-full max-w-6xl px-6 py-24 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-[var(--accent)]">
            How it works
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-medium tracking-wide sm:text-4xl">
            Upload your memory. Ask with sources.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Ingest",
                body: "Drop PDFs, DOCX, TXT, and CSV exports — policies, SOPs, invoices, vendor lists.",
              },
              {
                step: "02",
                title: "Index",
                body: "SENTRY chunks and indexes everything inside your private workspace.",
              },
              {
                step: "03",
                title: "Ask",
                body: "Get grounded answers with citations. If it isn’t in your sources, SENTRY says so.",
              },
            ].map((item) => (
              <div key={item.step} className="panel p-6">
                <div className="text-sm tracking-[0.24em] text-[var(--mineral)]">
                  {item.step}
                </div>
                <h3 className="mt-4 text-2xl font-medium tracking-wide">{item.title}</h3>
                <p className="mt-3 font-light text-[var(--muted)]">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="use-cases" className="mx-auto w-full max-w-6xl px-6 py-24 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-[var(--accent)]">
            Use cases
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-medium tracking-wide sm:text-4xl">
            Bookkeeper-grade memory. Company-wide reach.
          </h2>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2">
            {[
              "What are our payment terms with Acme?",
              "Did we invoice Contoso last month?",
              "What’s the refund policy we tell customers?",
              "Who owns onboarding — what’s the checklist?",
              "Summarize Q2 expenses by vendor.",
              "Where is that decision written down?",
            ].map((q) => (
              <li
                key={q}
                className="panel flex items-start gap-3 px-5 py-4 font-light text-[var(--fg)]"
              >
                <span className="mt-1 text-[var(--accent)]">○</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 py-24 lg:px-8">
          <div className="panel overflow-hidden p-8 sm:p-12">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-[var(--accent)]">
              Trust
            </p>
            <h2 className="mt-3 max-w-xl text-3xl font-medium tracking-wide sm:text-4xl">
              Private by default. Citations always on.
            </h2>
            <div className="mt-8 grid gap-6 font-light text-[var(--muted)] md:grid-cols-3">
              <p>Each company lives in its own workspace. Queries never cross the wall.</p>
              <p>Answers show the source file and snippet — or SENTRY admits it doesn’t know.</p>
              <p>Your books and SOPs stay yours. Connectors come later; CSV/PDF works today.</p>
            </div>
          </div>
        </section>

        <section id="waitlist" className="mx-auto w-full max-w-6xl px-6 py-24 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-[var(--accent)]">
            Pilot
          </p>
          <h2 className="mt-3 max-w-xl text-3xl font-medium tracking-wide sm:text-4xl">
            Join the waitlist or try the demo.
          </h2>
          <p className="mt-4 max-w-xl font-light text-[var(--muted)]">
            We’re onboarding a small set of SMB design partners. Bring your books
            export and a few SOPs — get useful answers in the first session.
          </p>
          <div className="mt-8 max-w-3xl">
            <WaitlistForm />
          </div>
          <div className="mt-6">
            <DemoButton className="btn btn-ghost" label="Open demo workspace" />
          </div>
        </section>

        <footer className="mx-auto flex w-full max-w-6xl items-center justify-between border-t border-[var(--line)] px-6 py-10 text-sm text-[var(--muted)] lg:px-8">
          <div className="flex items-center gap-2">
            <PortalLogo size={22} animated={false} />
            <span className="tracking-[0.24em]">{BRAND.nameUpper}</span>
          </div>
          <Link href="/" className="hover:text-[var(--fg)]">
            View live site →
          </Link>
        </footer>
      </div>
    </main>
  );
}
