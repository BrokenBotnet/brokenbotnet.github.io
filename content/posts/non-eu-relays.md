---
title: "What Operating Tor Across Fifteen Locations Taught Me"
seo_title: "Lessons From Operating Tor Relays Across Fifteen Locations"
date: 2026-07-17
lastmod: 2026-07-17
slug: "non-eu-relays"
aliases:
  - "/2025/09/07/operating-tor-across-fifteen-countries/"
  - "/2026/07/13/operating-tor-across-fifteen-countries/"
description: "Operational lessons from building and maintaining a geographically and technically diverse Tor relay fleet."
summary: "A larger relay fleet does not only multiply bandwidth. It multiplies providers, failure modes, upgrade paths, and the responsibility to keep every identity and configuration correct."
image: "images/posts/non-eu-relays/non-eu-relays.jpg"
image_alt: "Illustrated Tor relay network distributed across regions, platforms, and independent infrastructure"
thumbnail: "images/posts/non-eu-relays/non-eu-relays.jpg"
thumbnail_anchor: "Center"
tags: ["tor", "relay", "operations", "infrastructure", "privacy"]
toc: true
draft: false
---

The first Tor relay felt like a server. A fleet spread across locations, providers, networks, and operating systems feels more like a living system.

Shinobi Relays currently documents {{< project-stat key="nodes" >}} relays and bridges: {{< project-stat key="public-relays" >}} public relays and {{< project-stat key="bridges" >}} bridges across {{< project-stat key="countries" >}} locations, {{< project-stat key="autonomous-systems" >}} autonomous systems, and {{< project-stat key="platforms" >}} platform families. Those numbers describe my inventory, not a single live network measurement. The real operational surface is every firewall, package source, service manager, filesystem layout, IPv6 route, identity key, provider policy, and recovery procedure behind them.

That footprint currently spans 15 locations outside the European Union: Japan, South Korea, Singapore, Malaysia, Indonesia, Vietnam, Hong Kong, Australia, Russia, Türkiye, South Africa, Canada, the United States, Mexico, and Brazil.

<p class="relay-location-flags" aria-hidden="true">🇯🇵 <span>•</span> 🇰🇷 <span>•</span> 🇸🇬 <span>•</span> 🇲🇾 <span>•</span> 🇮🇩 <span>•</span> 🇻🇳 <span>•</span> 🇭🇰 <span>•</span> 🇦🇺 <span>•</span> 🇷🇺 <span>•</span> 🇹🇷 <span>•</span> 🇿🇦 <span>•</span> 🇨🇦 <span>•</span> 🇺🇸 <span>•</span> 🇲🇽 <span>•</span> 🇧🇷</p>

Operating that surface changed how I think about Tor infrastructure.

{{< post-figure src="images/posts/non-eu-relays/non-eu-relays.jpg" alt="Illustrated Tor relay network distributed across regions, platforms, and independent infrastructure" class="post-figure--wide" >}}
A relay fleet becomes more resilient when geography, networks, platforms, and operational dependencies do not all share one failure domain.
{{< /post-figure >}}

## Inventory is not network truth

My inventory describes what I intend to operate. It records a relay name, role, address, provider, country, operating system, and family membership. That is necessary for maintenance, but it does not prove what the Tor network currently sees.

Observed state comes from the network. A public relay may be configured correctly and still be offline, unreachable, absent from the consensus, or waiting to earn a flag. A relay configured as a guard candidate is not a Guard until the directory authorities assign that flag. Bridges are deliberately absent from the public consensus, so their visibility model is different again.

This is why Shinobi Relays keeps configured roles separate from Onionoo state. A dashboard should not turn an operator's intention into a claim about the live network.

## Why look beyond Europe?

Looking beyond established European hosting markets can expand the network's geographic and jurisdictional spread, but only when a new location also changes a meaningful dependency.

A geographic label is not a failure domain by itself. Several relays in different locations may still share the same autonomous system, upstream network, provider account, or automation credential. The gap between {{< project-stat key="countries" >}} listed locations and {{< project-stat key="autonomous-systems" >}} autonomous systems in my own inventory is a useful reminder: a map can look more distributed than the routing and administration behind it.

I therefore treat non-European deployment as a starting question, not proof of diversity. The useful questions are whether the relay adds a new network, a provider that accepts the role, a maintainable platform, reliable routes, and a recovery path I can actually operate.

