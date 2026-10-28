// Helm OS embed (Roofweiler, 2026-10-28). When the canvas runs inside Helm OS at /takeoff-canvas/?embed=helm, the
// project lives in Helm OS, not in this browser: the sheet list and the saved takeoff come from the parent page,
// each PDF is fetched from a short-lived link the parent signs, and every autosave is posted back to the parent.
// Everything else (templates, material/stamp libraries, snapshots) stays in this browser's local store.
import { localStore } from "./store.js";

const PARENT = window.location.origin;   // same-origin embed only — a foreign parent is never answered
let seq = 0;
const waiting = new Map();

export const isHelmEmbed = () => {
  try { return new URLSearchParams(window.location.search).get("embed") === "helm" && window.parent !== window; }
  catch { return false; }
};

window.addEventListener("message", (e) => {
  if (e.origin !== PARENT || e.source !== window.parent) return;
  const m = e.data;
  if (m?.type !== "helm:reply" || !waiting.has(m.id)) return;
  const { resolve, reject, timer } = waiting.get(m.id);
  waiting.delete(m.id);
  clearTimeout(timer);
  if (m.error) reject(new Error(m.error)); else resolve(m.value);
});

function ask(type, payload = {}) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { if (waiting.delete(id)) reject(new Error("Helm OS didn't answer — close the takeoff and open it again.")); }, 30000);
    waiting.set(id, { resolve, reject, timer });
    window.parent.postMessage({ type, id, ...payload }, PARENT);
  });
}

/** { sheets: string[], doc: takeoff_canvas.v1 } from the parent. */
export const embedInit = () => ask("ot:hello");

export function createEmbedStore(init) {
  const s = Object.create(localStore);   // delegate everything not overridden, `this` intact
  const names = Array.isArray(init?.sheets) ? init.sheets.map(String) : [];
  s.listSheets = async () => names.map((name) => ({ name }));
  s.loadPdfData = async (name) => {
    const url = await ask("ot:pdf-url", { name });
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Couldn't load ${name} (${r.status}) — try again.`);
    return new Uint8Array(await r.arrayBuffer());
  };
  s.loadAnnotations = async () => (init?.doc && typeof init.doc === "object" ? init.doc : localStore.loadAnnotations());
  s.saveAnnotations = async (payload) => { window.parent.postMessage({ type: "ot:save", doc: payload }, PARENT); };
  s.addPdf = async () => { throw new Error("Add plans to the bid in Helm OS — they show up here."); };
  s.removePdf = async () => { throw new Error("Plans are managed on the bid in Helm OS."); };
  return s;
}
