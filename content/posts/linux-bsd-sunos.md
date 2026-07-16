---
title: "Operating Tor Relays on Linux, BSD, and SunOS"
seo_title: "Operating Tor Relays Across Linux, BSD, and SunOS"
date: 2026-04-07
lastmod: 2026-07-07
slug: "linux-bsd-sunos"
aliases:
  - "/2026/07/08/tor-relays-linux-bsd-sunos/"
  - "/2026/07/13/tor-relays-linux-bsd-sunos/"
description: "The operational differences that matter when Tor runs across Debian, Alpine Linux, FreeBSD, OpenBSD, NetBSD, DragonFlyBSD, and OmniOS."
summary: "The torrc language travels well. Service managers, privilege models, paths, packaging, firewalls, and recovery procedures do not."
image: "images/posts/linux-bsd-sunos/linux-bsd-sunos.jpg"
image_alt: "Illustrated Linux, BSD, and SunOS systems growing from distinct technical foundations"
thumbnail: "images/posts/linux-bsd-sunos/linux-bsd-sunos.jpg"
thumbnail_anchor: "Center"
tags: ["tor", "linux", "BSD", "SunOS", "operations", "self-hosting"]
toc: true
draft: false
---

Tor's configuration is portable. Relay operations are not.

The same basic `torrc` concepts apply across Linux, FreeBSD, OpenBSD, NetBSD, DragonFlyBSD, and OmniOS: an ORPort, a dedicated user, a persistent data directory, contact information, and bandwidth policy. Family metadata is also required when one operator controls multiple relays; a standalone relay does not need to declare a family. The surrounding system changes almost everything about how those requirements are installed, started, verified, backed up, and recovered.

That difference is one reason I wanted non-Linux relays in Shinobi Relays. Platform diversity reduces shared risk, but only when the runbooks respect each system instead of treating every Unix-like host as Linux with another package manager.

{{< post-figure src="images/posts/linux-bsd-sunos/linux-bsd-sunos.jpg" alt="Illustrated Linux, BSD, and SunOS systems growing from distinct technical foundations" class="post-figure--wide" >}}
Different operating systems can strengthen a relay fleet, but each one brings its own service manager, paths, privilege model, and recovery work.
{{< /post-figure >}}

These AROI snapshots from early July 2026 show how that cross-platform work was reflected in the independent operator rankings.

<div class="post-figure-pair">
{{< post-figure src="images/posts/linux-bsd-sunos/aroi-champion-rankings.png" alt="AROI Champion Rankings listing eight placements for relays.brokenbotnet.com, including OS Polyglot and Non-Linux Powerhouse" >}}
Eight AROI Champion placements for relays.brokenbotnet.com.
{{< /post-figure >}}
{{< post-figure src="images/posts/linux-bsd-sunos/aroi-os-polyglot-ranking.png" alt="AROI OS Polyglots table ranking relays.brokenbotnet.com first with six distinct operating systems" >}}
The OS Polyglots ranking places relays.brokenbotnet.com first for platform breadth in this snapshot.
{{< /post-figure >}}
</div>

## The common operational contract

Across every platform I want the same outcomes:

1. Tor runs without unnecessary privilege.
2. Identity keys persist across upgrades and rebuilds.
3. The configuration is verified before service restart.
4. IPv4 is externally reachable and IPv6 is reachable wherever the host is configured to provide it.
5. Time synchronization is reliable.
6. Logs are useful and retain safe logging behavior.
7. The service returns after reboot.
8. Backups include the actual key location used by that platform.

The Tor Project recommends using an operating system the operator understands, while noting that BSD and other non-Linux relays improve network diversity.[^tor-platform-diversity] Familiarity and diversity have to be balanced.

## Paths are operational facts

The most dangerous path is the one copied from the wrong operating system.

| Platform | Service | Tor user | torrc | Data / keys |
| --- | --- | --- | --- | --- |
| Debian | `systemd` | `debian-tor` | `/etc/tor/torrc` | `/var/lib/tor` (`keys/`) |
| Alpine | Docker | `tor` (UID 100) | `/etc/tor/torrc` | `/var/lib/tor` (`keys/`) |
| FreeBSD | `service` / rc.d | `_tor` | `/usr/local/etc/tor/torrc` | `/var/db/tor` |
| OpenBSD | `rcctl` | `_tor` | `/etc/tor/torrc` | `/var/tor` |
| NetBSD | rc.d | `tor` | `/usr/pkg/etc/tor/torrc` | `/var/db/tor`, `/var/chroot/tor/keys` |
| DragonFlyBSD | rc.d | `_tor` | `/usr/local/etc/tor/torrc` | `/var/db/tor` |
| OmniOS / SunOS | SMF | `tor` | `/usr/local/etc/tor/torrc` | `/var/lib/tor` |
{class="platform-paths-table"}

