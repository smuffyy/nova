/**
 * Production NOVA desktop:
 *   1) next build (if .next missing or NOVA_FORCE_BUILD=1)
 *   2) next start
 *   3) Electron → /nova
 *
 *   npm run nova:build
 */
import { spawn } from "child_process";
import { createConnection } from "net";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const PORT = Number(process.env.PORT || 3000);

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

function run(cmd, args, opts = {}) {
  return spawn(cmd, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...opts.env },
    shell: process.platform === "win32",
  });
}

function runSync(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = run(cmd, args);
    p.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`));
    });
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

async function main() {
  const nextBin = path.join(root, "node_modules", ".bin", "next");
  const needBuild =
    process.env.NOVA_FORCE_BUILD === "1" ||
    !fs.existsSync(path.join(root, ".next", "BUILD_ID"));

  if (needBuild) {
    console.log("Building NOVA (next build)…");
    await runSync(nextBin, ["build"]);
  } else {
    console.log("Using existing .next build (set NOVA_FORCE_BUILD=1 to rebuild)");
  }

  if (await portOpen(PORT)) {
    if (await novaOk(PORT)) {
      console.log(`NOVA already serving on :${PORT}`);
    } else {
      throw new Error(`Port ${PORT} is busy but /nova is not ready`);
    }
  } else {
    console.log(`Starting Next.js production server on :${PORT}…`);
    const server = run(nextBin, ["start", "-p", String(PORT)]);
    await waitForNova(PORT);
    const url = `http://127.0.0.1:${PORT}/nova`;
    console.log(`Opening NOVA desktop → ${url}`);
    const electronBin = path.join(root, "node_modules", ".bin", "electron");
    const electronArgs =
      process.platform === "linux" ? [".", "--no-sandbox"] : ["."];
    const electron = run(electronBin, electronArgs, {
      env: {
        NOVA_DESKTOP_URL: url,
        ELECTRON_DISABLE_SANDBOX: process.platform === "linux" ? "1" : "",
        ELECTRON_OZONE_PLATFORM_HINT: "x11",
        DISPLAY: process.env.DISPLAY || ":1",
      },
    });
    electron.on("exit", (code) => {
      server.kill("SIGTERM");
      process.exit(code ?? 0);
    });
    return;
  }

  const url = `http://127.0.0.1:${PORT}/nova`;
  console.log(`Opening NOVA desktop → ${url}`);
  const electronBin = path.join(root, "node_modules", ".bin", "electron");
  const electronArgs =
    process.platform === "linux" ? [".", "--no-sandbox"] : ["."];
  const electron = run(electronBin, electronArgs, {
    env: {
      NOVA_DESKTOP_URL: url,
      ELECTRON_DISABLE_SANDBOX: process.platform === "linux" ? "1" : "",
      ELECTRON_OZONE_PLATFORM_HINT: "x11",
      DISPLAY: process.env.DISPLAY || ":1",
    },
  });
  electron.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
