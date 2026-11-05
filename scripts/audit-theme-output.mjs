import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { attributeValue, tokenizeHtml } from "./html-tokenizer.mjs";

const root = path.resolve(process.argv[2] || "public");
const walk = async (directory) => (await Promise.all(await readdir(directory, { withFileTypes: true })
  .then((entries) => entries.map((entry) => entry.isDirectory()
    ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)])))).flat();
let pages = 0;
let scriptFreePages = 0;
for (const file of (await walk(root)).filter((file) => file.endsWith(".html"))) {
  const { tags, scripts } = tokenizeHtml(await readFile(file, "utf8"));
  const hasClass = (tag, name) => (attributeValue(tag, "class") || "").split(/\s+/).includes(name);
  if (!tags.some((tag) => !tag.closing && hasClass(tag, "theme-switcher"))) continue;
  pages++;
  const switchers = tags.filter((tag) => !tag.closing && hasClass(tag, "theme-switcher"));
  assert.equal(switchers.length, 1, `${file}: duplicate appearance controls`);
  const headerStart = tags.findIndex((tag) => !tag.closing && hasClass(tag, "page__header"));
  const headerEnd = tags.findIndex((tag, index) => index > headerStart && tag.closing && tag.name === "header");
  const switcherIndex = tags.indexOf(switchers[0]);
  assert(headerStart < switcherIndex && switcherIndex < headerEnd, `${file}: appearance control is not in the header`);
  assert(tags.some((tag) => tag.name === "img" && hasClass(tag, "theme-switcher__icon--raster") &&
    attributeValue(tag, "src") === "/icons/palette.png"), `${file}: missing local PNG image fallback`);
  const relative = path.relative(root, file).split(path.sep).join("/");
  const scriptFree = relative.startsWith("nojs/") || relative === "404.html";
  const backgroundInputs = tags.filter((tag) => tag.name === "input" && attributeValue(tag, "name") === "background-relays");
  if (scriptFree) {
    scriptFreePages++;
    assert.equal(scripts.length, 0, `${file}: script-free page contains scripts`);
    assert.equal(backgroundInputs.length, 0, `${file}: irrelevant background toggle`);
    assert(!tags.some((tag) => tag.name === "svg" && hasClass(tag, "theme-switcher__icon")), `${file}: selector depends on SVG`);
    assert(!tags.some((tag) => hasClass(tag, "relay-network-static")), `${file}: script-free relay backdrop`);
  } else {
    assert.equal(backgroundInputs.length, 1, `${file}: desktop background preference missing`);
  }
}
assert(pages > 0 && scriptFreePages > 0, "No themed or script-free pages were inspected");
const png = await readFile(path.join(root, "icons", "palette.png"));
assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", "Invalid Palette PNG");
assert.equal(png.readUInt32BE(16), 96, "Palette PNG width");
assert.equal(png.readUInt32BE(20), 96, "Palette PNG height");
assert.equal(png[25], 6, "Palette PNG must retain RGBA transparency");
console.log(`Theme output audit passed: ${pages} themed pages, ${scriptFreePages} script-free pages, local PNG image fallback.`);
