# Midnight Revelations — Truth or Dare

A single-screen web app for a "Truth or Dare" party game, available in **French and English**, with three modes:
- **Friends & Chill**: light-hearted questions and dares
- **Sexy Hot**: 3 difficulty levels (Soft / Flirt / Hard), getting bolder at each level
- **Domination**: dares only (no truths), split into two categories — **Non-sexy** and **Sexy** — each with 3 difficulty levels

## Project structure

```
midnight-revelations/
├── index.html      → page structure
├── styles.css       → custom styles (CSS variables, glassmorphism, slider...)
├── cards.json        → card content (truths & dares) in FR and EN, separate from the code
├── script.js         → application logic (JavaScript)
└── README.md         → this file
```

External dependencies loaded via CDN in `index.html`:
- [Tailwind CSS](https://tailwindcss.com/) (styling utilities)
- [Chart.js](https://www.chartjs.org/) (donut chart for deck progress)
- [Font Awesome](https://fontawesome.com/) (icons)
- Google Fonts "Plus Jakarta Sans"

## Running the project

⚠️ **Important**: `script.js` loads `cards.json` via `fetch()`. Browsers block `fetch()` on files opened directly (`file://...`) for security reasons (CORS). You need to serve the files through a small local server:

```bash
cd midnight-revelations
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

Or with Node.js:

```bash
npx serve .
```

## Language support

The app supports **French (default) and English**, switchable via the FR/EN buttons on the home screen.

- All static UI text (buttons, labels, headers) is translated through a `translations` object in `script.js`.
- All card content (truths and dares) is translated in `cards.json` under two top-level keys, `fr` and `en`.
- The selected language only affects the current session (no persistence across page reloads).

## Editing card content

All questions and dares live in **`cards.json`**, structured by language, then by deck:

```json
{
  "fr": {
    "friends": { "truth": [...], "dare": [...] },
    "hot1":    { "truth": [...], "dare": [...] },
    "hot2":    { "truth": [...], "dare": [...] },
    "hot3":    { "truth": [...], "dare": [...] },
    "dom_nonsexy1": { "dare": [...] },
    "dom_nonsexy2": { "dare": [...] },
    "dom_nonsexy3": { "dare": [...] },
    "dom_sexy1":    { "dare": [...] },
    "dom_sexy2":    { "dare": [...] },
    "dom_sexy3":    { "dare": [...] }
  },
  "en": {
    "friends": { "truth": [...], "dare": [...] },
    "hot1":    { "truth": [...], "dare": [...] },
    "hot2":    { "truth": [...], "dare": [...] },
    "hot3":    { "truth": [...], "dare": [...] },
    "dom_nonsexy1": { "dare": [...] },
    "dom_nonsexy2": { "dare": [...] },
    "dom_nonsexy3": { "dare": [...] },
    "dom_sexy1":    { "dare": [...] },
    "dom_sexy2":    { "dare": [...] },
    "dom_sexy3":    { "dare": [...] }
  }
}
```

- `friends` → "Friends & Chill" mode
- `hot1` / `hot2` / `hot3` → "Sexy Hot" mode, Soft / Flirt / Hard levels
- `dom_nonsexy1/2/3` → "Domination" mode, Non-sexy category, levels 1 to 3
- `dom_sexy1/2/3` → "Domination" mode, Sexy category, levels 1 to 3

The `dom_*` pools only have a `dare` array (no `truth`) since Domination mode is dare-only: the Truth/Dare choice screen is hidden for this mode, and the player always draws a dare.

To add, edit, or remove cards, just edit this JSON file — **no recompilation needed**, just reload the page in the browser. Keep the `fr` and `en` arrays the same length and in the same order if you want both languages to stay in sync (not strictly required, but keeps things tidy).

⚠️ The total card count for the progress bar is now computed dynamically in `getTotalCards()` (`script.js`) based on the active pool and mode (40 for Friends/Hot, 10 for Domination), so you can freely change the number of cards in any deck without touching the code.

## Editing the logic (script.js)

The code is plain JavaScript, directly editable and reloadable in the browser — no build step required.

## How it works

1. **Home screen** (`view-home`): the user picks a language (`setLang`), a mode (`setMode`) and:
   - in Hot mode, a difficulty level via the slider (`updateDifficulty`)
   - in Domination mode, a category (`setDominationCategory`: Non-sexy / Sexy) and a difficulty level via the slider (`updateDominationDifficulty`)
   
   then starts the game (`initGame`).
2. **Game screen** (`view-game`): each turn, a player picks Truth or Dare (`drawCard`) — except in Domination mode, where the Truth option is hidden and only dares are drawn. The drawn card is shown without repeats until the deck runs out, then the group moves to the next player (`nextPlayer`).
3. **Stats screen** (`view-stats`): accessible from the game screen, shows a donut chart (Chart.js) of cards seen so far out of the total for the active deck.

## Known limitations

- No save/persistence between sessions (no `localStorage`)
- `goBack()` fully reloads the page (current progress is lost)
- Language choice isn't remembered between sessions