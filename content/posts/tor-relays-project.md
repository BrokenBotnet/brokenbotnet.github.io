---
title: "Returning the Favor: Building the Tor Relay Stack I Always Wanted"
seo_title: "Why I Built Tor Guard Relay"
date: 2025-11-01
lastmod: 2026-07-17
slug: "tor-relays-project"
aliases:
  - "/2025/12/13/tor-relays-project/"
  - "/2026/05/13/tor-relays-project/"
description: "How Tor helped me through Internet restrictions when I was young, and why that experience eventually became tor-guard-relay and the Shinobi Relays network."
summary: "Tor once connected me when ordinary access could not. Years later, I built tor-guard-relay to return that favor with bridges, public relays, and transparent infrastructure."
image: "/images/posts/tor-relays-project/shinobi-relays-social.jpg"
image_alt: "Shinobi Relays network artwork with a Tor onion connecting bridge, relay, and exit nodes"
image_width: 1200
image_height: 628
thumbnail: "images/posts/tor-relays-project/tor-guard-relay-logo.png"
thumbnail_anchor: "Center"
tags: ["tor", "relay", "privacy", "open-source", "docker", "self-hosting"]
toc: true
pinned: true
---

I knew Tor as a user long before I understood it as infrastructure.

I still use Tor Browser every day. Running relays has not replaced my relationship with Tor as a user; it has made me more aware of the people and systems behind every circuit I open.

When I was younger, government restrictions made parts of the Internet unreachable through an ordinary connection. Tor gave me another path. It was not a theoretical privacy tool or a diagram in a security guide; it was something that helped me reach information I otherwise could not.

Growing up with those restrictions also shaped what privacy and security came to mean to me. Privacy was not about having something to hide; it was the freedom to read, learn, and explore without unnecessary scrutiny deciding what I should be allowed to see. Security was what made that freedom dependable. It gave me confidence that the tools protecting my connection would not quietly expose the person relying on them. They became personal values long before they became technical interests.

Sometimes Tor could not connect normally. When that happened, I learned to request bridges from the Tor Project and try again. A bridge could turn a blocked connection into a working one, quietly proving that someone, somewhere, had chosen to run infrastructure for a person they would probably never meet.

Once connected, I would sometimes open Tor Browser’s circuit display for the site I was visiting. I could follow the route from the first relay, through the middle of the circuit, to the exit that finally reached the destination. At first they were simply relay names, countries, and lines on a screen. Later I understood what those lines represented: bandwidth, servers, maintenance, cost, and risk contributed by volunteers.

That display showed a circuit reaching the public Internet. Onion-service circuits work differently: they remain inside the Tor network and do not use an Exit.

That stayed with me. My access depended on strangers deciding that an open Internet was worth supporting. Their work showed me that privacy and security are not sustained by principles alone; they require people willing to build, operate, maintain, and defend the infrastructure behind them.

I wanted to return that favor. I wanted to run bridges for people facing the same kind of blocking, guards and middle relays to strengthen the network behind every circuit, and exits willing to carry the responsibility of its final hop. Not for a badge or a large node count, but because each role had once made someone else’s access possible, including mine.

The ambition came before the container. The container was how I eventually made it practical.

