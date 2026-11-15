const { contextBridge } = require("electron");

/**
 * Safe bridge for the NOVA renderer (Next.js UI).
 */
const bridge = {
  isDesktop: true,
  platform: process.platform,
  product: "nova",
};

contextBridge.exposeInMainWorld("novaDesktop", bridge);
