# FrameWatch

Browser extension for real-time video playback diagnostics. FrameWatch overlays a compact in-page HUD on YouTube, Twitch, and generic HTML5 video players so you can inspect resolution, FPS, dropped frames, buffering, playback state, and observed bitrate without leaving the page.

![WXT](https://img.shields.io/badge/WXT-111827?style=flat-square)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg?style=flat-square)

## Features

- In-page Shadow DOM HUD with strong CSS isolation.
- Active video detection across dynamic pages, SPA navigation, and visible iframe depth.
- Site adapters for YouTube and Twitch, with a generic HTML5 fallback.
- Universal HTML5 metrics: decoded resolution, estimated FPS, dropped frames, total frames, buffer ahead, playback rate, ready state, and network state.
- Observed bitrate estimate from media network resources, shown as `N/A` when unavailable.
- Standard fullscreen and detectable pseudo-fullscreen handling.
- Popup and options pages with persisted browser storage settings.
- Keyboard command to toggle the HUD: `Alt+Shift+Q`.
- English and French extension locales.

## Supported Sites

- YouTube.
- Twitch.
- Generic HTML5 video sites.

YouTube and Twitch use site-specific adapters first, then fall back to the generic detector when needed.

## Requirements

- Node.js compatible with WXT and Vite: `^20.19.0` or `>=22.12.0`.
- pnpm.
- Chromium-compatible browser for the default build.
- Firefox for the Firefox build target.

## Getting Started

```bash
pnpm install
pnpm dev
```

WXT prints the development browser target and output directory.

## Build

```bash
pnpm build          # Chromium MV3 build
pnpm build:firefox  # Firefox build
pnpm zip            # package Chromium build
pnpm zip:firefox    # package Firefox build
```

## Load Unpacked

For Chromium:

```bash
pnpm build
```

Then open `chrome://extensions`, enable Developer mode, click "Load unpacked", and select:

```text
.output/chrome-mv3
```

## Permissions & Privacy

FrameWatch requests `storage`, `tabs`, and `<all_urls>` because the content script needs to detect videos on arbitrary pages and the popup needs to communicate with the active tab.

Settings are stored in browser local extension storage. FrameWatch does not include analytics, does not send collected metrics to a backend, and does not persist video metrics outside the extension UI.

## Commands

```bash
pnpm dev          # run WXT development mode
pnpm dev:firefox  # run WXT for Firefox
pnpm build        # build Chromium extension
pnpm build:firefox
pnpm zip
pnpm zip:firefox
pnpm lint         # Biome lint
pnpm check        # Biome check
pnpm compile      # TypeScript check
pnpm lints        # Biome check + lint + TypeScript check
```

## Repository Layout

- `entrypoints/`: WXT background, content, popup, and options entrypoints.
- `src/content/`: content-script controller and HUD mounting.
- `src/core/`: video detection, metric collection, throughput estimation, and fullscreen handling.
- `src/adapters/`: YouTube, Twitch, and generic site adapters.
- `src/hud/`: React HUD UI and isolated styles.
- `src/popup/` and `src/options/`: extension UI surfaces.
- `src/storage/`: persisted settings.
- `public/_locales/`: Chrome extension i18n messages in English and French.

## Limits

- Browser APIs expose some video metrics inconsistently by site and browser.
- Cross-origin iframes can block direct video inspection; FrameWatch counts blocked iframes when detection cannot enter them.
- Observed bitrate is an estimate from media resource timing, not a player-provided ground truth.
- Safari packaging is not currently documented.

## Documentation

French documentation is available in [README.fr.md](./README.fr.md).

## License

Licensed under the [GNU AGPL-3.0](LICENSE). You are free to use, study, modify, and redistribute it. Any distributed or network-hosted fork must also be released under the AGPL-3.0, which keeps derivatives open.

© 2026 Pierre Guillemot
