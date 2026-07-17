---
title: "Why Relay Diversity Matters More Than Raw Node Count"
seo_title: "Why Tor Relay Diversity Matters More Than Node Count"
date: 2026-05-22
lastmod: 2026-07-17
slug: "diversity-first"
aliases:
  - "/2025/11/19/relay-diversity-over-node-count/"
  - "/2026/07/13/relay-diversity-over-node-count/"
description: "Why providers, autonomous systems, jurisdictions, operating systems, and address families matter more than an impressive relay total."
summary: "Twenty relays that share one failure domain do not provide the same resilience as a smaller fleet distributed across genuinely independent networks and platforms."
image: "images/posts/diversity-first/diversity-first.jpg"
image_alt: "A concentrated server fleet facing one failure compared with diverse independent relay locations"
thumbnail: "images/posts/diversity-first/diversity-first.jpg"
thumbnail_anchor: "Right"
tags: ["tor", "relay", "diversity", "networking", "infrastructure"]
toc: true
draft: false
---

Node count is easy to understand. It is also easy to optimize for the wrong outcome.

A dashboard showing twenty-four relays and bridges looks stronger than one showing twelve. That comparison says little if the larger fleet is concentrated in one provider, one autonomous system, one jurisdiction, one operating system, or one administrative process that can fail everywhere at once.

Capacity and diversity are separate properties. A relay in an underrepresented network can improve resilience only if it is stable, secure, reachable, and able to carry useful traffic. A novel location does not compensate for an unreliable relay.

{{< post-figure src="images/posts/diversity-first/diversity-first.jpg" alt="A concentrated server fleet facing one failure compared with diverse independent relay locations" class="post-figure--wide" >}}
Raw node count can hide concentration. Diversity spreads relays across independent networks, locations, systems, and operators.
{{< /post-figure >}}

## A provider name is not a network

Two hosting companies may route through the same autonomous system. A reseller may present a different storefront while using the same upstream infrastructure. Servers in different cities may still depend on the same control plane, billing account, DNS provider, automation credential, monitoring service, or operator workstation.

That means provider diversity should be checked against network diversity. Before adding a relay, I want to know:

- Which autonomous system announces the address?
- Is the provider a reseller?
- Where is the server physically and legally located?
- Does the network already carry a large share of Tor capacity?
- Does the provider explicitly permit the intended relay role?
- Is IPv6 native, tunnelled, or unavailable?

The Tor Project recommends considering autonomous-system and country diversity when selecting a host. It also advises avoiding already concentrated networks when a reasonable alternative exists.[^tor-diversity]

I verify those claims instead of trusting provider branding. Relay Search and Onionoo show the public relay's address, autonomous system, flags, first-seen time, and observed state. Provider ownership and reseller relationships require a separate check. The result is a dependency map, not simply a list of company names.

## Geography is more than a flag

A country label can hide several dependencies. The server may be billed through another jurisdiction, managed by a company elsewhere, or connected through an upstream in a different region.

Geographic spread is still valuable. Regional outages, routing incidents, natural disasters, legal orders, and provider policy changes do not affect every location equally. The point is not to collect flags. It is to avoid a fleet that can disappear because one region or authority changes state.

## Operating-system diversity has a cost

The same Tor Project guidance also notes that BSD and other non-Linux systems improve platform diversity. That does not mean every operator should deploy an unfamiliar system for the statistic alone.

Platform diversity becomes useful when the operator can maintain it. Each system introduces its own:

- Package or source-build path.
- Service manager.
- Privilege and user model.
- Firewall syntax.
- Data-directory convention.
- Upgrade and rollback procedure.
- Failure behavior after reboot.

A neglected BSD relay is not better than a carefully maintained Linux relay. Diversity must include operational competence.

## Address-family diversity is not a checkbox

IPv6 can reduce dependence on the IPv4 path, but only when it survives real operations. A configured address that disappears after reboot adds fragility instead of resilience.

