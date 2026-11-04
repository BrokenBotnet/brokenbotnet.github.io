# Br🤖ken B🤖tnet

[![Build](https://img.shields.io/github/actions/workflow/status/BrokenBotnet/brokenbotnet.github.io/validate.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=Build&labelColor=0a0a0a)](https://github.com/BrokenBotnet/brokenbotnet.github.io/actions/workflows/validate.yml)
[![Deploy](https://img.shields.io/github/actions/workflow/status/BrokenBotnet/brokenbotnet.github.io/deploy.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=Deploy&labelColor=0a0a0a)](https://github.com/BrokenBotnet/brokenbotnet.github.io/actions/workflows/deploy.yml)
[![Links](https://img.shields.io/github/actions/workflow/status/BrokenBotnet/brokenbotnet.github.io/links.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=Links&labelColor=0a0a0a)](https://github.com/BrokenBotnet/brokenbotnet.github.io/actions/workflows/links.yml)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fbrokenbotnet.com&style=for-the-badge&label=Website&labelColor=0a0a0a&up_color=4ade80&down_color=f85149&up_message=Online&down_message=Offline&logo=torbrowser&logoColor=white)](https://brokenbotnet.com/)
[![License](https://img.shields.io/badge/License-MIT-f1c40f?style=for-the-badge&logo=opensourceinitiative&logoColor=white&labelColor=0a0a0a)](LICENSE)
[![Donate](https://img.shields.io/badge/Donate-Support%20the%20Project-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white&labelColor=0a0a0a)](https://brokenbotnet.com/donate/)

[brokenbotnet.com](https://brokenbotnet.com/) documents my work in security research, privacy, open-source infrastructure, and the Tor network.

## Projects

- [Tor Guard Relay](https://github.com/r3bo0tbx1/tor-guard-relay), a hardened container and operational toolkit for running Tor relays and bridges.
- [Shinobi Relays](https://relays.brokenbotnet.com/), a public dashboard for the Tor infrastructure I operate.

## Built with

The site uses [Hugo](https://gohugo.io/) with a customized [risotto](https://github.com/joeroe/risotto) theme. GitHub Actions validates each build and deploys it to GitHub Pages.

## Color themes

The footer's **Theme** control switches between **BrokenBotnet**,
**Gruvbox Dark**, and **Daylight** without changing the site's layout, typography, or content.
Standard pages remember the choice in browser storage when available. Each
clearnet or onion origin keeps its own preference. **Background relays** can
be disabled independently on desktop pages with relay support, and that
preference is saved too. Mobile and script-free pages offer only theme choices.
Resizing to mobile does not overwrite the saved desktop preference. Daylight uses a
neutral white/slate palette with blue and teal accents; it is not Gruvbox Light.
The configured default remains BrokenBotnet.

No-JavaScript pages support the same choices through CSS in browsers with
`:has()` support. That choice applies to the current page; persistence across
navigation is not guaranteed. Without that CSS support, script-free pages
retain the BrokenBotnet appearance. These rules also apply to the script-free
404 page. A CSS-only choice cannot read preferences saved by JavaScript.
No-JavaScript pages omit relay backgrounds and the background toggle. Their
Palette icon uses a local PNG image, like the other script-free footer icons,
so it does not depend on SVG support. Standard pages without JavaScript use this
fallback too. Mobile layouts omit relay backgrounds. Desktop
pages animate at up to 30 fps (10 fps while reading), and reduced-motion or
Save-Data preferences keep the network still. An interrupted module load uses
the static fallback, with at most two event-triggered retries. Theme changes do
not recolor photographs, screenshots, currency logos, or QR codes.

`static/icons/palette.png` is a 96×96 transparent PNG rendered from the
[official Lucide Palette SVG](https://github.com/lucide-icons/lucide/blob/main/icons/palette.svg).
Its warm gold outline and red, gold, blue, and teal paint dots match the standard
SVG icon across all three themes. The existing [Lucide ISC license](static/icons/LICENSE-lucide.txt) applies.

Set `params.theme.palette` in `hugo.toml` to `brokenbotnet`, `gruvbox-dark`, or `daylight`
to choose the default. The Gruvbox colors are adapted from
[morhetz/gruvbox](https://github.com/morhetz/gruvbox).

Check appearance behavior with `node --test scripts/theme.test.mjs`, then build
with `hugo --gc --minify --panicOnWarning` and run
`node scripts/audit-client-security.mjs`.
Run `node scripts/audit-theme-output.mjs` to verify that script-free outputs
omit irrelevant controls and include the PNG icon assets.
Preview the homepage, Writing, Whoami,
Donate, an article with code, `/nojs/`, and `/404.html`; check keyboard focus,
320/375/768/900/1100 px layouts, persistence, reduced motion, and print preview.

## Project statistics

`data/project_stats.json` is the authoritative snapshot used by both GitHub
Pages and Web2Onion. The scheduled `stats.yml` workflow refreshes the
snapshot from its external sources, fails without changing it if any source is
unavailable or inconsistent, commits only that file, and explicitly starts
the normal validation workflow.

Ordinary builds run `scripts/fetch-project-stats.mjs` without `--refresh`.
That mode validates the committed snapshot and performs no network requests or
writes. This keeps clearnet and onion builds reproducible from the same source
commit. Only the dedicated refresh workflow may use:

```sh
node scripts/fetch-project-stats.mjs --refresh
```

## Release articles

The [v2.2.1 publication checklist](docs/v2.2.1-publication.md) covers release evidence, deployment captures and site checks. The article and related-page release notices appear in ordinary builds. Publish the site after the corresponding release is available.

## License

Original material in this repository is available under the [MIT License](LICENSE). Third-party themes, fonts, icons, and other components remain subject to their respective licenses.
