# 💸 Spend Elon's Money · 花掉马斯克的钱

A satirical little web toy: you've been handed Elon Musk's entire fortune —
a frankly obscene **$1.3 trillion** — and your only job is to get rid of it.
Buy anything from a **$3 Big Mac** to **a small nation's GDP**.

Deadpan, faintly British, and entirely useless. Just as intended.

## Features

- 🛒 **One-tap buying** — click a card to buy, tap the minus to refund.
- 🧾 **Receipt bottom sheet** — a realistic till receipt lives in a draggable
  sheet: flick it open or closed (1:1 tracking, rubber-banding, momentum
  projection, interruptible springs), or just tap the bar.
- 💫 **Fluid, Apple-style motion** — the balance spring-counts to its new value,
  translucent `backdrop-filter` chrome, and a large-title balance that condenses
  into the top bar on scroll.
- ♿ **Respects your settings** — `prefers-reduced-motion`,
  `prefers-reduced-transparency`, and `prefers-contrast` all get fallbacks.
- 📱 **Mobile-first** responsive layout.
- 🌗 **Dark mode** (follows your system preference on first visit, toggle to override).
- 🌐 **English / 中文** switch.
- 💾 Your trolley, language, and theme persist via `localStorage`.
- ⚡ Pure HTML/CSS/JS — no build step, no dependencies.

## Run locally

It's a static site. Just open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy to GitHub Pages

**Option A — branch (simplest):**
Repo → *Settings* → *Pages* → *Build and deployment* → Source: **Deploy from a branch**,
pick your branch and `/ (root)`.

**Option B — Actions:**
The included workflow (`.github/workflows/pages.yml`) deploys automatically on push.
Just set *Settings → Pages → Source* to **GitHub Actions**.

## Project structure

```
index.html        markup + structure
css/styles.css    themes, layout, the torn-paper receipt
js/data.js        the catalogue (prices + bilingual copy)
js/i18n.js        UI strings (en / zh)
js/app.js         state, cart logic, rendering
```

---

A satirical toy. No billionaires were consulted, harmed, or reimbursed.
