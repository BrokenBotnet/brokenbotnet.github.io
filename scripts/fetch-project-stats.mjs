import { readFile, writeFile } from "node:fs/promises";

const statsPath = new URL("../data/project_stats.json", import.meta.url);
const current = JSON.parse(await readFile(statsPath, "utf8"));
const next = structuredClone(current);
const number = new Intl.NumberFormat("en-US");
const githubToken = process.env.GITHUB_TOKEN;

const requestHeaders = {
  Accept: "application/vnd.github+json",
  "User-Agent": "brokenbotnet-hugo-build"
};

if (githubToken) requestHeaders.Authorization = `Bearer ${githubToken}`;

async function fetchText(url, headers = {}, attempts = 3) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    try {
      const response = await fetch(url, {
        headers,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise(resolve => setTimeout(resolve, attempt * 750));
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}

function extractCount(html, id) {
  const escapedID = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`id=["']${escapedID}["'][^>]*data-count=["']([^"']+)["']`, "i"));
  if (!match) throw new Error(`Missing ${id} data-count in Shinobi Relays`);
  return Number.parseInt(match[1], 10);
}

function extractPillCount(html, id) {
  const escapedID = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`id=["']${escapedID}["'][^>]*>[\\s\\S]*?(\\d+)\\s+[A-Za-z]+`, "i"));
  if (!match) throw new Error(`Missing ${id} count in Shinobi Relays`);
  return Number.parseInt(match[1], 10);
}

const sources = await Promise.allSettled([
  fetchText(
    "https://api.github.com/repos/r3bo0tbx1/tor-guard-relay/releases/latest",
    requestHeaders
  ).then(body => {
    const release = JSON.parse(body);
    if (!release.tag_name) throw new Error("Latest GitHub release has no tag name");
    next.tor_guard_relay.release = release.tag_name;
    return `release ${release.tag_name}`;
  }),
  fetchText("https://hub.docker.com/v2/repositories/r3bo0tbx1/onion-relay/", {
    Accept: "application/json",
    "User-Agent": requestHeaders["User-Agent"]
  }).then(body => {
    const repository = JSON.parse(body);
    if (!Number.isInteger(repository.pull_count)) throw new Error("Docker Hub pull count is unavailable");
    next.tor_guard_relay.docker_pulls = repository.pull_count;
    next.tor_guard_relay.docker_pulls_formatted = number.format(repository.pull_count);
    return `${number.format(repository.pull_count)} Docker pulls`;
  }),
  fetchText("https://raw.githubusercontent.com/r3bo0tbx1/shinobi-relays/main/index.html", {
    Accept: "text/html",
    "User-Agent": requestHeaders["User-Agent"]
  }).then(html => {
    const nodes = extractCount(html, "totalRelayStat");
    const bridges = extractPillCount(html, "bridgeCount");
    const exits = extractPillCount(html, "exitCount");
    const publicRelays = nodes - bridges;

    next.shinobi_relays = {
      nodes,
      public_relays: publicRelays,
      bridges,
      exits,
      countries: extractCount(html, "countryStat"),
      autonomous_systems: extractCount(html, "asnStat"),
      platforms: extractCount(html, "platformStat"),
      ipv6_enabled: extractCount(html, "ipv6Stat")
    };

    return `${nodes} relay entries across ${next.shinobi_relays.countries} countries`;
  })
]);

for (const source of sources) {
  if (source.status === "fulfilled") console.log(`Updated ${source.value}.`);
  else console.warn(`Using the committed fallback: ${source.reason.message}`);
}

if (sources.every(source => source.status === "fulfilled")) {
  next.verified_at = new Date().toISOString();
}

await writeFile(statsPath, `${JSON.stringify(next, null, 2)}\n`);
