---
title: "Security and Vulnerability Disclosure"
date: 2026-08-02T00:00:00+09:00
lastmod: 2026-08-02T00:00:00+09:00
description: "How to report a vulnerability affecting brokenbotnet.com, including scope, safe-harbor terms, response targets, and coordinated disclosure."
---

## Contact

Report suspected vulnerabilities privately by emailing [r3bo0tbx1@brokenbotnet.com](mailto:r3bo0tbx1@brokenbotnet.com). Do not open a public issue or pull request for a vulnerability.

Sensitive reports should be encrypted with the published [OpenPGP key](https://brokenbotnet.com/0xB3BD6196E1CFBFB4.asc).

- **Fingerprint:** `3372 7F53 77D2 96C3 20AF 704A B3BD 6196 E1CF BFB4`
- **Key ID:** `B3BD6196E1CFBFB4`

Please include:

- A clear description of the issue and its security impact.
- The affected URL, file, workflow, or component.
- Reproduction steps or a minimal proof of concept.
- Any conditions required to trigger the issue.
- A suggested fix, if you have one.

## Scope

This policy covers:

- The current `main` branch of the [brokenbotnet.github.io repository](https://github.com/BrokenBotnet/brokenbotnet.github.io).
- The website deployed at [brokenbotnet.com](https://brokenbotnet.com/).
- Hugo templates, first-party CSS and JavaScript, site configuration, and GitHub Actions workflows maintained in that repository.

Older commits, forks, local modifications, and services or software operated by third parties are outside this policy. The following projects have separate repositories and should be reported through their own security or issue channels:

- [Tor Guard Relay](https://github.com/r3bo0tbx1/tor-guard-relay)
- [Shinobi Relays](https://github.com/r3bo0tbx1/shinobi-relays)

Vulnerabilities in Hugo, the risotto theme, GitHub Pages, Cloudflare, or another dependency should be reported to the relevant provider unless this site's integration created the vulnerability. Broken links, content corrections, and general suggestions may be reported through a normal public issue.

## Safe Testing and Safe Harbor

Security research conducted in good faith and in accordance with this policy is authorized. I will not initiate legal action against you for accidental, good-faith violations of this policy. If a third party initiates legal action related to compliant research, I will make it known that your work was conducted in accordance with this policy.

To remain within this safe harbor:

- Test only systems and code listed as in scope.
- Make a good-faith effort to avoid privacy violations, data destruction, service interruption, and harm to other people.
- Access only the minimum data needed to demonstrate the issue, stop immediately if you encounter personal or sensitive data, and report it without retaining or sharing it.
- Do not use social engineering, physical attacks, denial-of-service testing, high-volume automated scanning, spam, or attacks against third-party infrastructure.
- Do not exploit a vulnerability beyond what is necessary to confirm it.
- Report the issue promptly and keep it confidential while remediation is coordinated.
- Follow applicable law. This policy does not authorize activity against third-party systems or waive rights held by third parties.

If you are unsure whether planned testing is permitted, contact me before proceeding.

## Response and Coordinated Disclosure

I aim to:

- Acknowledge a report within five business days.
- Provide an initial assessment within ten business days.
- Share a status update at least every fifteen business days while a confirmed issue remains unresolved.

Remediation time depends on severity, complexity, and affected upstream services. Please allow up to 45 calendar days for investigation and remediation before public disclosure. A shorter or longer timeline may be agreed based on severity, active exploitation, or reliance on an upstream provider. If more time is needed, I will explain why and propose a revised disclosure date.

After the agreed disclosure date, you may publish your findings. Please remove personal or sensitive data and avoid publishing a working exploit that would place users at unnecessary risk. I may publish a security advisory or credit the reporter earlier with their permission.

## Rewards and Recognition

This project does not operate a paid bug bounty, offer swag, or guarantee public recognition. Any acknowledgment is optional and requires the reporter's consent.

## Security Practices

- The deployed site is static and has no backend, account system, forms, or user-data storage.
- GitHub Actions builds an ephemeral Pages artifact and does not commit generated output to the repository.
- Workflow permissions are limited by job, with deployment access granted only to the Pages deployment job.
- Pages deployment uses a job-scoped GitHub token and OpenID Connect identity. Notification credentials are stored as GitHub Actions secrets.
- Pull requests build and validate the complete site before deployment.
- Renovate proposes updates for the Hugo theme submodule and GitHub Actions.

Thank you for helping keep this project and its visitors safe.
