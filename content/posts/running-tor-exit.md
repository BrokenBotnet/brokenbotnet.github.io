---
title: "The Responsibilities of Running a Tor Exit"
seo_title: "The Operational Responsibilities of Running a Tor Exit Relay"
date: 2025-12-15
lastmod: 2026-07-12
slug: "running-tor-exit"
aliases:
  - "/2026/05/30/responsibilities-running-tor-exit/"
  - "/2026/07/13/responsibilities-running-tor-exit/"
description: "What changes when a relay becomes the final hop to the public Internet, from provider consent and exit policy to abuse handling and DNS."
summary: "An Exit contributes uniquely valuable capacity, but it also becomes the address destinations see. Running one requires transparency, provider support, deliberate policy, and an abuse process."
image: "images/posts/running-tor-exit/running-tor-exit.jpg"
image_alt: "A Tor Exit connecting anonymous users to public services while enforcing policy and operational safeguards"
thumbnail: "images/posts/running-tor-exit/running-tor-exit.jpg"
thumbnail_anchor: "Center"
tags: ["tor", "exit-relay", "operations", "abuse-handling", "privacy"]
toc: true
draft: false
---

A middle relay forwards encrypted Tor traffic between other relays. An Exit is different: it is the final hop from the Tor network to a destination on the public Internet.

The destination sees the Exit's address, not the user's address. That is the privacy property the role provides, and it is also the source of the operator's responsibility. Complaints, automated blocks, and questions about traffic arrive at the Exit address.

Running an Exit is not only a configuration change.

{{< post-figure src="images/posts/running-tor-exit/running-tor-exit.jpg" alt="A Tor Exit connecting anonymous users to public services while enforcing policy and operational safeguards" class="post-figure--wide" >}}
An Exit sits at the boundary between Tor users and the public Internet, where technical policy, provider relationships, abuse handling, and reliability meet.
{{< /post-figure >}}

## Provider consent comes first

The cheapest server is not useful if the provider prohibits Exit traffic or closes the account after the first complaint.

Before deployment I want clear answers to:

- Does the provider explicitly allow Tor Exits?
- Are abuse reports forwarded instead of treated as automatic termination?
- Can reverse DNS identify the address as a Tor Exit?
- Can the server use a dedicated address?
- Does the provider understand that the operator is not the origin of relayed traffic?
- Which jurisdictions govern the server, provider, and operator?

The Tor legal FAQ recommends informing the ISP and being transparent about the role.[^legal-faq] Provider support is part of the design, not paperwork to revisit after deployment.

## Separate the Exit from personal services

The Tor Project recommends a dedicated server and address for an Exit.[^exit-setup] I do not want my personal mail, websites, administrative traffic, or unrelated infrastructure sharing the address destinations associate with Tor traffic.

Separation improves both explanation and containment. Reverse DNS, WHOIS information where available, an Exit notice, and contact records can all describe one purpose consistently.

The hostname should make the role obvious without pretending to be owned by the Tor Project. An informative PTR such as `tor-exit` helps an investigator understand the address before escalating a complaint.

## My Exit policy is deliberately selective

An exit policy defines which destination ports a relay will carry. It is not a decorative configuration block. It is a public statement about the traffic an operator is prepared to support and the operational exposure they are prepared to handle.

My Exit is `ShinobiKenshin`, fingerprint `64CE119D87F0A28F31D74280FB9675D880CA4BFA`. Its published policy and network state are visible through both [1AEO Metrics][shinobi-1aeo] and [Tor Relay Search][shinobi-tor-metrics]. I checked the public descriptor against this article on 13 July 2026. The allowlist reflects the services I am prepared to support after operating the relay, not a generic policy copied into production.

The policy first rejects private, loopback, link-local, relay-owned, and explicitly protected infrastructure addresses. This prevents the Exit from being used to reach its own host, local networks, or other addresses that should never be destinations through it. Only then does the public allowlist begin:

```text
ExitPolicy accept *:20-21
ExitPolicy accept *:43
ExitPolicy accept *:53
ExitPolicy accept *:80-81
ExitPolicy accept *:443
ExitPolicy accept *:5222-5223
ExitPolicy accept *:6667-7000
ExitPolicy accept *:8008
ExitPolicy accept *:8082
ExitPolicy accept *:8332-8333
ExitPolicy accept *:8888
ExitPolicy accept *:9418
ExitPolicy accept *:18080-18081
ExitPolicy accept *:50002
ExitPolicy accept *:64738
ExitPolicy reject *:*
```

