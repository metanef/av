# Midnight Revelations — Action ou Vérité

Application web (SPA en un seul écran) de jeu "Action ou Vérité" avec deux univers :
- **Amis & Chill** : questions/défis légers
- **Sexy Hot** : 3 niveaux de difficulté (Soft / Flirt / Hard), plus osés à chaque palier

## Structure du projet

```
midnight-revelations/
├── index.html      → structure de la page
├── styles.css       → styles custom (variables CSS, glassmorphism, slider...)
├── cards.json        → contenu des cartes (vérités & actions), séparé du code
├── script.ts        → logique de l'application, en TypeScript typé
├── script.js         → JS compilé depuis script.ts (exécuté par le navigateur)
└── README.md         → ce fichier
```

Dépendances externes chargées via CDN dans `index.html` :
- [Tailwind CSS](https://tailwindcss.com/) (utilitaires de style)
- [Chart.js](https://www.chartjs.org/) (graphique en donut de progression)
- [Font Awesome](https://fontawesome.com/) (icônes)
- Police Google Fonts "Plus Jakarta Sans"

## Lancer le projet

⚠️ **Important** : `script.js` charge `cards.json` via `fetch()`. Les navigateurs bloquent `fetch()` sur des fichiers ouverts directement (`file://...`) pour des raisons de sécurité (CORS). Il faut donc servir les fichiers via un petit serveur local :

```bash
cd midnight-revelations
python3 -m http.server 8000
# puis ouvrir http://localhost:8000 dans le navigateur
```

Ou avec Node.js :

```bash
npx serve .
```

## Modifier le contenu des cartes

Toutes les questions et défis sont dans **`cards.json`**, un simple objet avec 4 paquets :

```json
{
  "friends": { "truth": [...], "dare": [...] },
  "hot1":    { "truth": [...], "dare": [...] },
  "hot2":    { "truth": [...], "dare": [...] },
  "hot3":    { "truth": [...], "dare": [...] }
}
```

- `friends` → mode "Amis & Chill"
- `hot1` / `hot2` / `hot3` → mode "Sexy Hot", niveaux Soft / Flirt / Hard

Pour ajouter, modifier ou supprimer des cartes, il suffit d'éditer ce fichier JSON — **aucune recompilation nécessaire**, il suffit de recharger la page dans le navigateur.

⚠️ Le total de cartes (40 = 20 truth + 20 dare) est actuellement codé en dur dans `updateChart()` (`script.ts`) pour le calcul de la barre de progression. Si tu changes le nombre de cartes dans un paquet, pense à ajuster cette valeur (ou on peut la rendre dynamique — demande-le si besoin).

## Modifier la logique (script.ts)

Le code est en TypeScript. Après toute modification de `script.ts`, il faut recompiler pour régénérer `script.js` :

```bash
tsc --target ES2017 --lib DOM,ES2017 script.ts
```

(nécessite `typescript` installé : `npm install -g typescript`)

## Fonctionnement général

1. **Accueil** (`view-home`) : l'utilisateur choisit un mode (`setMode`) et, en mode Hot, un niveau de difficulté via le slider (`updateDifficulty`), puis lance la partie (`initGame`).
2. **Jeu** (`view-game`) : à chaque tour, un joueur choisit Vérité ou Action (`drawCard`), la carte piochée s'affiche sans répétition tant que le paquet n'est pas épuisé, puis on passe au joueur suivant (`nextPlayer`).
3. **Statistiques** (`view-stats`) : accessible depuis l'écran de jeu, affiche un donut chart (Chart.js) du nombre de cartes déjà vues sur le total.

## Limitations connues

- Pas de sauvegarde de partie entre sessions (pas de `localStorage`)
- `goBack()` recharge complètement la page (perte de la progression en cours)
- Le total "40" dans les stats est fixe, pas calculé dynamiquement depuis `cards.json`