# Fashion of the Wild

An interactive outfit builder for *The Legend of Zelda: Breath of the Wild*. Pick a head,
body, and legs piece (plus dye colors), equip a weapon, shield, and bow; the layered paperdoll
preview updates as you choose. The full outfit is encoded into the URL hash so you can
share any look as a link, and you can also save a jpg by clicking the "Save This Outfit" button.
A Tears of the Kingdom tab is stubbed out for later, after I get all the screenshots I need.

This is a React rewrite of the original FashionOfTheWild web app, which was written in 2017 using Java/Vaadin.

## Stack

Vite + React 19 + TypeScript · Tailwind CSS v4 · html-to-image · Vitest.

## Getting started

```bash
npm install
npm run dev
```

`npm run build` typechecks + builds to `dist/`. Tests (just for the URL hash encode/decode stuff) run with `npx vitest`.

## Data

All BotW lookup tables live in `src/games/botw/data/tables.ts`: item lists tagged by
amiibo/DLC, armor sets, dye colors, URL char maps, and special-case flags (bunched
hoods, Phantom Ganon shoulder swap, Salvager adjustment, etc.). All of these images are
screenshots from the game, edited in photoshop and split into layers by hand.

Armor and equipment PNGs are under `src/games/botw/images/` and imported via Vite's
`import.meta.glob`, so they're content-hashed and code-split automatically.

## URL fragments

Outfits are encoded in a 10-character URL fragment, in same layout as the original web app:

```
[head][headColor][body][bodyColor][legs][legsColor][weapon x2][shield][bow]
```

Legacy URLs like `https://www.fashionofthewild.com/#adt0990hfa` still work and still generate the same
outfit as before, but going forward the URL will have the form `#botw-XXXXXXXXXX`; TotK will use `#totk-...`.

## Deployment notes

`index.html` includes `<meta name="darkreader-lock">` so the Darkreader extension doesn't
fight the built-in theme toggle. The app defaults to dark mode when the browser prefers
it (or when the preference is unknown), and persists the user's choice in `localStorage`.
