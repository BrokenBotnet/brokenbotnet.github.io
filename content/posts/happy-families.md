---
title: "Moving From MyFamily to Happy Families"
seo_title: "Migrating Tor Relays From MyFamily to Happy Families"
date: 2026-03-02
lastmod: 2026-07-14
slug: "happy-families"
aliases:
  - "/2026/02/08/myfamily-to-happy-families/"
  - "/2026/07/13/myfamily-to-happy-families/"
description: "How Tor's key-based Happy Families design replaces fragile fingerprint lists and how to migrate without losing family integrity."
summary: "MyFamily made every relay repeat the same growing fingerprint list. Happy Families replaces that bookkeeping with a shared cryptographic family identity."
image: "images/posts/happy-families/happy-families.jpg"
image_alt: "Fingerprint lists replaced by a shared cryptographic family key connecting several Tor relays"
thumbnail: "images/posts/happy-families/happy-families.jpg"
thumbnail_anchor: "Right"
tags: ["tor", "relay", "happy-families", "operations", "cryptography"]
toc: true
draft: false
---

Running one Tor relay does not require family metadata. Running several under one operator does.

Tor clients must avoid selecting relays controlled by the same operator for multiple positions in one circuit. Family declarations give the network the information needed to make that decision.

For years, operators expressed that relationship with `MyFamily`. Every relay listed the fingerprints of the other relays it belonged with. It worked, but the operational cost grew with the fleet.

{{< post-figure src="images/posts/happy-families/happy-families.jpg" alt="Fingerprint lists replaced by a shared cryptographic family key connecting several Tor relays" class="post-figure--wide" >}}
Happy Families replaces repeated fingerprint bookkeeping with a shared, cryptographically verifiable family identity.
{{< /post-figure >}}

## Why MyFamily became fragile

Adding one relay meant updating every other relay. Removing one meant doing the same work again. A missing fingerprint or stale configuration could leave the family only partly declared.

The scaling problem also affected directory data. Tor proposal 321 describes how fingerprint lists grow quadratically and consume a significant portion of relay descriptors.[^proposal-321]

The operational problem was simpler: a family should be one identity, not many copies of a list that must remain identical.

## What Happy Families changes

Happy Families introduces a cryptographic family key. Each participating relay proves membership using that family identity, and the configuration contains a `FamilyId` derived from the key.

For operators, this requires Tor 0.4.9.2-alpha or later. The generated `FamilyId` is base64, not an uppercase base32 fingerprint. Lowercase letters and characters such as `/` can be valid parts of the value.[^family-id-guide]

The relationship is no longer “these are all the fingerprints I remembered to list.” It becomes “this relay possesses the key material for this family and publishes a verifiable certificate.”

This removes most fingerprint bookkeeping, but it introduces a secret that must be protected correctly.

## Treat the family key like identity material

The `.secret_family_key` file belongs with the relay identity backups, not in a public repository or ordinary configuration-management variable.

Every participating relay needs the same family key and the matching `FamilyId`. Losing that key means generating a new family identity and coordinating the replacement across the fleet. Leaking it creates a different problem: someone with the key may be able to claim membership in the family.

My rules are:

1. Generate the key once.
2. Keep an offline backup.
3. Transfer it through a protected channel.
4. Store it with restrictive ownership and permissions.
5. Record which relays received it.
6. Verify the published family state after rollout.

## Generating the key in tor-guard-relay

The container includes a `gen-family` helper around Tor's key-generation command:

```sh
docker exec tor-relay gen-family MyRelays
```

The tool prints the `FamilyId` line and the path to the generated key. The persistent key lives under the Tor data directory:

```text
/var/lib/tor/keys/MyRelays.secret_family_key
```

Extract it for protected transfer and backup:

```sh
docker cp tor-relay:/var/lib/tor/keys/MyRelays.secret_family_key ./MyRelays.secret_family_key
```

The destination relay needs the key inside its own persistent Tor data volume. File ownership must match the Tor user in the container.

`gen-family --show` displays the local key files and configured `FamilyId`. It is an inspection aid, not an independent cryptographic proof that a manually entered value was derived from the displayed secret key.

## A staged migration

I prefer a staged change over replacing the entire fleet at once.

### 1. Inventory the existing family

Record every public relay fingerprint and confirm that the current `MyFamily` declarations agree. Migration should not preserve an already broken family configuration.

### 2. Back up identities and configuration

Back up each relay's identity keys, its effective `torrc`, and the newly generated family key. Test that the archives contain the expected files before changing anything.

### 3. Distribute the family key

Place the same key on each participating relay with the correct path, owner, group, and mode. Filesystem conventions differ outside the container, especially across Linux, BSD, and SunOS hosts.

### 4. Add the FamilyId

Add the exact generated line to every participating relay:

```torrc
FamilyId <generated-family-id>
```

The key filename and `FamilyId` must describe the same family.

### 5. Keep MyFamily during transition

tor-guard-relay can keep both declarations in a mounted `torrc` or generate them from `TOR_FAMILY_ID` and `TOR_MY_FAMILY`. `TOR_FAMILY_ID` accepts Tor's exact 43-character unpadded base64 value. Removing the old declaration too early is less useful than carrying both for the period recommended by the Tor Project.

### 6. Verify before continuing

Restart one relay, inspect its logs, and check the local state:

```sh
docker exec tor-relay gen-family --show
docker exec tor-relay status
```

Then verify what the network publishes before proceeding to the next relay. The server descriptor should contain `family-cert`, and Onionoo or microdescriptor data should expose the expected `family_ids`. A successful process restart is not proof that the family certificate reached the network correctly.

### 7. Rotate keys without splitting the family

Family-key rotation is another staged operation:

1. Generate the replacement key.
2. Add the new `FamilyId` alongside the old one on every participating relay.
3. Wait several days for descriptors and directory data to propagate.
4. Confirm that both identities appear as expected across the fleet.
5. Remove the old identity only after propagation and verification finish.

Multiple `FamilyId` lines during this overlap are intentional. Replacing the old identity everywhere at once would create an avoidable period in which relays disagree about family membership.[^family-id-guide]

## Failure modes worth planning for

- **A different key on one relay:** the `FamilyId` may look valid while the relay belongs to another cryptographic family.
- **Incorrect ownership:** Tor cannot read the key, even though it exists at the expected path.
- **An ephemeral container path:** the key disappears during replacement because it was never stored in the persistent volume.
- **A forced overwrite:** replacing the family key requires coordinated redistribution to every relay.
- **Partial rollout:** the fleet temporarily contains legacy-only and Happy-Family members, which makes careful verification important.
- **Unverified local display:** `gen-family --show` can confirm what is present on disk without proving that every published certificate matches it.

## Better than a shorter configuration

The main benefit is not that `FamilyId` is shorter than a list of fingerprints. It changes family membership from repeated operator bookkeeping into a verifiable identity.

That reduces descriptor growth and removes a class of configuration drift. It also raises the importance of key handling. Happy Families is easier to maintain only when the family key receives the same care as the relay identities it connects.

## References

[^proposal-321]: Tor Project, [“Proposal 321: Better Performance and Usability for the MyFamily Option”](https://web.archive.org/web/20260623145223/https://spec.torproject.org/proposals/321-happy-families.html).
[^family-id-guide]: Tor Project, [“Relay Family IDs”](https://web.archive.org/web/20260515152914/https://community.torproject.org/relay/setup/post-install/family-ids/).
