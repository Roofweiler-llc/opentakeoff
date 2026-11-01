// Helm OS simple mode (Roofweiler, 2026-11-01). Inside Helm OS (?embed=helm&simple=1) the canvas's own chrome is hidden
// and the parent page's toolbar drives it with these commands. This file is the whole vocabulary: a message that isn't
// one of them, or whose value isn't what that command takes, is ignored. Pure — embedStore.js listens (same-origin
// parent only), TakeoffCanvas.jsx acts.
export const HELM_TOOLS = ["select", "area", "line", "count", "calibrate"];
const NONE = (v) => v === undefined || v === null;
const ID = (v) => typeof v === "string" && v.length > 0 && v.length <= 300;
const SPEC = {
  tool: (v) => HELM_TOOLS.includes(v),          // "line" is the canvas's Linear tool
  condition: ID,                                // a condition id the canvas has
  zoom: (v) => v === "in" || v === "out" || v === "fit",
  undo: NONE,
  redo: NONE,
  finish: NONE,                                 // close the shape being traced (same as Enter / double-click)
  sheets: NONE,                                 // the plan-set gallery
  scale: (v) => typeof v === "string" && v.length > 0 && v.length <= 40,   // "detected" or a standard scale's label
  accept: ID,                                   // an unreviewed shape → reviewed (the Accept pill's review command)
  reject: ID,                                   // an agent's shape → deleted
  show: ID,                                     // open its sheet, select it, frame it
};

/** { cmd, value } for a valid command message from the parent, else null. */
export function cleanHelmCommand(data) {
  if (!data || typeof data !== "object" || data.type !== "helm:cmd" || typeof data.cmd !== "string") return null;
  const check = Object.prototype.hasOwnProperty.call(SPEC, data.cmd) ? SPEC[data.cmd] : null;
  if (!check || !check(data.value)) return null;
  return { cmd: data.cmd, value: NONE(data.value) ? null : data.value };
}
