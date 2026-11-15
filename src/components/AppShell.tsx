"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AtmosphereRotator } from "@/components/AtmosphereRotator";
import { PortalLogo } from "@/components/PortalLogo";
import { ThemeToggle } from "@/components/ThemeProvider";
import { BRAND } from "@/brand";

export function AppShell({
  workspaceName,
  userName,
  canWorkspace = false,
  children,
}: {
  workspaceName: string;
  userName: string;
  canWorkspace?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isChat = pathname === "/app";
  const isWorkspace = pathname.startsWith("/app/workspace");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const links = [
    { href: "/app", label: "Chat" },
    { href: "/app/meetups", label: "Meetups" },
    { href: "/app/files", label: "My files" },
    ...(canWorkspace
      ? [{ href: "/app/workspace", label: "Workspace" }]
      : []),
  ];

  return (
    <div
      className={`app-shell min-h-screen ${
        isWorkspace ? "app-shell--workspace" : "portal-grid"
      } ${isChat ? "app-shell--chat" : ""}`}
    >
      <AtmosphereRotator />
      <header
        className={`border-b border-[var(--line)] ${
          isChat ? "app-shell__header--chat" : ""
        } ${isWorkspace ? "app-shell__header--workspace" : ""}`}
      >
        <div
          className={`mx-auto flex w-full items-center justify-between gap-4 px-4 sm:px-6 ${
            isChat || isWorkspace
              ? "max-w-none py-3"
              : "max-w-6xl py-4"
          }`}
        >
          <div className="flex min-w-0 items-center gap-4 sm:gap-6">
            <Link href="/app" className="flex shrink-0 items-center gap-2">
              <PortalLogo size={isChat || isWorkspace ? 24 : 28} animated />
              <span className="tracking-[0.28em] text-sm font-medium">
                {BRAND.nameUpper}
              </span>
            </Link>
            <nav className="app-nav" aria-label="App">
              {links.map((link) => {
                const active =
                  link.href === "/app"
                    ? pathname === "/app"
                    : link.href === "/app/workspace"
                      ? pathname.startsWith("/app/workspace")
                      : pathname === link.href ||
                        pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`app-nav__link ${active ? "is-active" : ""}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-sm text-[var(--muted)]">
            <ThemeToggle compact />
            <span className="hidden md:inline">{workspaceName}</span>
            <span className="hidden md:inline">·</span>
            <span className="hidden md:inline">{userName}</span>
            <button
              onClick={logout}
              className="btn btn-ghost !px-3 !py-1.5 text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main
        className={
          isChat
            ? "app-shell__main--chat"
            : isWorkspace
              ? "app-shell__main--workspace"
              : "mx-auto w-full max-w-6xl px-6 py-8"
        }
      >
        {children}
      </main>
    </div>
  );
}
