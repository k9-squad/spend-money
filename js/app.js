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
    topbar: document.getElementById("topbar"),
    compactBalance: document.getElementById("compactBalance"),
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
    resetBtn: document.getElementById("resetBtn"),
    scrim: document.getElementById("scrim"),
    sheet: document.getElementById("sheet"),
    sheetGrabber: document.getElementById("sheetGrabber"),
    sheetTitle: document.getElementById("sheetTitle"),
    sheetTotal: document.getElementById("sheetTotal"),
    sheetBody: document.getElementById("sheetBody")
  };

  const reducedMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };

  // ---------- Springs ----------
  // Apple-style parameters: dampingRatio (1 = no overshoot) + response
  // (seconds to approach the target — not a duration). Springs animate
  // from the current value and accept a handed-off velocity, so every
  // motion is interruptible and re-targetable mid-flight.
  function createSpring(opts) {
    const response = opts.response || 0.4;
    const dampingRatio = opts.dampingRatio != null ? opts.dampingRatio : 1;
    const restDelta = opts.restDelta || 0.5;
    const restSpeed = opts.restSpeed || (restDelta * 10);
    const omega = (2 * Math.PI) / response;
    const stiffness = omega * omega;
    const damping = 2 * dampingRatio * omega;

    const s = {
      value: 0,
      velocity: 0,
      target: 0,
      animating: false,
      _raf: 0,
      _last: 0
    };

    function frame(now) {
      let dt = Math.min(0.064, (now - s._last) / 1000);
      s._last = now;
      // Sub-step for stability at stiff settings.
      while (dt > 0) {
        const h = Math.min(dt, 1 / 120);
        const accel = -stiffness * (s.value - s.target) - damping * s.velocity;
        s.velocity += accel * h;
        s.value += s.velocity * h;
        dt -= h;
      }
      if (Math.abs(s.velocity) < restSpeed && Math.abs(s.value - s.target) < restDelta) {
        s.value = s.target;
        s.velocity = 0;
        s.animating = false;
        opts.onUpdate(s.value);
        if (opts.onRest) opts.onRest();
        return;
      }
      opts.onUpdate(s.value);
      s._raf = requestAnimationFrame(frame);
    }

    s.setTarget = function (target, velocity) {
      s.target = target;
      // Blend the handed-off velocity instead of hard-cutting it.
      if (velocity != null) s.velocity = velocity;
      if (reducedMotion.matches) { s.jump(target); return; }
      if (!s.animating) {
        s.animating = true;
        s._last = performance.now();
        s._raf = requestAnimationFrame(frame);
      }
    };
    // Freeze mid-flight at the current presentation value (for grabs).
    s.stop = function () {
      cancelAnimationFrame(s._raf);
      s.animating = false;
    };
    // Set the value directly (1:1 tracking during a drag, or instant settles).
    s.jump = function (v) {
      s.stop();
      s.value = v;
      s.target = v;
      s.velocity = 0;
      opts.onUpdate(v);
    };
    return s;
  }

  // Momentum projection: where a flick would coast to (Apple's
  // exponential-decay form, not the physics-textbook one).
  function project(initialVelocity, decelerationRate) {
    const d = decelerationRate || 0.998;
    return ((initialVelocity / 1000) * d) / (1 - d);
  }

  // Rubber-band: progressive resistance past a boundary instead of a hard stop.
  function rubberband(overshoot, dimension, constant) {
    const c = constant || 0.55;
    return (overshoot * dimension * c) / (dimension + c * Math.abs(overshoot));
  }

  function buzz(pattern) {
    if (reducedMotion.matches) return;
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

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

  // ---------- Animated balance ----------
  // The displayed figure is a spring toward the true remaining amount, so
  // rapid taps re-target mid-count instead of jumping.
  const balanceSpring = createSpring({
    response: 0.55,
    dampingRatio: 1,
    restDelta: 0.4,
    restSpeed: 4,
    onUpdate(v) {
      els.balanceValue.textContent = formatFull(v);
      els.compactBalance.textContent = formatMoney(v);
      const pct = Math.max(0, Math.min(100, (v / BUDGET) * 100));
      els.balanceFill.style.width = pct + "%";
      els.balanceFill.classList.toggle("hero__fill--low", pct < 15);
    }
  });

  // ---------- Cart operations ----------
  function add(id) {
    const item = itemById(id);
    if (!item) return;
    if (spentTotal() + item.price > BUDGET) {
      flashBroke(id);
      return;
    }
    store.cart[id] = (store.cart[id] || 0) + 1;
    buzz(8);
    save();
    render();
    popQty(id);
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

  function popQty(id) {
    if (reducedMotion.matches) return;
    const qtyEl = els.grid.querySelector(`.card[data-id="${id}"] [data-qty]`);
    if (!qtyEl) return;
    qtyEl.classList.add("card__qty--pop");
    setTimeout(() => qtyEl.classList.remove("card__qty--pop"), 90);
  }

  function flashBroke(id) {
    buzz([20, 40, 20]);
    if (reducedMotion.matches) return;
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

    balanceSpring.setTarget(remaining);
    els.spentValue.textContent = t("spentPre") + " " + formatFull(spent);

    // Cards
    ITEMS.forEach((item) => {
      const card = els.grid.querySelector(`.card[data-id="${item.id}"]`);
      if (!card) return;
      card.querySelector("[data-name]").textContent = item.name[store.lang];
      card.querySelector("[data-desc]").textContent = item.desc[store.lang];
      card.querySelector("[data-price]").textContent = formatMoney(item.price);
      const qty = store.cart[item.id] || 0;
      card.querySelector("[data-qty]").textContent = qty ? "×" + qty : "";
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

    // Peek bar: "🧾 Receipt · 3 items    $1,234"
    const count = itemCount();
    const unit = store.lang === "zh" ? " 件" : (count === 1 ? " item" : " items");
    els.sheetTitle.textContent = `🧾 ${t("sheetLabel")} · ${count}${unit}`;
    els.sheetTotal.textContent = formatFull(spent);

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

  // ---------- Bottom sheet ----------
  // translateY in px: 0 = fully open, peekY = only the grab bar showing.
  // Dragging tracks 1:1 with the pointer (respecting the grab offset),
  // rubber-bands past both ends, and on release projects momentum to pick
  // the snap point, handing the release velocity to the spring. Grabbing
  // mid-animation freezes the spring at its presentation value.
  const sheetState = { open: false, peekY: 0 };

  const sheetSpring = createSpring({
    response: 0.3,       // Apple's drawer values: damping 0.8, response 0.3
    dampingRatio: 0.8,
    restDelta: 0.5,
    restSpeed: 5,
    onUpdate: applySheetY,
    onRest: syncSheetOpenState
  });

  function applySheetY(y) {
    els.sheet.style.transform = `translateY(${y}px)`;
    const progress = sheetState.peekY > 0
      ? Math.max(0, Math.min(1, 1 - y / sheetState.peekY))
      : 0;
    els.scrim.style.opacity = (progress * 0.4).toFixed(3);
  }

  function syncSheetOpenState() {
    const open = sheetSpring.target === 0;
    sheetState.open = open;
    els.sheetGrabber.setAttribute("aria-expanded", String(open));
    els.sheet.setAttribute("aria-modal", String(open));
    els.scrim.style.pointerEvents = open ? "auto" : "none";
    document.body.style.overflow = open ? "hidden" : "";
  }

  function layoutSheet() {
    const sheetH = els.sheet.offsetHeight - 40; // minus bottom overdraw
    const peekH = els.sheetGrabber.offsetHeight;
    sheetState.peekY = Math.max(0, sheetH - peekH);
    sheetSpring.jump(sheetState.open ? 0 : sheetState.peekY);
    syncSheetOpenState();
  }

  function setSheetOpen(open, velocity) {
    sheetState.open = open;
    // Unlock scroll as soon as a close begins, not when it settles.
    if (!open) {
      document.body.style.overflow = "";
      els.scrim.style.pointerEvents = "none";
    }
    sheetSpring.setTarget(open ? 0 : sheetState.peekY, velocity);
    syncSheetOpenStateEarly(open);
  }
  function syncSheetOpenStateEarly(open) {
    els.sheetGrabber.setAttribute("aria-expanded", String(open));
  }

  // --- Drag gesture on the grab bar ---
  const drag = { active: false, moved: false, pointerId: 0, startClientY: 0, startValue: 0, history: [] };
  const MOVE_THRESHOLD = 10; // hysteresis before it counts as a drag, not a tap

  els.sheetGrabber.addEventListener("pointerdown", (e) => {
    els.sheetGrabber.setPointerCapture(e.pointerId);
    sheetSpring.stop(); // grab mid-flight: freeze at the presentation value
    drag.active = true;
    drag.moved = false;
    drag.pointerId = e.pointerId;
    drag.startClientY = e.clientY;
    drag.startValue = sheetSpring.value;
    drag.history = [{ t: e.timeStamp, y: sheetSpring.value }];
  });

  els.sheetGrabber.addEventListener("pointermove", (e) => {
    if (!drag.active || e.pointerId !== drag.pointerId) return;
    const dy = e.clientY - drag.startClientY;
    if (!drag.moved && Math.abs(dy) > MOVE_THRESHOLD) drag.moved = true;
    if (!drag.moved) return;

    // 1:1 tracking from where they grabbed it, with soft boundaries.
    let y = drag.startValue + dy;
    const dim = sheetState.peekY || 1;
    if (y < 0) y = -rubberband(-y, dim);
    else if (y > sheetState.peekY) y = sheetState.peekY + rubberband(y - sheetState.peekY, dim);

    sheetSpring.value = y;
    sheetSpring.target = y;
    applySheetY(y);

    drag.history.push({ t: e.timeStamp, y });
    if (drag.history.length > 6) drag.history.shift();
  });

  function releaseVelocity() {
    // px/s from the recent pointer history (not just the last event).
    const h = drag.history;
    const newest = h[h.length - 1];
    let oldest = newest;
    for (let i = h.length - 1; i >= 0; i--) {
      if (newest.t - h[i].t > 100) break;
      oldest = h[i];
    }
    const dt = newest.t - oldest.t;
    return dt > 0 ? ((newest.y - oldest.y) / dt) * 1000 : 0;
  }

  function endDrag(e) {
    if (!drag.active || e.pointerId !== drag.pointerId) return;
    drag.active = false;

    if (!drag.moved) {
      // A tap on the bar toggles the sheet.
      setSheetOpen(!sheetState.open);
      return;
    }

    // Project momentum to where the sheet is headed, snap to the nearer
    // end from there, and hand the finger's velocity to the spring.
    const v = releaseVelocity();
    const projected = sheetSpring.value + project(v);
    const open = projected < sheetState.peekY / 2;
    buzz(6);
    setSheetOpen(open, v);
  }
  els.sheetGrabber.addEventListener("pointerup", endDrag);
  els.sheetGrabber.addEventListener("pointercancel", endDrag);
  // The grabber is a <button>; the pointer handlers own open/close.
  els.sheetGrabber.addEventListener("click", (e) => e.preventDefault());

  els.scrim.addEventListener("click", () => setSheetOpen(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sheetState.open) setSheetOpen(false);
  });
  window.addEventListener("resize", layoutSheet);

  // ---------- Topbar: compact balance when the hero scrolls away ----------
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      els.topbar.classList.toggle("topbar--scrolled", !entries[0].isIntersecting);
    }, { rootMargin: "-56px 0px 0px 0px" });
    io.observe(els.balanceValue);
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
    if (meta) meta.setAttribute("content", store.theme === "dark" ? "#000000" : "#f5f5f7");
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
  balanceSpring.jump(BUDGET - spentTotal());
  applyLang();
  layoutSheet();
})();
