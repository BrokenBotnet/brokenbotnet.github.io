import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const failures = [];

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

const attributeValue = (attributes, name) => {
  const match = attributes.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return match ? match[1] ?? match[2] ?? match[3] : undefined;
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
  const usesSiteScript = /\/js\/site\.min\.[a-f0-9]+\.js/.test(html);

  if (usesSiteScript && !/<meta\s+http-equiv=["']?Content-Security-Policy["']?\s/i.test(html)) {
    report(file, "missing Content Security Policy");
  }

  for (const match of html.matchAll(/<[^!][^>]*>/g)) {
    const tag = match[0];
    if (/\son[a-z][\w:-]*\s*=/i.test(tag)) report(file, `inline event handler in ${tag.slice(0, 120)}`);
    if (/\b(?:href|src|action|formaction|xlink:href)\s*=\s*["']?\s*javascript:/i.test(tag)) {
      report(file, `javascript URL in ${tag.slice(0, 120)}`);
    }
    if (/\ssrcdoc\s*=/i.test(tag)) report(file, `srcdoc attribute in ${tag.slice(0, 120)}`);
  }

  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attributes = match[1];
    const body = match[2].trim();
    const type = attributeValue(attributes, "type")?.toLowerCase();
    const src = attributeValue(attributes, "src");
    const integrity = attributeValue(attributes, "integrity");

    if (type === "application/ld+json") {
      try {
        JSON.parse(body);
      } catch {
        report(file, "invalid JSON-LD script block");
      }
      continue;
    }

    if (src && /^\/js\/site\.min\.[a-f0-9]+\.js$/.test(src) && integrity?.startsWith("sha384-")) {
      continue;
    }

    report(file, `unapproved script block${src ? ` (${src})` : ""}`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Client-side injection audit passed.");