The allowlist keeps the Exit useful for more than ordinary web browsing while avoiding an unrestricted policy:

| Ports | Common use represented in the policy |
|---|---|
| `20-21`, `43`, `53` | FTP, WHOIS, and TCP connections to destination port 53 |
| `80-81`, `443`, `8008`, `8082`, `8888` | Web and selected alternative application ports |
| `5222-5223` | XMPP messaging |
| `6667-7000` | Common IRC ports and a broader surrounding range that can contain unrelated services |
| `8332`, `8333` | Common Bitcoin JSON-RPC and peer-to-peer ports, respectively |
| `9418` | Git protocol |
| `18080`, `18081` | Common Monero peer-to-peer and RPC ports, respectively |
| `50002` | Electrum over TLS |
| `64738` | Mumble voice communication |

Ports such as SMTP submission and SSH are not accepted. Everything outside the allowlist reaches the final `reject *:*`. That boundary reduces unnecessary abuse exposure without reducing the Exit to HTTPS alone. Port numbers describe the services these rules are intended to support, although a port number by itself cannot prove which application protocol a destination is running.

I block direct email delivery and submission ports deliberately, including SMTP on `25` and message submission over `465` and `587`. The final reject also blocks direct POP3 and IMAP access on `110`, `143`, `993`, and `995`. Allowing those protocols would increase exposure to spam, credential abuse, account takeover attempts, mail blocklists, and a disproportionate number of provider complaints. That risk could threaten the long-term operation of the Exit while adding little value for people who can still use webmail securely over HTTPS. I cannot identify or judge the person behind any Tor circuit, so the boundary is enforced consistently at the port level. It is an operational decision intended to keep the relay sustainable, not an attempt to inspect or control individual users.

The policy has become more explicit as the relay has operated. Web access and selected communication, development, and peer-to-peer services remain available, while direct mail protocols and administrative access remain outside the boundary. I verify the policy from the public descriptor because the network's published view matters more than the local file alone.

The important part is not that every Exit should copy my list. Operators have different providers, jurisdictions, capacity, and tolerance for abuse handling. The lesson is that a policy should be intentional, documented, locally protected, and verifiable from the public relay descriptor.

tor-guard-relay can express the same model through `TOR_EXIT_POLICY`, allowing a container deployment to use an explicit comma-separated allowlist followed by a final reject. The deployed policy and the reusable project therefore follow the same principle: make the permitted traffic visible rather than relying on an unexplained default.

## Publish an Exit notice

An Exit notice should explain:

- The address operates a Tor Exit relay.
- The operator is not the origin of individual connections.
- Tor is an anonymity network used by many unrelated people.
- Where abuse contacts can learn more or reach the operator.

