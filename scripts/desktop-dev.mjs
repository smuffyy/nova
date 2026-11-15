/**
 * NOVA desktop launcher.
 * Starts Next.js if needed, waits for /nova, opens Electron.
 * On Linux, falls back to Chrome --app= if Electron exits immediately.
 *
 *   npm run nova:desktop
 */
import { spawn } from "child_process";
import { createConnection } from "net";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const PREFERRED = Number(process.env.PORT || 3000);

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: "127.0.0.1" }, () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
  });
}

async function novaOk(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/nova`, {
      redirect: "manual",
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function findWorkingPort() {
  for (const port of [PREFERRED, 3001, 3002, 3003]) {
    if ((await portOpen(port)) && (await novaOk(port))) return port;
  }
  return null;
}

async function findFreePort() {
  for (const port of [PREFERRED, 3001, 3002, 3003, 3004]) {
    if (!(await portOpen(port))) return port;
  }
  return 3010;
}

function run(cmd, args, opts = {}) {
  return spawn(cmd, args, {
    cwd: root,
    stdio: opts.stdio ?? "inherit",
    env: { ...process.env, ...opts.env },
    shell: process.platform === "win32",
    detached: Boolean(opts.detached),
  });
}

async function waitForNova(port, ms = 120000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (await novaOk(port)) return;
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Timed out waiting for http://127.0.0.1:${port}/nova`);
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ].filter(Boolean);
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch {
      /* ignore */
    }
  }
  return null;
}

function launchChromeApp(url) {
  const chrome = findChrome();
  if (!chrome) {
    console.error("No Chrome/Chromium found for desktop fallback.");
    return null;
  }
  const profile = path.join("/tmp", "nova-chrome-app");
  fs.mkdirSync(profile, { recursive: true });
  console.log(`Opening NOVA desktop (Chrome app) → ${url}`);
  return run(
    chrome,
    [
      `--user-data-dir=${profile}`,
      `--app=${url}`,
      "--new-window",
      "--window-size=1280,840",
      "--window-position=40,40",
      "--no-first-run",
      "--disable-features=TranslateUI",
    ],
    {
      env: {
        DISPLAY: process.env.DISPLAY || ":1",
      },
    }
  );
}

async function launchElectron(url) {
  const electronBin = path.join(root, "node_modules", ".bin", "electron");
  if (!fs.existsSync(electronBin)) {
    console.warn("Electron binary missing — using Chrome app shell.");
    return { proc: null, ok: false };
  }

  console.log(`Opening NOVA desktop (Electron) → ${url}`);
  const electronArgs =
    process.platform === "linux" ? [".", "--no-sandbox"] : ["."];

  const proc = run(electronBin, electronArgs, {
    env: {
      NOVA_DESKTOP_URL: url,
      ELECTRON_DISABLE_SANDBOX: process.platform === "linux" ? "1" : "",
      ELECTRON_OZONE_PLATFORM_HINT: "x11",
      DISPLAY: process.env.DISPLAY || ":1",
    },
  });

  // Give Electron a moment; if it dies immediately, treat as failure.
  const ok = await new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(true);
      }
    }, 3500);
    proc.once("exit", (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        console.warn(`Electron exited early (code ${code}).`);
        resolve(false);
      }
    });
    proc.once("error", (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        console.warn("Electron failed to start:", err.message);
        resolve(false);
      }
    });
  });

  return { proc, ok };
}

async function main() {
  let nextProc = null;
  let port = await findWorkingPort();

  if (port) {
    console.log(`NOVA web ready on :${port}`);
  } else {
    const preferredBusy = await portOpen(PREFERRED);
    port = preferredBusy ? await findFreePort() : PREFERRED;
    console.log(`Starting Next.js for NOVA on :${port}…`);
    const nextBin = path.join(root, "node_modules", ".bin", "next");
    nextProc = run(nextBin, ["dev", "-p", String(port)]);
    await waitForNova(port);
  }

  const url = `http://127.0.0.1:${port}/nova`;
  const forceChrome = process.env.NOVA_DESKTOP_SHELL === "chrome";

  let desktop = null;

  if (!forceChrome) {
    const { proc, ok } = await launchElectron(url);
    if (ok && proc) {
      desktop = proc;
    } else if (proc && !proc.killed) {
      try {
        proc.kill("SIGTERM");
      } catch {
        /* ignore */
      }
    }
  }

  if (!desktop) {
    desktop = launchChromeApp(url);
    if (!desktop) process.exit(1);
  }

  desktop.on("exit", (code) => {
    if (nextProc) nextProc.kill("SIGTERM");
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
