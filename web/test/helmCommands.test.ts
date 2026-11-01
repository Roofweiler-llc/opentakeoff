// Helm OS simple mode: the parent page drives the embedded canvas with a closed vocabulary of commands. Anything else
// — another type, an unknown command, a value the command doesn't take, a prototype key — is ignored.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanHelmCommand, HELM_TOOLS } from "../src/lib/helmCommands.js";

const cmd = (c: string, value?: unknown) => cleanHelmCommand({ type: "helm:cmd", cmd: c, value });

test("each command takes only its own values", () => {
  for (const t of HELM_TOOLS) assert.deepEqual(cmd("tool", t), { cmd: "tool", value: t });
  assert.equal(cmd("tool", "symbol"), null, "a pro tool is not on the list");
  assert.equal(cmd("tool", "linear"), null, "the parent says line");
  for (const z of ["in", "out", "fit"]) assert.deepEqual(cmd("zoom", z), { cmd: "zoom", value: z });
  assert.equal(cmd("zoom", 2), null);
  assert.deepEqual(cmd("undo"), { cmd: "undo", value: null });
  assert.deepEqual(cmd("redo", null), { cmd: "redo", value: null });
  assert.equal(cmd("undo", "x"), null, "a value where none goes");
  assert.deepEqual(cmd("condition", "helm-eave_lf"), { cmd: "condition", value: "helm-eave_lf" });
  assert.equal(cmd("condition", ""), null);
  assert.equal(cmd("condition", "x".repeat(301)), null);
  assert.deepEqual(cmd("scale", "detected"), { cmd: "scale", value: "detected" });
  assert.deepEqual(cmd("scale", '1/8" = 1\'-0"'), { cmd: "scale", value: '1/8" = 1\'-0"' });
  for (const c of ["accept", "reject", "show"]) {
    assert.deepEqual(cmd(c, "beck:x:A.pdf:1:2"), { cmd: c, value: "beck:x:A.pdf:1:2" });
    assert.equal(cmd(c, 7), null);
  }
});

test("anything that isn't a command is ignored", () => {
  assert.equal(cleanHelmCommand(null), null);
  assert.equal(cleanHelmCommand("helm:cmd"), null);
  assert.equal(cleanHelmCommand({ type: "helm:reply", cmd: "undo" }), null);
  assert.equal(cleanHelmCommand({ type: "helm:cmd", cmd: "eval", value: "x" }), null);
  assert.equal(cleanHelmCommand({ type: "helm:cmd", cmd: "constructor" }), null);
  assert.equal(cleanHelmCommand({ type: "helm:cmd", cmd: "__proto__" }), null);
  assert.equal(cleanHelmCommand({ type: "helm:cmd" }), null);
});