My public [Tor Exit notice](https://tor-exit.brokenbotnet.com/) provides that context for ShinobiKenshin. It identifies the server as an Exit, publishes the relay details, explains what the operator can and cannot determine, and tells abuse contacts which information makes a report actionable.

The notice is not a shield against every complaint. It is a fast path from an unfamiliar IP address to an accurate explanation. Reverse DNS and provider records should reinforce the same message.

## Build an abuse process before the first report

An abuse mailbox that nobody monitors is worse than a documented process.

I want a prepared response that is factual and calm:

1. Confirm that the address is a Tor Exit.
2. Explain that the reported source address belongs to a relay used by many people.
3. Avoid claiming knowledge about the user or traffic that the relay does not have.
4. Link to Tor Project material that explains the network.
5. Preserve the complaint and response for operational records.
6. Escalate legal requests to qualified counsel rather than improvising.

This is not legal advice. Laws and practical risk vary by jurisdiction. An operator who is not prepared for that uncertainty should run a bridge or non-exit relay instead.

## DNS becomes part of Exit health

Exits perform DNS resolution for Tor clients. A relay can have available bandwidth and still provide poor service because its resolver is slow, blocked, or unreliable.

The same Exit setup guidance recommends monitoring DNS timeout behavior on larger Exits and considering resolver features such as DNSSEC validation and QNAME minimization. Resolver addresses and outbound interfaces also deserve attention because blocks affecting Tor addresses can indirectly affect DNS availability.

DNS is not an optional side service. It is part of the Exit's user-facing reliability.

Allowing connections to destination port `53` in the Exit policy is separate from this resolver responsibility. The policy controls which TCP destinations users may reach through the Exit; the Exit's resolver handles DNS requests made on behalf of Tor clients.

## Do not inspect the traffic

Operating an Exit does not justify observing or modifying user traffic. Tor's expectations for relay operators are direct: do not look at or alter network traffic, do not expose user or destination information, keep safe logging enabled, and avoid publishing fine-grained statistics that could harm users.[^operator-expectations]

Monitoring should answer operational questions such as process state, reachability, aggregate capacity, and DNS errors. It should not become surveillance of the people the relay exists to protect.

{{< post-figure src="images/posts/running-tor-exit/shinobikenshin-nyx-bandwidth.png" alt="Nyx monitoring ShinobiKenshin with aggregate bandwidth, uptime, consensus flags, fingerprint, and exit policy" class="post-figure--wide" >}}
Nyx shows the relay's aggregate bandwidth, uptime, consensus flags, fingerprint, and published Exit policy. It provides operational visibility without identifying users or their destinations.
{{< /post-figure >}}

## Reputation reports need context

Public reputation databases are useful operational signals, but they are not attribution systems. A captured AbuseIPDB result for an earlier ShinobiKenshin address, `172.234.92.148`, recorded 15 reports and a 30% confidence score. The same result recognized the address as a Tor Exit and explained that neither the owner nor the provider was directly behind the reported action.

{{< post-figure src="images/posts/running-tor-exit/historical-exit-abuseipdb-report.png" alt="AbuseIPDB result for 172.234.92.148 showing fifteen reports, a thirty percent confidence score, and recognition that the address was a Tor Exit" >}}
An Exit address can accumulate reports because many unrelated users share it. The report is evidence about the address's observed reputation at that time, not proof that the relay host or operator originated the traffic.
{{< /post-figure >}}

The result can also vary between addresses and databases. The [Spamhaus reputation check for `157.10.253.140`](https://check.spamhaus.org/results?query=157.10.253.140) reports no issues. Neither a clean result nor a set of reports is permanent. Listings change, databases measure different things, and an operator still needs to investigate host health, confirm that Tor remains the only public purpose of the address, and give providers accurate context when a complaint arrives.

## Expect lifecycle and reputation to take time

A new Exit does not instantly become equivalent to a long-running one. An accepted Tor policy proposes a configurable four-day staging phase intended to increase the cost of deploying malicious Exits. The precise technical implementation is still expected in a follow-up specification.[^exit-lifecycle]

That reinforces a broader operational point: continuity matters. Stable identity, predictable uptime, correct contact information, and transparent operation build value that cannot be reproduced by rapidly replacing instances.

## The role is responsibility made visible

Exit capacity is necessary because circuits reaching the public Internet need a final hop. Onion-service circuits remain inside the Tor network and do not use an Exit. The role is valuable precisely because it accepts exposure on behalf of users who should not have to reveal themselves.

That contribution must be backed by provider consent, a deliberate policy, reliable DNS, transparent notices, careful monitoring, and an abuse process that exists before it is needed. The configuration line is the smallest part of running an Exit.

## References

[^legal-faq]: Tor Project and Electronic Frontier Foundation, [“The Legal FAQ for Tor Relay Operators”](https://web.archive.org/web/20260619110525/https://community.torproject.org/relay/community-resources/eff-tor-legal-faq/).
[^exit-setup]: Tor Project, [“Exit Relay Setup”](https://web.archive.org/web/20260520221647/https://community.torproject.org/relay/setup/exit/).
[^operator-expectations]: Tor Project, [“Expectations for Relay Operators”](https://web.archive.org/web/20260529215252/https://community.torproject.org/policies/relays/expectations-for-relay-operators/).
[^exit-lifecycle]: Tor Project, [“Lifecycle of a Tor Exit”](https://web.archive.org/web/20260529215252/https://community.torproject.org/policies/relays/102-tor-exit-lifecycle/).

[shinobi-1aeo]: https://metrics.1aeo.com/relay/64CE119D87F0A28F31D74280FB9675D880CA4BFA/ "ShinobiKenshin on 1AEO Metrics"
[shinobi-tor-metrics]: https://metrics.torproject.org/rs.html#details/64CE119D87F0A28F31D74280FB9675D880CA4BFA "ShinobiKenshin on Tor Relay Search"
