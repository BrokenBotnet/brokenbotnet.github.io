import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(
  new URL("./fetch-project-stats.mjs", import.meta.url)
);
const stats = new URL("../data/project_stats.json", import.meta.url);

function run(...arguments_) {
  return spawnSync(process.execPath, [script, ...arguments_], {
    encoding: "utf8"
  });
}

test("the default build path validates but does not refresh tracked data", async () => {
  const before = await readFile(stats, "utf8");
  const result = run();
  const after = await readFile(stats, "utf8");

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Using committed project statistics/);
  assert.equal(after, before);
});

test("unknown arguments fail closed without changing tracked data", async () => {
  const before = await readFile(stats, "utf8");
  const result = run("--unknown");
  const after = await readFile(stats, "utf8");

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unknown argument/);
  assert.equal(after, before);
});

test("duplicate refresh arguments fail before any network request", async () => {
  const before = await readFile(stats, "utf8");
  const result = run("--refresh", "--refresh");
  const after = await readFile(stats, "utf8");

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /may be specified only once/);
  assert.equal(after, before);
});
