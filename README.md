# 💸 Spend Elon's Money · 花掉马斯克的钱

A satirical little web toy: you've been handed Elon Musk's entire fortune —
a frankly obscene **$1.3 trillion** — and your only job is to get rid of it.
Buy anything from a **$3 Big Mac** to **a small nation's GDP**.

Deadpan, faintly British, and entirely useless. Just as intended.

## Features

- 🛒 **One-tap buying** — click a card to buy, tap the red minus to refund.
- 🧾 **Live receipt** — a realistic till receipt builds at the bottom of the page,
  with quick +/− steppers to adjust quantities.
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
