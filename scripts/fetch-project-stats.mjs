import { readFile, writeFile } from "node:fs/promises";

const statsPath = new URL("../data/project_stats.json", import.meta.url);
const number = new Intl.NumberFormat("en-US");
const arguments_ = process.argv.slice(2);

for (const argument of arguments_) {
  if (argument !== "--refresh") {
    throw new Error(`Unknown argument: ${argument}`);
  }
}

if (arguments_.length > 1) {
  throw new Error("--refresh may be specified only once");
}

const refresh = arguments_[0] === "--refresh";

function requireNonNegativeInteger(value, name) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
}

function validateStats(stats) {
  if (
    typeof stats.verified_at !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(
      stats.verified_at
    ) ||
    !Number.isFinite(Date.parse(stats.verified_at))
  ) {
    throw new Error("verified_at must be an ISO-8601 timestamp");
  }

  if (
    typeof stats.tor_guard_relay?.release !== "string" ||
    !/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(
      stats.tor_guard_relay.release
    )
  ) {
    throw new Error("tor_guard_relay.release must be a semantic version tag");
  }

  requireNonNegativeInteger(
    stats.tor_guard_relay.docker_pulls,
    "tor_guard_relay.docker_pulls"
  );

  if (
    stats.tor_guard_relay.docker_pulls_formatted !==
    number.format(stats.tor_guard_relay.docker_pulls)
  ) {
    throw new Error("docker_pulls_formatted does not match docker_pulls");
  }

  for (const key of [
    "nodes",
    "public_relays",
    "bridges",
    "exits",
    "countries",
    "autonomous_systems",
    "platforms",
    "ipv6_enabled"
  ]) {
    requireNonNegativeInteger(
      stats.shinobi_relays?.[key],
      `shinobi_relays.${key}`
    );
  }

  if (
    stats.shinobi_relays.public_relays + stats.shinobi_relays.bridges !==
    stats.shinobi_relays.nodes
  ) {
    throw new Error(
      "shinobi_relays public and bridge counts do not equal nodes"
    );
  }
}

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
  const match = html.match(
    new RegExp(
      `id=["']${escapedID}["'][^>]*data-count=["']([^"']+)["']`,
      "i"
    )
  );

  if (!match) throw new Error(`Missing ${id} data-count in Shinobi Relays`);
  return Number.parseInt(match[1], 10);
}

function extractPillCount(html, id) {
  const escapedID = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(
    new RegExp(
      `id=["']${escapedID}["'][^>]*>[\\s\\S]*?(\\d+)\\s+[A-Za-z]+`,
      "i"
    )
  );

  if (!match) throw new Error(`Missing ${id} count in Shinobi Relays`);
  return Number.parseInt(match[1], 10);
}

async function main() {
  const current = JSON.parse(await readFile(statsPath, "utf8"));
  validateStats(current);

  if (!refresh) {
    console.log(
      `Using committed project statistics verified at ${current.verified_at}.`
    );
    return;
  }

  const next = structuredClone(current);
  const githubToken = process.env.GITHUB_TOKEN;
  const requestHeaders = {
    Accept: "application/vnd.github+json",
    "User-Agent": "brokenbotnet-project-stats"
  };

  if (githubToken) requestHeaders.Authorization = `Bearer ${githubToken}`;

  const sources = await Promise.allSettled([
    fetchText(
      "https://api.github.com/repos/r3bo0tbx1/tor-guard-relay/releases/latest",
      requestHeaders
    ).then(body => {
      const release = JSON.parse(body);

      if (!release.tag_name) {
        throw new Error("Latest GitHub release has no tag name");
      }

      next.tor_guard_relay.release = release.tag_name;
      return `release ${release.tag_name}`;
    }),
    fetchText(
      "https://hub.docker.com/v2/repositories/r3bo0tbx1/onion-relay/",
      {
        Accept: "application/json",
        "User-Agent": requestHeaders["User-Agent"]
      }
    ).then(body => {
      const repository = JSON.parse(body);

      if (!Number.isInteger(repository.pull_count)) {
        throw new Error("Docker Hub pull count is unavailable");
      }

      if (repository.pull_count < current.tor_guard_relay.docker_pulls) {
        throw new Error("Docker Hub pull count unexpectedly decreased");
      }

      next.tor_guard_relay.docker_pulls = repository.pull_count;
      next.tor_guard_relay.docker_pulls_formatted = number.format(
        repository.pull_count
      );

      return `${number.format(repository.pull_count)} Docker pulls`;
    }),
    fetchText(
      "https://raw.githubusercontent.com/r3bo0tbx1/shinobi-relays/main/index.html",
      {
        Accept: "text/html",
        "User-Agent": requestHeaders["User-Agent"]
      }
    ).then(html => {
      const nodes = extractCount(html, "totalRelayStat");
      const bridges = extractPillCount(html, "bridgeCount");
      const exits = extractPillCount(html, "exitCount");

      next.shinobi_relays = {
        nodes,
        public_relays: nodes - bridges,
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

  const failures = [];

  for (const source of sources) {
    if (source.status === "fulfilled") {
      console.log(`Updated ${source.value}.`);
    } else {
      failures.push(source.reason);
      console.error(`Refresh failed: ${source.reason.message}`);
    }
  }

  if (failures.length) {
    throw new AggregateError(
      failures,
      "Project statistics refresh was incomplete; committed data is unchanged"
    );
  }

  next.verified_at = new Date().toISOString();
  validateStats(next);
  await writeFile(statsPath, `${JSON.stringify(next, null, 2)}\n`);
}

await main();