These are paths verified by my current fleet runbooks, not universal package defaults. Package choices, prefixes, jails, zones, and local policy can change the layout. Anyone adapting the table should confirm the effective service account, configuration path, data directory, and key location on the target host before using it as a recovery guide.

## Linux: Debian and Alpine

Linux is not one deployment mode in the fleet.

Some relays are host-managed on Debian: Tor is built or installed on the host, runs as `debian-tor`, and is supervised by `systemd`. Others are Docker-managed and run inside the Alpine-based tor-guard-relay image as the unprivileged `tor` user with UID 100.

Both layouts use `/etc/tor/torrc` and `/var/lib/tor`, with identity and family keys under `/var/lib/tor/keys`. The container can generate its configuration or use a mounted `torrc`, while its data directory should be kept on persistent storage.

Those paths should remain separate. A host-managed upgrade may involve stopping a service, backing up `/var/lib/tor`, replacing a binary, verifying `/etc/tor/torrc`, and starting the unit. A container-managed upgrade pulls an image and replaces the container while preserving its volume.

Combining host and container instructions creates ambiguity about which layer owns Tor.

## FreeBSD: conventional paths, different administration

FreeBSD uses the familiar `/usr/local` prefix for third-party software. In my source-build layout the configuration lives at `/usr/local/etc/tor/torrc`, data at `/var/db/tor`, and the service runs as `_tor`.

The important differences from Debian include rc.d service management, `doas` in the hardened setup, PF firewall syntax, and the need to treat file-backed swap and provider IPv6 according to FreeBSD's tools rather than Linux examples.

The configuration can look similar while every maintenance command around it changes.

## OpenBSD: base-system conventions matter

OpenBSD keeps the active `torrc` at `/etc/tor/torrc` in this deployment, even though a source-built binary is under `/usr/local/bin`.

Two details in the runbook are easy to miss:

- `User _tor` allows Tor to drop privilege correctly when `rcctl` starts it.
- The PID file belongs under `/var/tor/tor.pid`, not a Linux-shaped `/var/run/tor/tor.pid` directory that does not exist by default.

Configuration verification also needs to follow the service model. Running the command as `_tor` while the configuration itself tells Tor to change to `_tor` can fail because the already unprivileged process cannot perform the same group transition. The working check is performed through `doas` with the real configuration, then the service is controlled with `rcctl`.

## NetBSD: pkgsrc, make, and the chroot

NetBSD uses the pkgsrc prefix in this setup:

```text
/usr/pkg/bin/tor
/usr/pkg/etc/tor/torrc
```

The build tool is another portability trap. GNU make installed through pkgsrc is invoked as `make` here, not `gmake`.

The identity backup is the critical difference. This relay stores keys inside `/var/chroot/tor/keys`. Backing up only `/var/db/tor` misses the material needed to preserve identity. A recovery plan that does not know about the chroot can rebuild a working service with the wrong identity.

## DragonFlyBSD: similar paths do not mean identical behavior

DragonFlyBSD also uses `/usr/local` paths and an rc.d service, but that does not make its runbook interchangeable with FreeBSD.

Ravenports supplies build dependencies in the current deployment, while Tor itself is built from source. IPv6 tunnel persistence requires DragonFly-specific interface and route commands. Its `route` syntax uses `-inet6`, and a dedicated startup script can be more reliable than copying FreeBSD `rc.conf` assumptions for a `gif0` tunnel.

This is a recurring lesson: shared ancestry does not remove platform-specific failure modes.

## OmniOS and SunOS: SMF changes the troubleshooting model

OmniOS uses the Service Management Facility rather than systemd or BSD rc.d. A failed Tor service may enter `maintenance`, and the useful inspection commands are `svcs` and `svccfg`.

The current source-build process also has illumos-specific details:

