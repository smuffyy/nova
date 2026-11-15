const electron = require("electron");
const path = require("path");

const { app, BrowserWindow, shell, Menu } = electron;

if (!app) {
  console.error(
    "NOVA desktop must be launched with Electron (npm run nova:desktop), not plain Node."
  );
  process.exit(1);
}

// Linux / container-friendly Chromium flags (this machine's desktop)
if (process.platform === "linux") {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch("no-sandbox");
  app.commandLine.appendSwitch("disable-gpu");
  app.commandLine.appendSwitch("disable-dev-shm-usage");
}

const APP_URL =
  process.env.NOVA_DESKTOP_URL || "http://127.0.0.1:3000/nova";

/** @type {import('electron').BrowserWindow | null} */
let mainWindow = null;

function createWindow() {
  const isDarwin = process.platform === "darwin";

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: "NOVA",
    backgroundColor: "#f5f5f7",
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: isDarwin ? "hiddenInset" : "default",
    trafficLightPosition: isDarwin ? { x: 16, y: 18 } : undefined,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      // sandbox breaks window mapping on some Linux desktops
      sandbox: isDarwin,
    },
  });

  const reveal = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.show();
    mainWindow.focus();
    if (!isDarwin) {
      try {
        mainWindow.maximize();
      } catch {
        /* ignore */
      }
    }
  };

  mainWindow.once("ready-to-show", reveal);

  // Fallback if ready-to-show never fires
  setTimeout(reveal, 2500);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("did-fail-load", (_e, code, desc, url) => {
    console.error("NOVA failed to load:", code, desc, url);
  });

  mainWindow.loadURL(APP_URL).catch((err) => {
    console.error("Failed to load NOVA UI:", err);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function buildMenu() {
  const template = [
    ...(process.platform === "darwin"
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "close" }],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  app.setName("NOVA");
  buildMenu();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else if (mainWindow && !mainWindow.isDestroyed()) mainWindow.show();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
