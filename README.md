# FrameWatch

FrameWatch est une extension Chromium MV3 (WXT + React + TypeScript + Tailwind) qui affiche un HUD minimaliste en surimpression pour suivre la qualité vidéo en temps réel sur YouTube, Twitch et les lecteurs HTML5.

## Stack

- WXT (Vite-based)
- Manifest V3
- TypeScript
- React
- Tailwind CSS
- HUD dans Shadow DOM (isolation CSS)

## Fonctionnalités

- Détection robuste des balises `<video>` (lecture active prioritaire, fallback par taille visible, mutation + SPA).
- Collecte universelle des métriques HTML5 :
  - résolution décodée,
  - FPS estimé,
  - dropped/total frames,
  - buffer ahead,
  - playbackRate,
  - readyState/networkState (optionnel).
- Estimation de débit observé via `PerformanceObserver` sur une fenêtre glissante.
- Architecture adapter pluggable :
  - `GenericAdapter` (fallback),
  - `YouTubeAdapter`,
  - `TwitchAdapter` (utilise API player si accessible, sinon fallback).
- HUD in-page en Shadow DOM, visible en plein écran (re-parenting + pseudo-fullscreen YouTube/Twitch).
- Popup : toggle HUD + site détecté + état vidéo + lien options.
- Options persistées (`chrome.storage.local`) : langue, position HUD, lignes affichées, fréquence refresh, comportement fullscreen.
- i18n FR/EN via `_locales/*/messages.json`.

## Arborescence

```text
entrypoints/
  background.ts
  content.ts
  popup/
    index.html
    main.tsx
    style.css
  options/
    index.html
    main.tsx
    style.css
src/
  adapters/
    generic-adapter.ts
    twitch-adapter.ts
    youtube-adapter.ts
    index.ts
    types.ts
  core/
    fullscreen-manager.ts
    metrics-collector.ts
    throughput-estimator.ts
    video-detector.ts
  content/
    controller.tsx
  hud/
    HudPanel.tsx
    hud.css
  i18n/
    runtime.ts
  popup/
    App.tsx
  options/
    App.tsx
  shared/
    messages.ts
    types.ts
  storage/
    settings.ts
public/
  _locales/
    en/messages.json
    fr/messages.json
  icon/
wxt.config.ts
tailwind.config.ts
postcss.config.cjs
```

## Développement

Pré-requis : Node 18+ et pnpm.

```bash
pnpm install
pnpm dev
```

Build production :

```bash
pnpm build
```

Type-check :

```bash
pnpm compile
```

## Charger l’extension unpacked (Chromium)

1. Lancer `pnpm build`.
2. Ouvrir `chrome://extensions`.
3. Activer `Mode développeur`.
4. Cliquer `Load unpacked`.
5. Sélectionner le dossier :
   - `/Users/pierreguillemot/sites-perso/FrameWatch/.output/chrome-mv3`

## Raccourci clavier

- Commande : `toggle-hud`
- Par défaut : `Alt+Shift+Q`
- Modifiable via `chrome://extensions/shortcuts`

## Limites connues

- YouTube : le label qualité dépend des surfaces DOM/API exposées ; si indisponible, rien n’est inventé.
- Bitrate observé : dépend de `PerformanceResourceTiming` (cache, CORS/TAO, type de flux segmenté), peut rester en `N/A`.
- Iframes cross-origin : non inspectables depuis la page parente ; elles sont détectées et ignorées proprement.
- Twitch API : si l’API player n’est pas exposée au contexte page, fallback générique automatique.

## Compatibilité

- Cible actuelle : Chromium MV3 (macOS/Linux).
- Architecture prête pour un port Firefox/Safari ultérieur.
