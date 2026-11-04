# Br🤖ken B🤖tnet

Security research, privacy, open-source infrastructure, and the Tor network.

[![Build](https://img.shields.io/github/actions/workflow/status/BrokenBotnet/brokenbotnet.github.io/validate.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=Build&labelColor=0a0a0a)](https://github.com/BrokenBotnet/brokenbotnet.github.io/actions/workflows/validate.yml)
[![Deploy](https://img.shields.io/github/actions/workflow/status/BrokenBotnet/brokenbotnet.github.io/deploy.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=Deploy&labelColor=0a0a0a)](https://github.com/BrokenBotnet/brokenbotnet.github.io/actions/workflows/deploy.yml)
[![Links](https://img.shields.io/github/actions/workflow/status/BrokenBotnet/brokenbotnet.github.io/links.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=Links&labelColor=0a0a0a)](https://github.com/BrokenBotnet/brokenbotnet.github.io/actions/workflows/links.yml)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fbrokenbotnet.com&style=for-the-badge&label=Website&labelColor=0a0a0a&up_color=4ade80&down_color=f85149&up_message=Online&down_message=Offline&logo=torbrowser&logoColor=white)](https://brokenbotnet.com/)
[![License](https://img.shields.io/badge/License-MIT-f1c40f?style=for-the-badge&logo=opensourceinitiative&logoColor=white&labelColor=0a0a0a)](LICENSE)
[![Donate](https://img.shields.io/badge/Donate-Support%20the%20Project-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white&labelColor=0a0a0a)](https://brokenbotnet.com/donate/)

Built with [Hugo Extended](https://gohugo.io/) and a customized [risotto](https://github.com/joeroe/risotto) theme. Published on GitHub Pages and mirrored over Tor with Web2Onion.

## Local preview

Install Hugo Extended, then run from the repository root:

```sh
git submodule update --init --recursive
hugo server --baseURL http://127.0.0.1:1313/ --environment production --disableFastRender --disableLiveReload
```

Open [localhost:1313](http://127.0.0.1:1313/), or visit `/nojs/` for the version without JavaScript. Live reload is disabled so it won't inject scripts into No-JS pages; refresh manually after edits.

## Themes

Choose **BrokenBotnet**, **Gruvbox Dark**, or **Daylight** from the footer. To change the site's default, set `params.theme.palette` in `hugo.toml` to `brokenbotnet`, `gruvbox-dark`, or `daylight`.

Theme choices are saved separately for each domain when browser storage is available. On No-JS pages, choices apply to the current page and require CSS `:has()` support. The relay background toggle is available on supported desktop pages.

## Validation

Run with Node.js and Hugo Extended installed:

```sh
node --test scripts/theme.test.mjs
hugo --gc --minify --panicOnWarning
node scripts/audit-client-security.mjs
node scripts/audit-theme-output.mjs
git diff --check
```

Before publishing, check a few pages on desktop and mobile, including an article, `/nojs/`, and `/404.html`. Try the theme selector with a keyboard. GitHub Actions also runs HTML, SEO, Lighthouse, and link checks.

## Project statistics

GitHub Pages and Web2Onion use the same committed [`data/project_stats.json`](data/project_stats.json). The [statistics workflow](.github/workflows/stats.yml) handles refreshes; local previews use the existing data.

CI validates the snapshot without fetching or writing data. Leave `--refresh` to the dedicated workflow.

## Projects

- [Tor Guard Relay](https://github.com/r3bo0tbx1/tor-guard-relay) - a hardened container and operational toolkit for Tor relays and bridges.
- [Shinobi Relays](https://relays.brokenbotnet.com/) - a public dashboard for the Tor infrastructure I operate.

## Credits and license

Gruvbox colors are adapted from [morhetz/gruvbox](https://github.com/morhetz/gruvbox). Icons include work from [Lucide](https://lucide.dev/), [Lucide Lab](https://github.com/lucide-icons/lucide-lab), and [Simple Icons](https://simpleicons.org/). Their [Lucide](static/icons/LICENSE-lucide.txt) and [Simple Icons](static/icons/LICENSE-simple-icons.md) license notices are included.

Original material is available under the MIT License. Third-party components retain their own licenses.
