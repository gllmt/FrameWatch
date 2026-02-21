# FrameWatch

FrameWatch est une extension de navigateur open source qui affiche un HUD minimaliste dans la page avec des métriques de qualité vidéo en temps réel.

Construit avec WXT, React, TypeScript et Tailwind CSS.

## Ce Que C'est

FrameWatch superpose un HUD compact sur les lecteurs vidéo HTML5 pour inspecter la qualité de lecture pendant le visionnage.

## Fonctionnalités

- Détection robuste de la vidéo active sur les pages dynamiques et les navigations SPA.
- Collecte universelle des métriques HTML5.
- Estimation du débit à partir des ressources réseau média observées.
- Architecture par adaptateurs avec comportement spécifique par site et fallback automatique.
- HUD en Shadow DOM pour une isolation CSS forte.
- Popup et page d'options avec réglages persistés.
- Localisation EN et FR.

## Sites Pris En Charge

- YouTube (adaptateur + fallback générique)
- Twitch (adaptateur + fallback générique)
- Sites génériques avec vidéo HTML5

## Métriques Affichées

- Résolution décodée (`videoWidth x videoHeight`)
- FPS estimé
- Frames perdues et frames totales (si disponibles)
- Buffer en avance (secondes)
- Vitesse de lecture
- Ready state et network state (optionnel)
- Estimation du débit observé (Mbps), affiche `N/A` si indisponible

## Comportement En Plein Écran

- Le plein écran standard est pris en charge via `fullscreenchange`.
- Le HUD est re-parenté dans l'élément plein écran si nécessaire.
- Les conteneurs pseudo plein écran de YouTube et Twitch sont gérés quand ils sont détectables.

## Installation (Dev)

Prérequis:

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

## Charger En Non Packé (Chromium)

1. Lancez `pnpm build`.
2. Ouvrez `chrome://extensions`.
3. Activez le mode développeur.
4. Cliquez sur Load unpacked.
5. Sélectionnez:

```text
.output/chrome-mv3
```

## i18n (EN/FR)

- Langue par défaut: anglais
- Langue additionnelle: français (`README.fr.md` pour la documentation)
- Les locales de l'extension sont dans `public/_locales/en/messages.json` et `public/_locales/fr/messages.json`.

## Emplacement De Capture D'écran

Ajoutez de vraies captures dans `docs/screenshots/` (ou un autre dossier docs), puis référencez-les ici.

Exemple:

```md
![FrameWatch HUD on YouTube](docs/screenshots/hud-youtube.png)
```

## Roadmap

- Améliorer la précision de l'adaptateur Twitch quand les APIs player sont exposées.
- Ajouter une meilleure gestion des pages avec beaucoup d'iframes.
- Préparer le workflow de packaging cross-browser pour Firefox et Safari.
- Ajouter des contrôles QA automatisés légers.

## Contribution

Les contributions sont les bienvenues.

1. Forkez le dépôt.
2. Créez une branche de fonctionnalité.
3. Exécutez `pnpm compile` et `pnpm build` avant d'ouvrir une PR.
4. Ouvrez une pull request avec un scope clair et des notes de test.

## Licence

FrameWatch est sous licence GNU Affero General Public License v3.0 (AGPL-3.0).

Vous êtes libre d'utiliser, modifier et redistribuer ce logiciel selon les termes de la licence AGPL-3.0.

Si vous distribuez des versions modifiées ou utilisez ce logiciel dans le cadre d'un service accessible via un réseau, vous devez également mettre à disposition le code source correspondant sous la même licence.

Consultez le fichier `LICENSE` pour tous les détails.
