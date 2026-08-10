---
title: "Building Web2Onion-dev/beta: Treating Onion Mirrors as Deployments"
seo_title: "Web2Onion-dev/beta: Building Reliable Static Onion Mirrors"
date: 2026-08-10
lastmod: 2026-08-10
slug: "web2onion"
description: "Why I built Web2Onion-dev/beta, what it does for my static onion mirrors, what I am testing next, and why the source remains private for now."
summary: "Serving a static site through Tor is the easy part. Keeping its onion mirror synchronized, verifiable, recoverable, and under operator control is the problem Web2Onion-dev/beta is meant to solve."
image: "images/posts/web2onion/web2onion.jpg"
image_alt: "Web2Onion deployment pipeline from static source through validation and operator control to an onion mirror with rollback releases"
thumbnail: "images/posts/web2onion/web2onion.jpg"
thumbnail_anchor: "Center"
tags: ["tor", "onion-service", "operations", "automation", "self-hosting", "privacy"]
toc: true
draft: false
---

Serving a static website through Tor is easy. Operating the mirror like infrastructure is not.

An onion service can be online while serving the wrong build. A deployment can finish while stale clearnet URLs remain in generated output. A source update can succeed on the public site while the onion side stays behind. A rollback is not useful if the previous release cannot be identified and trusted.

Those were the problems that turned into `Web2Onion-dev/beta`.

It is the private tooling I currently use around my own static onion mirrors. The goal is not simply to copy a website behind an `.onion` address. I want the onion build to come from known source state, make only the transformations I intended, become active as a complete release, and leave enough evidence to understand what happened if something goes wrong.

{{< post-figure src="images/posts/web2onion/web2onion.jpg" alt="Web2Onion deployment pipeline from static source through validation and operator control to an onion mirror with rollback releases" class="post-figure--wide" >}}
Web2Onion-dev/beta treats the onion mirror as its own controlled deployment: source, build, validation, activation, and recovery are separate steps instead of one large copy operation.
{{< /post-figure >}}

## The mirror is its own build

The first useful distinction is that an onion mirror is not necessarily the clearnet build served through another hostname.

Broken Botnet contains links between the main site, the relay site, Tor Project services, archives, keys, signed statements, normal pages, and no-JavaScript pages. Some of those should have onion equivalents. Some should remain exactly as they were generated.

That means onionization needs context.

An ordinary URL inside generated page content can be a legitimate transformation target. The same bytes inside a signed statement are different. Changing them would not improve the mirror; it would break the artifact.

`Web2Onion-dev/beta` therefore separates build-time onionization from request-time presentation and keeps the transformation policy separate from the deployment engine itself.

That boundary matters to me more than replacing every visible clearnet URL.

The goal is an onion build whose differences are intentional and explainable.

## A build should become a release

I also did not want production to be a directory that slowly changes underneath the web server.

A Web2Onion deployment creates a release, validates it, and only then makes that release current. The previous release remains useful as a recovery point instead of being overwritten by the new one.

That makes several questions easier to answer:

- Which source state produced what is being served?
- Did the onion-specific build complete?
- Which release is active?
- Is there an older release that can still be used?
- If validation fails after a deployment, can the previous known state be restored?

A rollback therefore means activating an already-built eligible release. It does not mean rebuilding yesterday's site and hoping the result is equivalent.

The onion identity is outside that lifecycle. Deployment, pruning, rollback, updates, and maintenance are not allowed to casually replace or delete it.

A website release is disposable. An onion identity is not.

## Synchronization is not deployment

Another boundary is the difference between receiving new source and changing production.

`Web2Onion-dev/beta` can synchronize the source repositories it is responsible for, compare them with the active release, and decide that nothing needs to happen.

That no-op case matters.

If the source state already matches production, an automated reconciliation should be able to say so and stop. A scheduled job existing is not a reason to create another release.

When something did change, synchronization still does not become proof that the mirror is healthy. The resulting build has its own validation, activation, route testing, and recovery path.

This is the same problem I have written about with relay monitoring: one successful layer should not be promoted into proof of every layer above it.

## Automation needs somewhere to stop

I want the mirrors to follow source changes without requiring me to manually rebuild them every time. I do not want that convenience to turn a GitHub workflow into unrestricted authority over the server.

The public Broken Botnet deployment workflow shows part of that separation.

