---
title: "Building Safer Container Health Checks for Tor Relays"
seo_title: "Building Safer Docker Health Checks for Tor Relays"
date: 2026-01-31
lastmod: 2026-10-30
slug: "health-checks"
aliases:
  - "/2026/03/26/safer-container-health-checks/"
  - "/2026/07/13/safer-container-health-checks/"
description: "What a Tor relay health check can prove, what it cannot prove, and how to keep monitoring from hiding operational failures."
summary: "A green container is not the same as a healthy relay. Useful health checks stay narrow, publish evidence, and leave recovery policy to the system responsible for acting."
image: "images/posts/health-checks/health-checks.jpg"
image_alt: "A Tor container moving from a basic check to layered configuration, process, network, and monitoring signals"
thumbnail: "images/posts/health-checks/health-checks.jpg"
thumbnail_anchor: "Right"
tags: ["tor", "docker", "monitoring", "health-checks", "operations"]
toc: true
draft: false
---

{{< release-update page="posts/v2.2.1" label="Tor Guard Relay v2.2.1 is released" >}}with Tor 0.4.9.15 and bridge/exit diagnostics resolved from effective configuration, including includes. Exact-process liveness, current-run readiness, configuration validity and freshness remain separate signals; public reachability needs its own check.{{< /release-update >}}

“Healthy” is one of the most overloaded words in container operations.

A container can be running while Tor has an invalid configuration. Tor can be running while bootstrap is stalled. A relay can be fully bootstrapped while its ORPort is unreachable from the Internet. A public relay can be reachable while missing from the consensus.

One green indicator cannot prove all of those layers.

{{< post-figure src="images/posts/health-checks/health-checks.jpg" alt="A Tor container moving from a basic check to layered configuration, process, network, and monitoring signals" class="post-figure--wide" >}}
A useful health model separates local configuration checks from process, bootstrap, reachability, consensus, and monitoring signals.
{{< /post-figure >}}

## Start with a narrow contract

The Docker health check in tor-guard-relay verifies that the exact Tor process is alive and that its active configuration exists, is readable, is non-empty and passes `tor --verify-config`. Exact-process liveness was added in v2.2.0; the earlier implementation checked configuration alone.

The image runs that check every five minutes with a fifteen-second timeout, a thirty-second start period, and three retries:

```dockerfile
HEALTHCHECK --interval=5m --timeout=15s --start-period=30s --retries=3 \
  CMD /usr/local/bin/healthcheck.sh
```

The script checks local process liveness and configuration validity. It cannot establish whether the network sees a working relay; bootstrap, readiness and external reachability remain separate observations.

That narrow contract makes the result understandable. It also means the result must not be described as proof of reachability or consensus health.

`tor --verify-config` has limits of its own. It verifies the configuration as Tor reads it; it does not prove that file ownership is correct for every runtime path, that the running process loaded the latest file, or that any advertised port is reachable from the Internet.

## Docker does not repair an unhealthy container

Docker records health status, but an `unhealthy` result does not automatically restart the container. A restart policy applies when the container process exits. It does not, by itself, turn a failed health check into a restart.

This distinction matters because operators often assume `--restart unless-stopped` covers both conditions.

The safer model is:

- The entrypoint exits when the Tor process exits.
- Docker can apply the configured restart policy to that process failure.
- The health check publishes process or configuration failure as container state.
- Monitoring or an orchestrator decides what an unhealthy state should trigger.

The system responsible for recovery should be explicit. Otherwise an alert exists without an owner.

## Separate health into layers

I treat relay health as several related checks rather than one score.

### Layer 1: Configuration

Questions:

- Does the intended `torrc` exist?
- Is it readable by the Tor user?
- Is it non-empty?
- Does `tor --verify-config` accept it?
- Was it mounted or generated from environment variables?

This belongs close to the container because it is cheap, deterministic, and does not require network access.

### Layer 2: Process

Questions:

- Is the Tor process alive?
- Did it exit and restart?
- Is the entrypoint still supervising the expected child?
- Did the container receive and forward termination signals correctly?

