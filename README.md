# FrameWatch

FrameWatch is an open-source browser extension that shows a minimal in-page HUD with real-time video playback quality metrics.

Built with WXT, React, TypeScript, and Tailwind CSS.

## What It Is

FrameWatch overlays a compact HUD on top of HTML5 video players to help you inspect playback quality while watching.

## Features

- Robust active video detection for dynamic pages and SPA navigation.
- Universal HTML5 metrics collection.
- Throughput estimation from observed media network resources.
- Adapter architecture with site-specific behavior and automatic fallback.
- Shadow DOM HUD for strong CSS isolation.
- Popup and options pages with persisted settings.
- EN and FR localization.

## Supported Sites

- YouTube (adapter + generic fallback)
- Twitch (adapter + generic fallback)
- Generic HTML5 video sites

## Metrics Shown

- Decoded resolution (`videoWidth x videoHeight`)
- Estimated FPS
- Dropped frames and total frames (when available)
- Buffer ahead (seconds)
- Playback rate
- Ready state and network state (optional)
- Observed bitrate estimate (Mbps), shows `N/A` when unavailable

## Fullscreen Behavior

- Standard fullscreen is supported via `fullscreenchange` handling.
- The HUD is re-parented to the fullscreen element when needed.
- Pseudo fullscreen containers on YouTube and Twitch are handled when detectable.

## Install (Dev)

Requirements:

- Node.js 18+
- pnpm

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
pnpm build:firefox
```

## Load Unpacked (Chromium)

1. Run `pnpm build`.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select:

```text
.output/chrome-mv3
```

## i18n (EN/FR)

- Default language: English
- Additional language: French (`README.fr.md` for docs)
- Extension locales are in `public/_locales/en/messages.json` and `public/_locales/fr/messages.json`.

## Screenshot Placeholder

Add real screenshots in `docs/screenshots/` (or another docs folder), then reference them here.

Example:

```md
![FrameWatch HUD on YouTube](docs/screenshots/hud-youtube.png)
```

## Roadmap

- Improve Twitch adapter precision when player APIs are exposed.
- Add better handling for iframe-heavy pages.
- Prepare cross-browser packaging workflow for Firefox and Safari.
- Add lightweight automated QA checks.

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Run `pnpm compile` and `pnpm build` before opening a PR.
4. Open a pull request with a clear scope and test notes.

## License

FrameWatch is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).

You are free to use, modify, and redistribute this software under the terms of the AGPL-3.0 license.

If you distribute modified versions or use this software as part of a network-accessible service, you must also make the corresponding source code available under the same license.

See the `LICENSE` file for full details.