After the normal GitHub Pages deployment, it has a separate [**Request onion mirror rebuild**](https://github.com/BrokenBotnet/brokenbotnet.github.io/blob/9303b540d9abe7c29560659fb117256fe8f79951/.github/workflows/deploy.yml#L94) job.[^deploy-handoff]

The wording is intentional: **request**.

The public repository can say that a source deployment completed and ask the private Web2Onion side to reconcile the onion mirrors. It does not get to assume that a production mutation should happen.

The private side still has its own validation and operator-controlled gates. It can determine that the source is already current, refuse work while the system is deliberately frozen, or stop when the state it expects cannot be proved.

Automation should remove repetition. It should not remove the boundary where uncertainty becomes an operator problem.

## The beta has left public traces

`Web2Onion-dev/beta` is private, but its existence is not supposed to be a secret.

There are already a few traces in the public Broken Botnet repository.

Commit [`fe2ba7a`](https://github.com/BrokenBotnet/brokenbotnet.github.io/commit/fe2ba7a674c525962f878a02df2f4d96ae5725b7) added a small `WEB2ONION-PHASE11G.md` marker during a controlled deployment and rollback drill.[^phase11g]

The public deployment workflow contains the onion rebuild handoff described above.

The corresponding [GitHub Actions job](https://github.com/BrokenBotnet/brokenbotnet.github.io/actions/runs/31334576861/job/93298293665) from 9 August 2026 shows `Request onion mirror rebuild` succeeding.[^onion-job]

That last result has a narrow meaning.

It proves that the public side of the handoff successfully requested a rebuild. It does not expose the private repository, and it does not by itself prove that every server-side deployment, validation, and route check completed afterward.

The private deployment records cover that side of the system. I am deliberately not publishing the host configuration, authorization details, identities, trust material, or other information that would turn an article about the project into documentation of the production boundary.

There is enough public evidence to show that `Web2Onion-dev/beta` exists and is being exercised against real infrastructure.

That is enough for now.

## Recovery is part of the design

Successful deployments are the easy tests.

Most of the work in `Web2Onion-dev/beta` has ended up around what happens when something is interrupted, stale, already running, partially changed, or simply wrong.

The project keeps deployment verification and rollback close together for that reason. Release retention is not only about saving disk space. Before old releases disappear, I want a recovery path that does not depend on recreating them later.

Maintenance is another part of that boundary.

There are times when I want automated deployment and updates to stop while I inspect or change the system. A maintenance state gives me one place to freeze those mutation paths and later restore only the runtime state that was active before the work began.

That sounds less exciting than deploying an onion mirror.

It is also the part I trust more.

An automated system is easiest to understand when its stop conditions are designed as carefully as its success path.

## Why it is still closed source

The private repository is not a security control.

I do not want `Web2Onion-dev/beta` to depend on nobody knowing how it works. Authentication, validation, restricted inputs, release identity, rollback boundaries, filesystem permissions, and operator control still have to stand on their own.

I am keeping the source private because I still consider the project a development and beta system.

Real use has already changed the design several times. Things that looked correct as isolated operations behaved differently when deployment, retention, maintenance, updates, validation, and recovery met each other on a real host.

That is exactly why I am testing it on infrastructure I operate before presenting it as something another operator should depend on.

There is also still a difference between the reusable Web2Onion engine and my own environment.

Today the project knows about the source and deployment model I actually use. Site-specific URL policy has already been separated from the software, but general multi-site operation is still later work.

I would rather keep that limitation explicit than hide it behind a generic configuration file and call the project finished.

Publishing source also creates another kind of commitment. Once other people build production automation around an interface, changing that interface becomes an operational problem for them too.

Before I am comfortable with that, I want the boring parts to be boring:

1. Installation and removal.
2. Upgrades.
3. Reboots.
4. Failed and interrupted deployments.
5. Release retention.
6. Rollback.
7. Diagnostics.
8. Evidence retention.
9. Configuration changes.
10. Documentation that still matches the code after all of the above change.

A repository becoming public should not be the moment those questions start getting answered.

## What comes next

The near-term work is mostly about making the existing system easier to inspect and harder to misunderstand.

I want better deployment and update history, clearer retained evidence, more machine-readable output for read-only commands, and more testing that deliberately interrupts recovery paths instead of only proving the happy path.

Reboot testing matters too. A system can behave perfectly for months and still have the wrong assumptions about what survives a restart.

After that, there are larger directions already in mind: general definitions for more than the current sites, multi-host or canary-style rollout, sources beyond the current GitHub model, cleaner external notification hooks, and eventually better replication and bootstrap support.

Those are later layers.

I do not want to solve ten-server orchestration before I trust one server to fail correctly.

Some things are also intentionally staying under operator control. Onion identity changes, private-key handling, final protected-evidence cleanup, security-baseline acceptance, and choosing a production rollback target are not decisions I want automation making casually.

More automation is not automatically better automation.

## What I want Web2Onion-dev/beta to become

I do not want `Web2Onion-dev/beta` to be clever.

I want it to become boring infrastructure.

A source change happens. The onion side notices. If nothing changed, nothing is deployed. If something changed, a new onion build is created from known source state. The transformations are explainable. The release is checked before and after activation. The previous state remains recoverable. The onion identity stays outside the blast radius.

And when the system cannot prove enough to continue safely, it stops.

That is the project I am testing now.

`Web2Onion-dev/beta` is already doing real work behind my onion mirrors, but the beta label is there for a reason. I would rather keep tightening those boundaries in private than publish something early and make other operators discover them for me.

## References

[^phase11g]: Broken Botnet, [`fe2ba7a`: Web2Onion Phase 11G deployment proof](https://github.com/BrokenBotnet/brokenbotnet.github.io/commit/fe2ba7a674c525962f878a02df2f4d96ae5725b7).

[^deploy-handoff]: Broken Botnet, [`deploy.yml`: Request onion mirror rebuild](https://github.com/BrokenBotnet/brokenbotnet.github.io/blob/9303b540d9abe7c29560659fb117256fe8f79951/.github/workflows/deploy.yml#L94).

[^onion-job]: Broken Botnet, [GitHub Actions job `93298293665`](https://github.com/BrokenBotnet/brokenbotnet.github.io/actions/runs/31334576861/job/93298293665).
