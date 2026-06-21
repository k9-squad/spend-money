(function () {
  "use strict";

  // ---------- State ----------
  const store = {
    cart: {},                 // { [itemId]: quantity }
    lang: "en",
    theme: "light"
  };

  const els = {
    grid: document.getElementById("itemGrid"),
    balanceValue: document.getElementById("balanceValue"),
    balanceFill: document.getElementById("balanceFill"),
    spentValue: document.getElementById("spentValue"),
    receiptItems: document.getElementById("receiptItems"),
    receiptEmpty: document.getElementById("receiptEmpty"),
    receiptCount: document.getElementById("receiptCount"),
    receiptTotal: document.getElementById("receiptTotal"),
    receiptMeta: document.getElementById("receiptMeta"),
    receiptCode: document.getElementById("receiptCode"),
    langToggle: document.getElementById("langToggle"),
    themeToggle: document.getElementById("themeToggle"),
    resetBtn: document.getElementById("resetBtn")
  };

  // ---------- Persistence ----------
  function save() {
    try {
      localStorage.setItem("sem.cart", JSON.stringify(store.cart));
      localStorage.setItem("sem.lang", store.lang);
      localStorage.setItem("sem.theme", store.theme);
    } catch (e) { /* private mode, who cares */ }
  }
  function load() {
    try {
      const c = JSON.parse(localStorage.getItem("sem.cart") || "{}");
      if (c && typeof c === "object") store.cart = c;
      const l = localStorage.getItem("sem.lang");
      if (l === "en" || l === "zh") store.lang = l;
      const t = localStorage.getItem("sem.theme");
      if (t === "light" || t === "dark") store.theme = t;
    } catch (e) { /* ignore */ }
  }

  // ---------- Helpers ----------
  const t = (key) => (I18N[store.lang] && I18N[store.lang][key]) || key;
  const itemById = (id) => ITEMS.find((i) => i.id === id);

  // Pretty money: $1.3T / $5.0B / $42.0M / $250K / $3.00
  function formatMoney(n) {
    const sign = n < 0 ? "-" : "";
    const a = Math.abs(n);
    if (a >= 1e12) return sign + "$" + (a / 1e12).toFixed(2).replace(/\.00$/, "") + "T";
    if (a >= 1e9)  return sign + "$" + (a / 1e9).toFixed(2).replace(/\.00$/, "") + "B";
    if (a >= 1e6)  return sign + "$" + (a / 1e6).toFixed(2).replace(/\.00$/, "") + "M";
    if (a >= 1e3)  return sign + "$" + (a / 1e3).toFixed(0) + "K";
    return sign + "$" + a.toFixed(2);
  }
  // Full, comma-grouped figure for the big balance + receipt lines.
  function formatFull(n) {
    return "$" + Math.round(n).toLocaleString("en-US");
  }

  function spentTotal() {
    return Object.keys(store.cart).reduce((sum, id) => {
      const item = itemById(id);
      return item ? sum + item.price * store.cart[id] : sum;
    }, 0);
  }
  function itemCount() {
    return Object.keys(store.cart).reduce((s, id) => s + store.cart[id], 0);
  }

  // ---------- Cart operations ----------
  function add(id) {
    const item = itemById(id);
    if (!item) return;
    if (spentTotal() + item.price > BUDGET) {
      flashBroke(id);
      return;
    }
    store.cart[id] = (store.cart[id] || 0) + 1;
    save();
    render();
  }
  function remove(id) {
    if (!store.cart[id]) return;
    store.cart[id] -= 1;
    if (store.cart[id] <= 0) delete store.cart[id];
    save();
    render();
  }
  function reset() {
    store.cart = {};
    save();
    render();
  }

  // ---------- Rendering: item grid ----------
  function buildGrid() {
    els.grid.innerHTML = "";
    ITEMS.forEach((item) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "card";
      card.dataset.id = item.id;
      card.innerHTML = `
        <span class="card__emoji" aria-hidden="true">${item.emoji}</span>
        <span class="card__name" data-name></span>
        <span class="card__desc" data-desc></span>
        <span class="card__foot">
          <span class="card__price" data-price></span>
          <span class="card__qty" data-qty></span>
        </span>
        <span class="card__minus" data-minus aria-label="Remove one">−</span>
      `;
      card.addEventListener("click", () => add(item.id));
      const minus = card.querySelector("[data-minus]");
      minus.addEventListener("click", (e) => { e.stopPropagation(); remove(item.id); });
      els.grid.appendChild(card);
    });
  }

  function flashBroke(id) {
    const card = els.grid.querySelector(`.card[data-id="${id}"]`);
    if (!card) return;
    card.classList.remove("card--broke");
    void card.offsetWidth; // restart animation
    card.classList.add("card--broke");
    els.balanceValue.classList.remove("shake");
    void els.balanceValue.offsetWidth;
    els.balanceValue.classList.add("shake");
  }

  // ---------- Rendering: everything ----------
  function render() {
    const spent = spentTotal();
    const remaining = BUDGET - spent;

    // Balance bar
    els.balanceValue.textContent = formatFull(remaining);
    els.spentValue.textContent = t("spentPre") + " " + formatFull(spent);
    const pct = Math.max(0, Math.min(100, (remaining / BUDGET) * 100));
    els.balanceFill.style.width = pct + "%";
    els.balanceFill.classList.toggle("balancebar__fill--low", pct < 15);

    // Cards
    ITEMS.forEach((item) => {
      const card = els.grid.querySelector(`.card[data-id="${item.id}"]`);
      if (!card) return;
      card.querySelector("[data-name]").textContent = item.name[store.lang];
      card.querySelector("[data-desc]").textContent = item.desc[store.lang];
      card.querySelector("[data-price]").textContent = formatMoney(item.price);
      const qty = store.cart[item.id] || 0;
      const qtyEl = card.querySelector("[data-qty]");
      qtyEl.textContent = qty ? "×" + qty : "";
      card.classList.toggle("card--owned", qty > 0);
      const unaffordable = spent + item.price > BUDGET && qty === 0;
      card.classList.toggle("card--locked", unaffordable);
    });

    renderReceipt(spent);
  }

  function renderReceipt(spent) {
    const ids = Object.keys(store.cart);
    els.receiptItems.innerHTML = "";
    els.receiptEmpty.style.display = ids.length ? "none" : "block";

    ids.forEach((id) => {
      const item = itemById(id);
      if (!item) return;
      const qty = store.cart[id];
      const line = document.createElement("div");
      line.className = "ritem";
      line.innerHTML = `
        <div class="ritem__main">
          <span class="ritem__name">${item.emoji} ${item.name[store.lang]}</span>
          <span class="ritem__sum">${formatFull(item.price * qty)}</span>
        </div>
        <div class="ritem__sub">
          <span class="ritem__unit">${formatFull(item.price)} ${store.lang === "zh" ? "／件" : "each"}</span>
          <span class="ritem__stepper">
            <button type="button" class="step" data-act="dec" data-id="${id}" aria-label="Remove one">−</button>
            <span class="step__qty">${qty}</span>
            <button type="button" class="step" data-act="inc" data-id="${id}" aria-label="Add one">+</button>
          </span>
        </div>
      `;
      els.receiptItems.appendChild(line);
    });

    els.receiptCount.textContent = itemCount();
    els.receiptTotal.textContent = formatFull(spent);

    // A vaguely plausible receipt header
    const now = new Date();
    const pad = (x) => String(x).padStart(2, "0");
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    els.receiptMeta.textContent = `${date}  ·  ${t("cashier")}`;
    els.receiptCode.textContent = randomCode();
  }

  // Stable-ish random transaction code that changes per render (fun detail)
  function randomCode() {
    const chunk = () => Math.random().toString(36).slice(2, 6).toUpperCase();
    return `TXN ${chunk()}-${chunk()}-${chunk()}`;
  }

  // ---------- i18n / theme application ----------
  function applyLang() {
    document.documentElement.lang = store.lang === "zh" ? "zh-CN" : "en";
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.innerHTML = t(el.getAttribute("data-i18n"));
    });
    render();
  }
  function applyTheme() {
    document.documentElement.setAttribute("data-theme", store.theme);
    const icon = els.themeToggle.querySelector(".ctl__icon");
    if (icon) icon.textContent = store.theme === "dark" ? "☀️" : "🌙";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", store.theme === "dark" ? "#0f1115" : "#f4f1ea");
  }

  // ---------- Events ----------
  els.langToggle.addEventListener("click", () => {
    store.lang = store.lang === "en" ? "zh" : "en";
    save();
    applyLang();
  });
  els.themeToggle.addEventListener("click", () => {
    store.theme = store.theme === "dark" ? "light" : "dark";
    save();
    applyTheme();
  });
  els.resetBtn.addEventListener("click", reset);

  // Receipt steppers (event delegation)
  els.receiptItems.addEventListener("click", (e) => {
    const btn = e.target.closest(".step");
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.act === "inc") add(id);
    else remove(id);
  });

  // ---------- Init ----------
  load();
  // First visit: respect the OS dark-mode preference.
  if (!localStorage.getItem("sem.theme") &&
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    store.theme = "dark";
  }
  buildGrid();
  applyTheme();
  applyLang();
})();
