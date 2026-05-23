(() => {
  const LS_KEY = "crown_cart_v1";
  const DATA_URL = "./public/data/data.json";

  const state = {
    items: [],
    catalog: { currency: "£", products: [] },
    drawerOpen: false,
  };

  document.addEventListener("click", (e) => {
    const t = e.target;

    if (t.closest("[data-cart-open]")) {
      e.preventDefault();
      return;
    }

    if (t.closest("#cart-overlay") || t.closest("#cart-close")) {
      e.preventDefault();
      closeCart();
      return;
    }
  });

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const guessISO = (sym) => {
    const s = (sym || "£").trim();
    if (s === "£") return "GBP";
    if (s === "$") return "USD";
    if (s === "€") return "EUR";
    return "GBP";
  };
  const fmt = (n) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: guessISO(state.catalog.currency),
    }).format(n || 0);

  const lsLoad = () => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    } catch {
      return [];
    }
  };
  const lsSave = (v) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(v));
    } catch {}
  };

  const getProduct = (id) =>
    (state.catalog.products || []).find((p) => p.id === id) || null;
  const inStock = (id) => {
    const p = getProduct(id);
    return !!p && p.availability !== "out";
  };
  const countItems = () => state.items.reduce((s, it) => s + (it.qty || 0), 0);

  function totals() {
    let subtotal = 0;
    for (const it of state.items) {
      const p = getProduct(it.id);
      if (p) subtotal += (p.price || 0) * (it.qty || 1);
    }
    const shipping = subtotal > 0 ? 0 : 0;
    return { subtotal, shipping, total: subtotal + shipping };
  }

  function normalize() {
    state.items = state.items
      .map((x) => ({
        id: String(x.id || "").trim(),
        qty: Math.max(1, Math.min(99, parseInt(x.qty || 1, 10))),
      }))
      .filter((x) => x.id);
  }

  function add(id, qty = 1) {
    const p = getProduct(id);
    if (!p) return toast("Unknown product: " + id);
    if (!inStock(id)) return toast("This item is out of stock");
    const it = state.items.find((x) => x.id === id);
    if (it) it.qty = Math.min(99, it.qty + qty);
    else state.items.push({ id, qty: Math.max(1, qty | 0) });
    persist();
  }
  function updateQty(id, qty) {
    const it = state.items.find((x) => x.id === id);
    if (!it) return;
    it.qty = Math.max(1, Math.min(99, parseInt(qty || 1, 10)));
    persist();
  }
  function removeItem(id) {
    state.items = state.items.filter((x) => x.id !== id);
    persist();
  }
  function persist() {
    normalize();
    lsSave(state.items);
    render();
    document.dispatchEvent(
      new CustomEvent("cart:change", {
        detail: { items: state.items, totals: totals() },
      })
    );
  }

  function ensureUI() {
    let overlay = $("#cart-overlay");
    let drawer = $("#cart-drawer");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "cart-overlay";
      overlay.className = "cart-overlay";
      document.body.appendChild(overlay);
    }
    if (!drawer) {
      drawer = document.createElement("aside");
      drawer.id = "cart-drawer";
      drawer.className = "cart-drawer";
      drawer.innerHTML = `
        <div class="cart-hd">
          <div class="cart-title">Your bag</div>
          <button class="cart-close" id="cart-close" aria-label="Close cart">✕</button>
        </div>
        <div class="cart-body" id="cart-body"></div>
        <div class="cart-ft">
          <div class="tot"><span class="lbl">Subtotal</span><span class="val" id="tot-sub">£0.00</span></div>
          <div class="tot"><span class="lbl">Shipping</span><span class="val" id="tot-ship">£0.00</span></div>
          <div class="tot"><span class="lbl">Total</span><span class="val" id="tot-all">£0.00</span></div>
          <button class="cart-checkout" id="cart-checkout">Checkout</button>
        </div>
      `;
      document.body.appendChild(drawer);
    }
  }
  function open() {
    $("#cart-overlay")?.classList.add("show");
    $("#cart-drawer")?.classList.add("open");
    state.drawerOpen = true;
  }
  function close() {
    $("#cart-overlay")?.classList.remove("show");
    $("#cart-drawer")?.classList.remove("open");
    state.drawerOpen = false;
  }

  function render() {
    const badge = $("#cart-badge");
    if (badge) badge.textContent = String(countItems());
    const body = $("#cart-body");
    if (!body) return;

    const checkoutBtn = $("#cart-checkout");

    if (!state.items.length) {
      body.innerHTML = `<div class="cart-empty">Your cart is empty</div>`;
      checkoutBtn.disabled = true;
      checkoutBtn.classList.add("disabled");
    } else {
      body.innerHTML = state.items
        .map((it) => {
          const p = getProduct(it.id) || {
            id: it.id,
            title: it.id,
            price: 0,
            images: [],
          };
          const img = (p.images && p.images[0]) || "";
          return `
          <div class="ci" data-id="${p.id}">
            <div class="ci-img">${
              img
                ? `<img src="${img}" alt="${escapeHtml(p.title || p.id)}">`
                : placeholder()
            }</div>
            <div>
              <div class="ci-ttl">${escapeHtml(p.title || p.id)}</div>
              <div class="ci-qty">
                <button type="button" data-dec="${p.id}">−</button>
                <input type="text" value="${it.qty}" data-qty="${
            p.id
          }" inputmode="numeric">
                <button type="button" data-inc="${p.id}">+</button>
              </div>
            </div>
            <div style="display:grid;gap:6px;justify-items:end">
              <div class="ci-price">${fmt((p.price || 0) * (it.qty || 1))}</div>
              <button class="ci-del" type="button" data-del="${
                p.id
              }">Remove</button>
            </div>
          </div>
        `;
        })
        .join("");

      checkoutBtn.disabled = false;
      checkoutBtn.classList.remove("disabled");
    }

    const t = totals();
    const setTxt = (sel, v) => {
      const el = $(sel);
      if (el) el.textContent = v;
    };
    setTxt("#tot-sub", fmt(t.subtotal));
    setTxt("#tot-ship", fmt(t.shipping));
    setTxt("#tot-all", fmt(t.total));
  }

  const escapeHtml = (s) =>
    String(s || "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[c])
    );
  const placeholder = () =>
    `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="36" height="36" rx="8" stroke="#e6efed"/><path d="M14 30l6-6 4 4 8-8 2 2" stroke="#c7dcd8" stroke-width="2" fill="none"/></svg>`;

  let toastTimer = null;
  function toast(msg) {
    let t = $("#cart-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "cart-toast";
      t.className = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2000);
  }

  document.addEventListener("click", (e) => {
    const t = e.target;

    const openBtn = t.closest("[data-cart-open]");
    if (openBtn) {
      e.preventDefault();
      open();
      return;
    }

    if (t.closest("#cart-overlay") || t.closest("#cart-close")) {
      e.preventDefault();
      close();
      return;
    }

    const addBtn = t.closest("[data-add]");
    if (addBtn) {
      e.preventDefault();
      const id =
        addBtn.getAttribute("data-id") ||
        addBtn.getAttribute("data-product") ||
        addBtn.getAttribute("data-add") ||
        addBtn.closest("[data-product-id]")?.getAttribute("data-product-id");
      const qty = parseInt(addBtn.getAttribute("data-qty") || "1", 10) || 1;
      if (!id) return toast("Missing product id");
      add(id, qty);
      open();
      return;
    }

    const dec = t.closest("[data-dec]");
    if (dec) {
      const id = dec.getAttribute("data-dec");
      const it = state.items.find((i) => i.id === id);
      if (it) updateQty(id, it.qty - 1);
      return;
    }
    const inc = t.closest("[data-inc]");
    if (inc) {
      const id = inc.getAttribute("data-inc");
      const it = state.items.find((i) => i.id === id);
      if (it) updateQty(id, it.qty + 1);
      return;
    }

    const del = t.closest("[data-del]");
    if (del) {
      const id = del.getAttribute("data-del");
      removeItem(id);
      return;
    }

    if (t.closest("#cart-checkout")) {
      e.preventDefault();
      window.location.href = "./make-order.html";
      return;
    }
  });

  document.addEventListener("input", (e) => {
    const inp = e.target.closest("input[data-qty]");
    if (!inp) return;
    inp.value = inp.value.replace(/[^0-9]/g, "");
  });
  document.addEventListener("change", (e) => {
    const inp = e.target.closest("input[data-qty]");
    if (!inp) return;
    const id = inp.getAttribute("data-qty");
    updateQty(id, parseInt(inp.value || "1", 10));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.drawerOpen) close();
  });

  document.addEventListener("DOMContentLoaded", async () => {
    ensureUI();
    state.items = lsLoad();
    normalize();
    try {
      const r = await fetch(DATA_URL, { cache: "no-cache" });
      const data = await r.json();
      state.catalog.currency = data.currency || state.catalog.currency;
      state.catalog.products = Array.isArray(data.products)
        ? data.products
        : [];
    } catch (e) {
      console.warn("[cart] data.json failed", e);
    }
    render();

    window.Cart = {
      add: (id, qty) => add(id, qty),
      remove: removeItem,
      updateQty,
      clear: () => {
        state.items = [];
        persist();
      },
      getItems: () => state.items.slice(),
      getTotals: totals,
      open,
      close,
    };

    document.dispatchEvent(
      new CustomEvent("cart:ready", {
        detail: { items: state.items, totals: totals() },
      })
    );
  });
})();