- GNU tar is invoked as `gtar`.
- GNU make is invoked as `gmake`.
- libevent may need a separate source build.
- Runtime library search paths need to be included during linking.
- `pfexec` does not accept Linux-shaped `-u` usage.
- I have observed `Unknown N/A as libc` in Tor's version output on this OmniOS deployment. The string alone is not enough to diagnose a failure; the linked libraries, service state, logs, and runtime behavior still need to be verified.

When SMF starts the service as the `tor` user, that service context is more authoritative than forcing a Linux-style manual command. Check the SMF properties, the service state, logs, and linked libraries together.

## How I harden the fleet across operating systems

The implementation changes by platform, but the intent stays consistent: minimize login exposure, run Tor without administrative privilege, restrict inbound traffic, validate configuration before restart, preserve identity keys, and verify the service after a change. Management ports, addresses, hostnames, provider routes, and other infrastructure identifiers are intentionally omitted here.

- **Debian:** Routine administration uses a non-root account and key-based access, with direct root and password logins disabled. A default-deny host firewall, connection-abuse controls, automatic security updates, and network-level kernel settings reduce exposure. Host-managed Tor runs as `debian-tor` under `systemd`.
- **Alpine:** The container runs as the unprivileged `tor` user without a login shell. Tor owns only its configuration, runtime, log, and data directories; configuration is checked before startup; and identity data lives on persistent storage. SSH, firewall, Docker daemon security, and host updates remain the host operating system's responsibility.
- **FreeBSD and DragonFlyBSD:** Routine administration goes through `doas`, remote access is key-based, and PF restricts inbound traffic with state tracking. File-descriptor limits and kernel settings are applied with each BSD's own tools, while rc.d supervises Tor. DragonFlyBSD also keeps its network setup persistent across reboot instead of borrowing FreeBSD commands.
- **OpenBSD:** The setup uses `doas`, hardened remote access, PF stateful filtering, resource limits, the `_tor` account, and `rcctl`. Configuration is verified from the correct privilege context before restart, and logs are handled through native system facilities.
- **NetBSD:** The runbook combines `doas`, a stateful NPF policy, disabled forwarding, explicit resource limits, rc.d supervision, configuration checks, and routine health monitoring. Identity backups include the chrooted key directory rather than assuming every important file lives under `/var/db/tor`.
- **OmniOS and SunOS:** Administration and Tor use separate accounts, remote access is key-based, and direct root login is disabled. IPFilter restricts inbound traffic, project and system controls set resource limits, SMF supervises Tor, and log ownership is checked as part of service verification.

## Source builds increase control and maintenance

A source build makes the Tor version and dependency choices explicit. It also makes the operator responsible for compiler dependencies, library paths, verification, replacement, and future security updates.

The safe sequence across platforms is consistent even when commands differ:

1. Stop the service cleanly.
2. Back up configuration, identities, and family keys.
3. Verify the signed checksum file using the Tor developers' OpenPGP keys, then compare the archive against that authenticated checksum.
4. Build with platform-appropriate dependencies and tools.
5. Verify the installed binary and effective configuration.
6. Start through the native service manager.
7. Confirm logs, ORPort reachability, identity, and network observation.
8. Keep the previous binary or a documented rollback path until verification finishes.

Source builds also need an update owner. The runbook should record the installed Tor version, the operating system's support status, the dependency update path, and who responds when Tor or a required library reaches end of support. Correct time synchronization belongs in the same contract because stale system time can break directory information and certificate validation.

## Diversity must remain maintainable

Non-Linux relays are useful because they reduce monoculture. They also require more testing, more precise notes, and a willingness to learn each system's native administration model.

The goal is not to make BSD or SunOS imitate Linux. It is to define a common relay safety contract, then implement that contract in a way each operating system can sustain.

## References

[^tor-platform-diversity]: Tor Project, [“Technical Considerations: Choosing an Operating System”](https://web.archive.org/web/20260520034931/https://community.torproject.org/relay/technical-considerations/).

- Tor Project, [“How to Verify Tor Source Code”](https://web.archive.org/web/20260611184227/https://support.torproject.org/little-t-tor/getting-started/verifying/#bsd-linux)
- Tor Project, [“Expectations for Relay Operators”](https://web.archive.org/web/20260529215252/https://community.torproject.org/policies/relays/expectations-for-relay-operators/)
