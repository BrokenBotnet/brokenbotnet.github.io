# 🛡️ Security policy

## Supported versions

This policy covers the current `main` branch and the site deployed at [brokenbotnet.com](https://brokenbotnet.com/).

| Version | Supported |
| --- | --- |
| Current `main` branch | Yes |
| Current deployment | Yes |
| Older commits, forks, and local modifications | No |

## Scope

Reports are welcome for vulnerabilities in this repository, including its Hugo templates, client-side JavaScript, configuration, and GitHub Actions workflows.

The following projects maintain their own issue trackers and should be reported separately:

- [Tor Guard Relay](https://github.com/r3bo0tbx1/tor-guard-relay)
- [Shinobi Relays](https://github.com/r3bo0tbx1/shinobi-relays)

Vulnerabilities in Hugo, the risotto theme, GitHub Pages, or another third-party service should be reported to the relevant upstream project unless this repository's integration creates the issue. Broken links, content corrections, and general suggestions may be reported through a normal public issue.

## Reporting a vulnerability

Do not open a public issue or pull request for a suspected vulnerability. Email [r3bo0tbx1@brokenbotnet.com](mailto:r3bo0tbx1@brokenbotnet.com). Sensitive reports should be encrypted with the published [OpenPGP key](https://keys.openpgp.org/vks/v1/by-fingerprint/33727F5377D296C320AF704AB3BD6196E1CFBFB4).

- **Fingerprint:** `3372 7F53 77D2 96C3 20AF 704A B3BD 6196 E1CF BFB4`
- **Key ID:** `B3BD6196E1CFBFB4`

Please include:

- A clear description of the issue and its impact.
- The affected page, file, workflow, or component.
- Reproduction steps or a minimal proof of concept.
- Any conditions required to trigger the issue.
- A suggested fix, if you have one.

I aim to acknowledge a report within five business days. Remediation time depends on severity, complexity, and affected upstream services. Please allow time to investigate and coordinate a fix before publishing details.

## Safe testing

Please avoid privacy violations, social engineering, denial-of-service testing, high-volume automated scanning, or testing against third-party infrastructure. Use accounts and data you own, and stop testing if you gain access to information that is not yours.

This project does not currently operate a paid vulnerability reward program.

## Security practices

- The deployed site is static and has no backend, account system, forms, or user-data storage.
- GitHub Actions builds an ephemeral Pages artifact and does not commit generated output to the repository.
- Workflow permissions are limited by job, with deployment access granted only to the Pages deployment job.
- Pages deployment uses a job-scoped GitHub token and OpenID Connect identity. Matrix notification credentials are stored as GitHub Actions secrets.
- Pull requests build and validate the complete site before deployment.
- Renovate proposes updates for the Hugo theme submodule and GitHub Actions.

Thank you for reporting security issues responsibly.
