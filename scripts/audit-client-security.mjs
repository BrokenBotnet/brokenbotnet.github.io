import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { attributeValue, normalizeAttributeUrl, tokenizeHtml } from "./html-tokenizer.mjs";

const root = process.cwd();
const failures = [];
const approvedScriptNames = new Set(["site", "archive", "content", "donate", "node-loader"]);
const approvedScriptPattern = /^\/js\/([a-z-]+)\.min\.[a-f0-9]+\.js$/;

const isApprovedScript = (src, integrity) => {
  const match = approvedScriptPattern.exec(src ?? "");
  return Boolean(match && approvedScriptNames.has(match[1]) && integrity?.startsWith("sha384-"));
};

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else files.push(target);
  }

  return files;
};

const report = (file, message) => {
  failures.push(`${path.relative(root, file)}: ${message}`);
};

const javascriptRules = [
  [/(?:^|[^\w.])(?:innerHTML|outerHTML)\s*=/m, "HTML-string assignment"],
  [/\.insertAdjacentHTML\s*\(/m, "insertAdjacentHTML call"],
  [/document\.write(?:ln)?\s*\(/m, "document.write call"],
  [/(?:^|[^\w.])eval\s*\(/m, "eval call"],
  [/new\s+Function\s*\(/m, "Function constructor"],
];

for (const file of (await walk(path.join(root, "static", "js"))).filter((file) => file.endsWith(".js"))) {
  const source = await readFile(file, "utf8");
  for (const [pattern, label] of javascriptRules) {
    if (pattern.test(source)) report(file, label);
  }
}

for (const file of (await walk(path.join(root, "public"))).filter((file) => file.endsWith(".html"))) {
  const html = await readFile(file, "utf8");
  const { errors, scripts, tags } = tokenizeHtml(html);
  const usesSiteScript = scripts.some((script) => {
    const src = attributeValue(script, "src") ?? "";
    return /^\/js\/site\.min\.[a-f0-9]+\.js$/.test(src);
  });

  if (usesSiteScript && !tags.some((tag) =>
    tag.name === "meta" &&
    attributeValue(tag, "http-equiv")?.toLowerCase() === "content-security-policy"
  )) {
    report(file, "missing Content Security Policy");
  }

  for (const error of errors) report(file, error);

  for (const tag of tags) {
    for (const attribute of tag.attributes) {
      const normalizedUrl = normalizeAttributeUrl(attribute.value);
      const hasUnsafeScheme =
        normalizedUrl.startsWith("javascript:") ||
        normalizedUrl.startsWith("data:") ||
        normalizedUrl.startsWith("vbscript:");

      if (attribute.name.startsWith("on") && attribute.name.length > 2) {
        report(file, `inline event handler in ${tag.raw.slice(0, 120)}`);
      }
      if (
        ["href", "src", "action", "formaction", "xlink:href"].includes(attribute.name) &&
        hasUnsafeScheme
      ) {
        report(file, `unsafe URL scheme in ${tag.raw.slice(0, 120)}`);
      }
      if (attribute.name === "srcdoc") report(file, `srcdoc attribute in ${tag.raw.slice(0, 120)}`);
    }
  }

  for (const script of scripts) {
    const body = script.body.trim();
    const type = attributeValue(script, "type")?.toLowerCase();
    const src = attributeValue(script, "src");
    const integrity = attributeValue(script, "integrity");

    if (type === "application/ld+json") {
      try {
        JSON.parse(body);
      } catch {
        report(file, "invalid JSON-LD script block");
      }
      continue;
    }

    if (isApprovedScript(src, integrity)) continue;

    report(file, `unapproved script block${src ? ` (${src})` : ""}`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Client-side injection audit passed.");
