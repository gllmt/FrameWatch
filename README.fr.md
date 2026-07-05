# FrameWatch

Extension de navigateur pour diagnostiquer la qualité de lecture vidéo en temps réel. FrameWatch ajoute un HUD compact dans la page sur YouTube, Twitch et les lecteurs HTML5 génériques pour inspecter la résolution, les FPS, les images perdues, le buffer, l'état de lecture et le débit observé sans quitter la vidéo.

![WXT](https://img.shields.io/badge/WXT-111827?style=flat-square)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Licence : AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg?style=flat-square)

## Fonctionnalités

- HUD injecté dans la page avec Shadow DOM pour une forte isolation CSS.
- Détection de la vidéo active sur les pages dynamiques, les navigations SPA et les iframes accessibles.
- Adaptateurs pour YouTube et Twitch, avec fallback HTML5 générique.
- Métriques HTML5 : résolution décodée, FPS estimés, images perdues, images totales, buffer en avance, vitesse de lecture, ready state et network state.
- Estimation du débit observé à partir des ressources média, affichée en `N/A` quand elle est indisponible.
- Gestion du plein écran standard et des pseudo pleins écrans détectables.
- Popup et page d'options avec réglages persistés dans le navigateur.
- Raccourci clavier pour afficher ou masquer le HUD : `Alt+Shift+Q`.
- Locales d'extension en anglais et français.

## Sites pris en charge

- YouTube.
- Twitch.
- Sites génériques avec vidéo HTML5.

YouTube et Twitch utilisent d'abord des adaptateurs spécifiques, puis le détecteur générique si nécessaire.

## Prérequis

- Node.js compatible avec WXT et Vite : `^20.19.0` ou `>=22.12.0`.
- pnpm.
- Navigateur compatible Chromium pour le build par défaut.
- Firefox pour la cible de build Firefox.

## Démarrage

```bash
pnpm install
pnpm dev
```

WXT affiche la cible navigateur de développement et le dossier de sortie.

## Build

```bash
pnpm build          # build Chromium MV3
pnpm build:firefox  # build Firefox
pnpm zip            # package Chromium
pnpm zip:firefox    # package Firefox
```

## Charger l'extension non packée

Pour Chromium :

```bash
pnpm build
```

Ouvrez ensuite `chrome://extensions`, activez le mode développeur, cliquez sur "Load unpacked", puis sélectionnez :

```text
.output/chrome-mv3
```

## Permissions et vie privée

FrameWatch demande `storage`, `tabs` et `<all_urls>` parce que le content script doit détecter les vidéos sur des pages arbitraires et que la popup doit communiquer avec l'onglet actif.

Les réglages sont stockés dans le stockage local de l'extension. FrameWatch n'inclut pas d'analytics, n'envoie pas les métriques collectées à un backend et ne persiste pas les métriques vidéo en dehors de l'interface de l'extension.

## Commandes

```bash
pnpm dev          # mode développement WXT
pnpm dev:firefox  # WXT pour Firefox
pnpm build        # build Chromium
pnpm build:firefox
pnpm zip
pnpm zip:firefox
pnpm lint         # lint Biome
pnpm check        # check Biome
pnpm compile      # vérification TypeScript
pnpm lints        # Biome check + lint + TypeScript
```

## Structure du repo

- `entrypoints/` : entrypoints WXT background, content, popup et options.
- `src/content/` : contrôleur du content script et montage du HUD.
- `src/core/` : détection vidéo, collecte de métriques, estimation du débit et gestion du plein écran.
- `src/adapters/` : adaptateurs YouTube, Twitch et générique.
- `src/hud/` : UI React du HUD et styles isolés.
- `src/popup/` et `src/options/` : surfaces UI de l'extension.
- `src/storage/` : réglages persistés.
- `public/_locales/` : messages i18n de l'extension en anglais et français.

## Limites

- Les APIs navigateur exposent certaines métriques vidéo de façon inégale selon les sites et navigateurs.
- Les iframes cross-origin peuvent bloquer l'inspection vidéo directe ; FrameWatch compte les iframes bloquées quand il ne peut pas y accéder.
- Le débit observé est une estimation basée sur Resource Timing, pas une vérité fournie par le lecteur vidéo.
- Le packaging Safari n'est pas documenté pour le moment.

## Documentation

La documentation principale en anglais est disponible dans [README.md](./README.md).

## Licence

Sous licence [GNU AGPL-3.0](LICENSE). Vous êtes libre de l'utiliser, de l'étudier, de le modifier et de le redistribuer. Tout fork distribué ou hébergé sur un réseau doit aussi être publié sous AGPL-3.0, afin de garder les dérivés ouverts.

© 2026 Pierre Guillemot