<div class="post-figure-pair post-figure-pair--equal">
{{< post-figure src="images/posts/non-eu-relays/aroi-frontier-builders.png" alt="AROI Frontier Builders table ranking relays.brokenbotnet.com third for operating relays in rarely represented countries" >}}
A July 2026 [AROI snapshot](https://metrics.1aeo.com/relays.brokenbotnet.com/) places Shinobi Relays third for rare-country breadth. The ranking is a point-in-time view and can change with the public network.
{{< /post-figure >}}
{{< post-figure src="images/posts/non-eu-relays/aroi-jurisdiction-globetrotters.png" alt="AROI Jurisdiction Globetrotters table ranking relays.brokenbotnet.com second with relays across fifteen non-EU countries" >}}
The same snapshot places Shinobi Relays second for non-EU jurisdictional breadth, reflecting the fifteen locations documented in this article.
{{< /post-figure >}}
</div>

## Identity is the part that must survive

A failed container can be replaced. A failed server can be rebuilt. A relay identity should survive both when recovery is possible.

The important state is not the image or package installation. It is the data directory containing the relay identity and, for a family, the family key. Losing that state creates a new fingerprint and first-seen date. The replacement also loses the previous relay's stability history and must spend time becoming eligible for flags such as Guard or HSDir, where applicable.

My backup priorities therefore start with:

1. Relay identity keys.
2. Happy Family keys.
3. The effective `torrc` and its source.
4. Provider, addressing, firewall, and recovery notes.
5. Monitoring context needed to tell a recovered relay from a different relay.

A backup that has never been restored is still an assumption. The location and ownership of the restored keys matter as much as the archive itself.

## Standardize the outcome, not every host

Linux, the BSD family, and SunOS do not share one service manager, privilege model, package layout, or filesystem convention. Pretending otherwise creates brittle instructions.

The stable operational outcomes are more useful than identical commands:

- Tor runs under a dedicated unprivileged account.
- The data directory is persistent and correctly owned.
- The configuration is verified before restart.
- Required ports are reachable.
- Time synchronization works.
- Logs remain useful without exposing user activity.
- Identity and family material are backed up.

On Debian that may involve `systemd` and `/var/lib/tor`. OpenBSD uses `rcctl` and `/var/tor`. NetBSD can place identity keys inside `/var/chroot/tor/keys`. OmniOS uses SMF and can surface a failure as a service in `maintenance` state. The goal stays consistent while the runbook respects the operating system.

## IPv6 is an operational dependency

Every current Shinobi relay entry is configured for IPv6. That is not the same as claiming every route is externally reachable at every moment. Public relays can be checked through Onionoo and external probes; bridges require private monitoring that does not expose their addresses.

Native provider IPv6 and tunnelled IPv6 fail differently. A route may work immediately but disappear after reboot. A tunnel may exist before its interface is ready. A provider may delegate a prefix but require a specific gateway. A service can start before the address it expects has appeared.

The durable test is not “does this address answer now?” It is:

- Does the address return after reboot?
- Does Tor start after the network is ready?
- Is the ORPort reachable externally over both address families?
- Does the published descriptor contain the intended address?
- Can the configuration avoid binding to an address the host cannot actually own?

The failures were not identical across the fleet. Some hosts needed persistent tunnel and route restoration. NetBSD required backups to account for identity keys inside a chroot. OmniOS exposed failures through SMF's `maintenance` state rather than a systemd unit. Debian hosts split between host-managed and container-managed Tor, with different upgrade owners. Those differences are the operational cost of diversity, and the reason one copied runbook cannot safely cover every host.

## Monitoring needs ownership

Health data is evidence, not remediation. An alert is useful only if it reaches a person or system that can act.

For each relay I want to distinguish at least four conditions:

1. The service process is running.
2. The configuration remains valid.
3. Tor has bootstrapped and its ORPort is reachable.
4. The network still observes the public relay as expected.

Those are different failure domains. Restarting a container cannot repair an expired provider account, a missing route, a blocked port, or incorrect family metadata.

The third condition also needs two sources of evidence. Tor's local log can report its ORPort self-test, while an external probe tests the public path. Neither result should be silently substituted for the other.

## Diversity increases work and reduces shared risk

Using another country or operating system is not automatically useful. The new relay should reduce a meaningful shared dependency. A different brand can still resell the same network. A different country can still terminate through the same upstream. A second operating system can add maintenance risk if nobody understands it.

The Tor Project encourages geographic and autonomous-system diversity because concentration makes the network less resilient.[^technical-considerations] Its expectations for operators also emphasize keeping users safe, maintaining a working contact address, avoiding disproportionate control, and treating relay operation as a transparent public responsibility.[^operator-expectations]

The lesson is not to maximize every diversity statistic. It is to understand which failures are shared, then add capacity where it genuinely changes that risk.

The public snapshot can verify fingerprints, flags, autonomous systems, observed uptime, and measured bandwidth. It cannot verify private bridge reachability, restore testing, provider-account separation, or whether two differently branded services share an administrative control plane.

## What I would tell a new fleet operator

Start with one relay and document it well. Learn how it appears in Relay Search, how long flags take, how updates behave, where the identity lives, and what your provider does with abuse reports. Add another only when the first has a recovery path you trust.

Automation becomes valuable when it preserves evidence. It should show what changed, validate the result, and leave enough context for a human to understand a failure. The objective is not a large number of unattended servers. It is infrastructure that can remain useful without becoming careless.

That is what operating across fifteen locations taught me: scale is not the number displayed on the dashboard. Scale is the number of independent promises you can continue to keep.

## References

[^technical-considerations]: Tor Project, [“Technical Considerations”](https://web.archive.org/web/20260520034931/https://community.torproject.org/relay/technical-considerations/).
[^operator-expectations]: Tor Project, [“Expectations for Relay Operators”](https://web.archive.org/web/20260529215252/https://community.torproject.org/policies/relays/expectations-for-relay-operators/).