For each relay I track whether IPv6 is native or tunnelled, how it is restored, and whether Tor can publish and reach the intended ORPort. Shinobi Relays currently lists {{< project-stat key="ipv6-enabled" >}} relays and bridges configured for IPv6, but the useful metric is how many remain reachable after maintenance and failure.

## Roles should not share every dependency

Bridges, middle relays, guard candidates, and exits have different exposure.

Publishing a bridge from an address already associated with a public relay undermines the bridge's usefulness to censored users. Exit relays face provider policy and abuse-handling pressure that middle relays do not. A fleet that places every role under one account or provider creates a common administrative failure.

Role diversity therefore needs dependency diversity. It is not enough to run different Tor modes on otherwise identical infrastructure.

## Measure configured and observed state separately

An inventory can count what is configured. Onionoo and the consensus show what the network observes. Neither view replaces the other.

I use the inventory for ownership, intended role, operating system, region, and recovery information. I use network data for reachability, flags, first-seen and last-seen times, and consensus state. This avoids claiming a live role from a configuration file alone.

A useful diversity report should answer:

1. How many active public relays does the network see?
2. How many bridges are intentionally absent from that view?
3. Which providers and autonomous systems are shared?
4. Which operating systems and service models are shared?
5. Which relays depend on the same account, tunnel, or maintenance process?
6. Which loss would remove a unique region, role, or platform?

{{< post-figure src="images/posts/diversity-first/aroi-diversity-all-rounders.png" alt="AROI Diversity All-Rounders table ranking relays.brokenbotnet.com first with coverage across fifteen countries, six operating systems, and eleven autonomous systems" class="post-figure--wide" >}}
A mid-July 2026 [AROI snapshot](https://web.archive.org/web/20260717142108/https://metrics.1aeo.com/misc/aroi-leaderboards.html#most_diverse) lists Shinobi Relays first overall for combined geographic, platform, network, and fleet breadth. Rankings change, but the dimensions being measured are more useful than raw relay count alone.
{{< /post-figure >}}

Tor's operator expectations add a network-wide boundary: one operator should avoid controlling more than 20 percent of total Exit capacity or 10 percent of total consensus weight.[^operator-expectations] Shinobi Relays is far below those thresholds, but they are useful reminders that operator concentration matters alongside provider and platform concentration.

## What diversity does not prove

- Different countries do not guarantee different upstream routes.
- Different provider brands do not guarantee different parent companies or control planes.
- Different autonomous systems do not guarantee separate billing, DNS, automation, or monitoring.
- Different operating systems do not help if one compromised credential can change every host.
- More unusual locations do not compensate for instability, poor bandwidth, or weak maintenance.

## The better question

Instead of asking “How many relays can I add?” I ask “Which shared dependency can I remove?”

Sometimes the answer is another country. Sometimes it is another autonomous system, a native IPv6 provider, a non-Linux platform, or a separate operator process. Sometimes the right answer is to improve monitoring and backups on the relays already running.

Raw node count is still worth publishing. It should be treated as an inventory total, not a score. The stronger fleet is the one that keeps serving users when a provider, route, platform, or jurisdiction fails.

## References

[^tor-diversity]: Tor Project, [“Technical Considerations: AS/Location Diversity and Choosing an Operating System”](https://web.archive.org/web/20260520034931/https://community.torproject.org/relay/technical-considerations/).
[^operator-expectations]: Tor Project, [“Expectations for Relay Operators”](https://web.archive.org/web/20260529215252/https://community.torproject.org/policies/relays/expectations-for-relay-operators/).

- Tor Project, [“Relay Search”](https://web.archive.org/web/20260707162626/https://metrics.torproject.org/rs.html)
- Tor Project, [“Onionoo Protocol”](https://web.archive.org/web/20260710132722/https://metrics.torproject.org/onionoo.html)