In November 2025, I [announced](https://web.archive.org/web/20260717145712/https://infosec.exchange/@r3bo0tbx1/115473541878451693) the first version of tor-guard-relay. It focused on a few practical goals: one command, predictable configuration, useful diagnostics, and an image that could run on anything from a Raspberry Pi to an ordinary VPS.

By the time I [released v2.0.0](https://github.com/r3bo0tbx1/tor-guard-relay/releases/tag/v2.0.0) in June 2026, the project had grown into one container for guards, middle relays, exits, and obfs4 bridges; six operator tools; multi-architecture builds; automated release and security work; deployment templates; and a real network spread across multiple providers and countries.

This is the story of how a tool I relied on while growing up became infrastructure I could help provide for someone else.

## Privacy needs no excuse

I have never accepted “I have nothing to hide” as an answer to surveillance. It starts from the wrong premise: that privacy exists only to conceal guilt. Privacy Guides puts the distinction plainly: “You shouldn't confuse privacy with secrecy.”[^privacy-guides] We close a bathroom door even though everyone knows what the room is for. The door is not evidence of wrongdoing. It is a boundary, and being able to choose that boundary is part of being human.

Daniel Solove explains why the argument fails: it reduces privacy to whether surveillance uncovers a crime while ignoring aggregation, misuse, mistakes, intimidation, and the way observation changes lawful behavior.[^solove] The UN has similarly warned that even the possibility of communications being captured can chill expression and association.[^un-privacy] Bruce Schneier frames the political choice plainly as liberty versus control.[^schneier]

Anonymity is not inherently suspicious or outside the law. In *McIntyre v. Ohio Elections Commission*, the United States Supreme Court described anonymity as protection against majority retaliation.[^mcintyre] The Federalist Papers appeared under the name Publius, and Article 12 of the Universal Declaration of Human Rights protects people against arbitrary interference with privacy.[^federalist-papers][^udhr]

Tor belongs in that tradition of giving ordinary people room to act, read, and communicate without unnecessary exposure. Tor co-founder Roger Dingledine described its purpose as protecting ordinary people who want to follow the law.[^tor-purpose] Edward Snowden later made the same argument through another right: dismissing privacy because you have nothing to hide is like dismissing freedom of speech because you have nothing to say.[^snowden]

None of this is abstract to me. I operate bridges and public relays across {{< project-stat key="countries" >}} countries. Someone may reach that infrastructure from a place where speaking openly, reading freely, or connecting without a permanent trail can carry consequences. I also publish under a handle rather than my legal name. That is not deception; it is a boundary between the work I make public and the life I keep private. The comparison to Publius is not a claim of equal importance. It is a recognition that ideas and public work can stand on their own without turning the person behind them into public property.

Privacy and anonymity are not emergency tools to reach for only after trouble arrives. They are part of the groundwork that lets people think, speak, learn, and organize before power decides those ordinary acts require permission. That is why operating Tor infrastructure feels less like running a collection of servers and more like maintaining a promise I once depended on myself.

## The project now

{{< tor-project-status variant="badges" >}}

Project statistics last verified {{< project-stat key="verified-date" >}}:

- the current stable release is {{< project-stat key="release" >}}
- one image supports guard, middle, exit, and obfs4 bridge modes
- stable and edge builds are published for AMD64 and ARM64
- six BusyBox-compatible tools ship inside the image
- Docker Hub records {{< project-stat key="docker-pulls" >}} pulls
- the public inventory covers {{< project-stat key="nodes" >}} relays and bridges across {{< project-stat key="countries" >}} countries

A pull is not a unique operator or an active relay. The number is still encouraging: the project is being used beyond the infrastructure that originally justified building it.

These figures combine project release data, my maintained fleet inventory, and public network observations. They do not all prove the same thing. Inventory records intended infrastructure; Onionoo and independent metrics show what the public Tor network can currently observe.

{{< post-figure src="images/posts/tor-relays-project/shinobi-relays-dashboard.png" alt="Shinobi Relays dashboard showing fleet health, relay roles, and platform, network, and geographic diversity" class="post-figure--wide" >}}
The Shinobi Relays overview on 13 July 2026. Public relay roles and consensus state follow Onionoo rather than being hard-coded into the dashboard.
{{< /post-figure >}}

## Making relay operations repeatable

Running one relay is manageable. Running several across different providers makes every inconsistency harder to ignore.

Every deployment needs an identity that survives upgrades, a deliberate role and exit policy, correct port and firewall rules, protected keys, bandwidth limits, monitoring, and enough context to diagnose a failed bootstrap. Bridges add a pluggable transport. Multiple public relays add family metadata. Different providers introduce different networking and storage behavior.

As I added machines, I kept repeating the same work. Small differences accumulated, documentation drifted, and a container log was often the only place to start troubleshooting. `tor-guard-relay` became a consistent baseline for deploying and maintaining the fleet.

It does not replace operator responsibility. The host kernel, firewall, persistent storage, backups, monitoring, provider policy, abuse handling, and legal context still belong to the person running it, especially for exits.

## One image, four modes

The role is selected with `TOR_RELAY_MODE`:

- `guard` or `middle` for non-exit public relays
- `exit` for an explicitly configured exit
- `bridge` for an obfs4 bridge using Lyrebird

Operators can generate a configuration from environment variables or mount a complete `torrc`. The first path removes repetitive setup; the second preserves full control when the built-in options are not enough.

A minimal guard deployment looks like this:

```bash
docker run -d \
  --name tor-relay \
  --network host \
  --restart unless-stopped \
  -e TOR_RELAY_MODE=guard \
  -e TOR_NICKNAME=MyRelay \
  -e TOR_CONTACT_INFO="email:operator@example.com" \
  -v tor-data:/var/lib/tor \
  r3bo0tbx1/onion-relay:latest
```

That is an introduction, not a complete production checklist. The [deployment documentation](https://github.com/r3bo0tbx1/tor-guard-relay/blob/main/docs/DEPLOYMENT.md) covers Compose, Cosmos Cloud, Portainer, persistent configuration, monitoring, and multi-relay layouts.

The runtime image is Alpine-based and is roughly 20 MB compressed, depending on the architecture and release. Lyrebird is compiled in a separate Go builder stage, leaving the compiler and build dependencies out of the final image. Tor then runs as the unprivileged `tor` user under `tini`, with restrictive permissions on its data and key directories.

## What happens before Tor starts

The entrypoint follows six visible phases:

1. Create and inspect the runtime directories.
2. Harden permissions and detect existing Happy Family keys.
3. Use a mounted `torrc` or generate one from the environment.
4. Validate the effective configuration with `tor --verify-config`.
5. Report the image version, architecture, relay mode, and configuration source.
6. List the available diagnostics and launch Tor.

Environment-generated configurations are checked before they are written. Relay modes, nicknames, contact information, ports, and bandwidth values have explicit validation. Bridge operators can pass additional `OBFS4V_*` options, but the names and values are checked and the resulting Tor option must be on an allowlist. Anything outside that boundary requires a mounted configuration.

The entrypoint also forwards termination signals, waits for Tor to stop, and cleans up the log-tail process. Those details are easy to overlook until a host reboots or a container is replaced during an update.

## What “self-healing” actually means

The Docker health check verifies the active `torrc` every five minutes. A missing, unreadable, empty, or invalid configuration produces a failed check; three consecutive failures mark the container unhealthy.

> An unhealthy container is not automatically restarted by Docker. The health check supplies evidence. The process lifecycle, monitoring, and deployment platform determine what happens next.[^docker-restart]

If the Tor process exits, the entrypoint exits with it and a configured restart policy can launch a clean container. If Tor remains alive but the health check fails, Docker exposes that state for an orchestrator or external monitor to act on.

That is the project’s recovery model: fail fast during startup, publish useful state while running, maintain clean process boundaries, and let the deployment platform apply policy. “Self-healing” should never mean hiding a recurring failure behind an endless restart loop.

## Diagnostics made for operators

The image contains six small tools:

| Command | What it means |
| --- | --- |
| `status` | Human-readable local summary of the process, bootstrap, ORPort self-test, identity, configuration, family state, errors, and warnings. |
| `health` | Machine-readable JSON snapshot of local process state and log-derived relay state for monitoring and automation. |
| `fingerprint` | Relay nickname, full fingerprint, and Tor Metrics lookup link. |
| `bridge-line` | Generated obfs4 client bridge line and sharing guidance for bridge mode. |
| `gen-auth` | ControlPort password and `HashedControlPassword` value for Nyx. |
| `gen-family` | Happy Family key and `FamilyId` generation, plus inspection of existing family configuration. |

Run them with `docker exec tor-relay <command>`. To create a named Happy Family key, use `docker exec tor-relay gen-family MyRelays`.

The JSON report includes process state, uptime, bootstrap percentage, Tor's log-derived ORPort self-test state, error count, nickname, fingerprint, Tor version, relay mode, image build version, and configuration source. It is local operational evidence, not a fresh external probe of the advertised ORPort. The final two fields matter because “which image is this?” and “where did this configuration come from?” are incident-response questions, not cosmetic metadata.

{{< post-figure src="images/posts/tor-relays-project/onion-relay-operations.png" alt="Nyx showing ShinobiKenshin bandwidth and consensus flags above JSON health output and a human-readable status summary" class="post-figure--wide" >}}
ShinobiKenshin through three operator views: Nyx shows live bandwidth and consensus flags, while `health` and `status` provide machine-readable and operator-friendly relay state.
{{< /post-figure >}}

For obfs4 bridges, `bridge-line` reads the generated transport state and produces the client line along with sharing guidance. It turns a collection of address, port, fingerprint, certificate, and transport values into something the operator can verify and distribute privately.

{{< post-figure src="images/posts/tor-relays-project/obfs4-bridge-line.png" alt="Kage-Bridge bridge-line output with redacted address, port, fingerprint, and certificate followed by private-sharing instructions" >}}
A redacted `bridge-line` result for Kage-Bridge. The command assembles the address, port, fingerprint, obfs4 certificate, and transport parameters into a Tor Browser client line, then prints guidance for sharing it privately.
{{< /post-figure >}}

## Relay families without fingerprint bookkeeping

Tor’s Happy Families design replaces the fragile task of copying every relay fingerprint into every other relay’s `MyFamily` list. The operator creates a family key, obtains its base64 `FamilyId`, and makes that verifiable family identity available to each participating relay.

The project supports key generation and inspection with `gen-family`, automatic key detection, and `TOR_FAMILY_ID` validation against Tor's 43-character unpadded base64 format. Legacy `MyFamily` remains necessary during Tor's migration period. The [detailed migration guide](/2026/03/02/happy-families/) explains how to distribute the shared key, configure `FamilyId`, preserve `MyFamily`, and verify the published family certificate.[^family-id-guide]

## Testing and release automation

The repository includes examples for Docker CLI, Compose, Cosmos Cloud, Portainer, multi-relay deployments, exit notices, and Nyx monitoring. The same repository also contains the checks used to test and publish the images.

Before an image is published, the validation workflow:

- checks Dockerfiles with Hadolint and runs ShellCheck as advisory shell analysis
- builds a real test image and runs smoke tests
- confirms Tor, the diagnostic tools, build metadata, and file ownership
- enforces a minimum OpenSSL package version
- scans the image and repository with Trivy

Release jobs publish stable and edge manifests for AMD64 and ARM64. BuildKit attaches provenance and an SBOM, while the GitHub release contains downloadable CycloneDX and SPDX inventories for both variants. Stable images are rebuilt weekly with refreshed packages; edge is rebuilt more frequently. Registry cleanup retains a bounded set of older versions instead of allowing tags and caches to grow forever.

Publishing an image is only one part of a release. The tests, provenance, upgrade path, and documented failure behavior are what make it possible to operate safely over time.

## From a container to a real network

[Shinobi Relays](https://relays.brokenbotnet.com/) is the public view of the infrastructure I operate. Its current inventory contains {{< project-stat key="bridges" >}} obfs4 bridges and {{< project-stat key="public-relays" >}} public relays across {{< project-stat key="countries" >}} countries, {{< project-stat key="autonomous-systems" >}} autonomous systems, and {{< project-stat key="platforms" >}} operating-system families. The dashboard lists {{< project-stat key="ipv6-enabled" >}} relays and bridges configured for IPv6. Public Onionoo data and private bridge monitoring are needed to verify whether those paths remain externally reachable.

The [Shinobi Relays source](https://github.com/r3bo0tbx1/shinobi-relays) is intentionally dependency-free. Relay cards, totals, filters, and distribution summaries are rendered from one data array instead of several manually synchronized sections.

Configured intent is kept separate from observed state. A machine is not presented as a live Guard merely because its configuration says `guard`; online state, consensus flags, first-seen time, and last-seen time come from Tor’s Onionoo service. Only the network can confirm what the network currently sees.

Diversity matters here more than raw instance count. Twenty relays concentrated on one provider, jurisdiction, or operating system share the same failure domains. The goal is infrastructure that remains useful when one of those domains fails.

## Independent verification

The fleet also has an independent [1AEO metrics](https://web.archive.org/web/20260717141247/https://metrics.1aeo.com/relays.brokenbotnet.com/) page. It checks the public relays using Tor data rather than trusting my inventory. Its report validates the AROI and CIISS v3 contact record, relay-family proof, geographic and network diversity, platforms, uptime, and measured bandwidth.

In its 17 July 2026 data snapshot, 1AEO sees and successfully validates all sixteen public relays. The eight bridges are absent by design because bridges are not listed in the public consensus.

{{< post-figure src="images/posts/tor-relays-project/1aeo-independent-validation.png" alt="1AEO contact and network overview validating all sixteen public relays for relays.brokenbotnet.com across fifteen locations" class="post-figure--wide" >}}
The 1AEO view captured on 17 July 2026 validates the complete public relay set. My dashboard documents intended infrastructure; Onionoo and 1AEO show what the public Tor network can verify.
{{< /post-figure >}}

This evidence still has limits. Public metrics cannot verify private bridge reachability, backup quality, provider independence, or whether two differently branded services share an upstream control plane.

## What operating it taught me

Running the project changed what I pay attention to:

- **An unhealthy status does not fix the problem.** Docker reports the failed health check, but it does not restart the container automatically. An operator, monitoring system, or orchestrator still has to decide what happens next.
- **Configuration provenance matters.** A mounted file and generated environment configuration may behave identically until they do not; the operator should be able to tell which path produced the running state.
- **Declared roles are not consensus flags.** A relay configured as a guard candidate is not a live Guard until the authorities say so.
- **Fleet diversity beats fleet size.** Providers, networks, jurisdictions, platforms, and address families are all operational dependencies.
- **Automation should leave evidence.** Tests, image provenance, SBOMs, release notes, and public network data are more useful than a green publish job alone.

The next phase is not about adding every possible option. It is about tighter monitoring, less metadata drift, safer upgrades, clearer operator feedback, and documentation that stays aligned with what the image actually does.

The source, deployment guides, templates, and issue tracker are in the [tor-guard-relay](https://github.com/r3bo0tbx1/tor-guard-relay) repository. The infrastructure it supports is visible on Shinobi Relays and independently through 1AEO.

Tor needs more capacity, but capacity alone is not the goal. What matters is diverse infrastructure operated carefully, transparently, and for the long term.

## References

[^privacy-guides]: Privacy Guides, [“Why Privacy Matters”](https://web.archive.org/web/20260707163947/https://www.privacyguides.org/en/basics/why-privacy-matters/).
[^solove]: Daniel J. Solove, [“Why Privacy Matters Even if You Have ‘Nothing to Hide’”](https://web.archive.org/web/20260704211435/https://www.chronicle.com/article/why-privacy-matters-even-if-you-have-nothing-to-hide/), *The Chronicle of Higher Education*.
[^un-privacy]: United Nations Human Rights Council, [“The Right to Privacy in the Digital Age”](https://web.archive.org/web/20260504060931/https://www.ohchr.org/sites/default/files/HRBodies/HRC/RegularSessions/Session27/Documents/A.HRC.27.37_en.pdf), A/HRC/27/37.
[^schneier]: Bruce Schneier, [“Q&A with Bruce Schneier”](https://web.archive.org/web/20230605025904/https://www.schneier.com/news/archives/2009/02/qa_with_bruce_schnei_1.html).
[^mcintyre]: United States Supreme Court, [*McIntyre v. Ohio Elections Commission*, 514 U.S. 334 (1995)](https://web.archive.org/web/20260630123542/https://supreme.justia.com/cases/federal/us/514/334/).
[^federalist-papers]: Library of Congress, [“Federalist Papers: Primary Documents in American History”](https://web.archive.org/web/20260709145525/https://guides.loc.gov/federalist-papers).
[^udhr]: United Nations, [“Universal Declaration of Human Rights, Article 12”](https://web.archive.org/web/20260713200629/https://www.un.org/en/about-us/universal-declaration-of-human-rights#article-12).
[^tor-purpose]: Roger Dingledine, [“Re: Tor and the National Security Letters”](https://archive.torproject.org/websites/lists.torproject.org/pipermail/tor-talk/2005-February/005029.html), Tor Project mailing-list archive.
[^snowden]: The Guardian, [“Edward Snowden: NSA Reform in the US Is Only the Beginning”](https://web.archive.org/web/20260425013735/https://www.theguardian.com/us-news/2015/may/22/edward-snowden-nsa-reform).
[^docker-restart]: Docker, [“Start Containers Automatically”](https://web.archive.org/web/20260706103641/https://docs.docker.com/engine/containers/start-containers-automatically/).
[^family-id-guide]: Tor Project, [“Relay Family IDs”](https://web.archive.org/web/20260515152914/https://community.torproject.org/relay/setup/post-install/family-ids/).