The process lifecycle should fail visibly. Keeping a wrapper process alive after Tor dies makes the container look healthier than it is.

### Layer 3: Bootstrap and local state

Questions:

- Has Tor reached 100 percent bootstrap?
- What errors or warnings appear in the recent log?
- Which relay mode and image version are running?
- Which fingerprint did this instance load?

tor-guard-relay exposes this through the human-readable `status` tool and JSON `health` output:

```sh
docker exec tor-relay status
docker exec tor-relay health
```

JSON is useful here because monitoring can consume fields without parsing decorative terminal output.

The current bootstrap and ORPort self-test fields are derived from Tor's logs. They describe what Tor reported locally, not the result of a new external probe.

A monitoring payload can therefore be useful without being treated as complete proof:

```json
{
  "status": "up",
  "bootstrap": 100,
  "reachable": "true",
  "fingerprint": "...",
  "config_source": "environment"
}
```

### Layer 4: External reachability

Questions:

- Can another system reach the advertised ORPort?
- Does IPv6 work independently of IPv4?
- Did a firewall, provider ACL, route, or tunnel change?

This check should run outside the host. A server testing its own socket does not prove that the public path works.

### Layer 5: Network observation

For public relays:

- Does Onionoo see the fingerprint?
- Is the relay running?
- Which consensus flags are present?
- When was it first and last seen?

For bridges, public consensus visibility is intentionally unavailable. Monitoring must respect that difference instead of publishing bridge identifiers or addresses.

## Avoid restart loops that erase evidence

Automatic recovery can reduce downtime, but it can also turn a clear failure into a repeating one.

Before restarting, preserve enough evidence to answer:

- What failed?
- Which configuration source was active?
- Which image version was running?
- Did the failure begin after a host or network change?
- Has the same restart already failed?

If bounded process restarts are required, Docker supports `on-failure:N`, while an orchestrator can enforce its own retry and backoff limits. `unless-stopped` is intentionally unbounded for process exits. Whichever policy is used, alerting and preserved evidence matter because an expired account, blocked provider port, missing IPv6 route, corrupted volume, or incorrect ownership cannot be repaired inside the container.

| Signal | System responsible for acting |
| --- | --- |
| Tor process exits | Docker restart policy or orchestrator |
| Container becomes unhealthy | Monitoring or orchestrator |
| Bootstrap stalls | Operator alert and log investigation |
| Tor reports a failed ORPort self-test | Network and firewall investigation |
| External ORPort probe fails | Host, routing, firewall, or provider investigation |
| Public relay disappears from Onionoo | Operator investigation after allowing for publication delay |

## Design checks for failure, not optimism

A useful health check should:

1. Test one clearly documented contract.
2. Finish quickly and predictably.
3. Avoid changing state.
4. Run with the same permissions as the workload when practical.
5. Produce a meaningful failure message.
6. Avoid external dependencies in the innermost check.
7. Expose richer state separately for monitoring.

It should not return success because a PID exists, repair the system while pretending to observe it, or hide uncertainty behind a single “healthy” label.

The goal is not to make every indicator green. The goal is to make every failure understandable enough that the right system can respond.

## What these checks do not prove

A valid configuration does not prove reachability. A running process does not prove bootstrap. A local self-test does not prove every public route works. Onionoo visibility does not prove that backups can restore the same identity.

Health reporting becomes trustworthy when each signal keeps its narrow meaning and the system responsible for acting on it is documented.

## References

- [tor-guard-relay monitoring guide](https://web.archive.org/web/20260514132423/https://github.com/r3bo0tbx1/tor-guard-relay/blob/main/docs/MONITORING.md)
- [tor-guard-relay health check](https://github.com/r3bo0tbx1/tor-guard-relay/blob/main/healthcheck.sh)
- [Dockerfile `HEALTHCHECK` reference](https://web.archive.org/web/20260716140130/https://docs.docker.com/reference/dockerfile/#healthcheck)
- [Docker restart policies](https://web.archive.org/web/20260706103641/https://docs.docker.com/engine/containers/start-containers-automatically/)
