(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const TYPE_LABEL = {
    skincare: "Skincare",
    bulk: "Bulk foods",
    home: "Home goods",
  };

  const state = {
    items: [],
    view: [],
    page: 1,
    per: 9,
    currency: "£",
    sort: "featured",
    filters: { instock: true, types: [], q: "", min: null, max: null },
  };

  const els = {
    grid: $("#grid"),
    pager: $("#pager"),
    count: $("#results-count"),
    q: $("#q"),
    sort: $("#sort"),
    fIn: $("#f-instock"),
    fOut: $("#f-out"),
    pmin: $("#price-min"),
    pmax: $("#price-max"),
    apply: $("#price-apply"),
    reset: $("#reset-filters"),
    chips: $("#type-chips"),
    box: $("#filters"),
    toggle: $("#filters-toggle"),
    panel: $("#filters-panel"),
    close: $("#filters-close"),
    backdrop: $("#filters-backdrop"),
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    bindUI();

    try {
      const r = await fetch("./public/data/data.json", { cache: "no-cache" });
      const data = await r.json();
      state.currency = data.currency || "£";
      state.items = (data.products || []).map(normalize).filter(Boolean);
    } catch (e) {
      state.items = [];
    }

    buildTypeChips();
    apply();
  }

  function normalize(p) {
    const title = (p.title || "").trim();
    if (!title) return null;

    const availability = String(p.availability || "in")
      .toLowerCase()
      .startsWith("in")
      ? "in"
      : "out";
    const price = Number(p.price) || 0;
    const t = String(p.productType || "skincare").toLowerCase();
    const productType = ["skincare", "bulk", "home"].includes(t)
      ? t
      : "skincare";
    const images = Array.isArray(p.images) && p.images.length ? p.images : [""];

    return {
      id: String(p.id || Math.random().toString(36).slice(2, 9)),
      title,
      price,
      productType,
      availability,
      description: String(p.description || ""),
      tags: Array.isArray(p.tags) ? p.tags : [],
      images,
    };
  }

  function bindUI() {
    if (els.sort)
      els.sort.addEventListener("change", () => {
        state.sort = els.sort.value;
        state.page = 1;
        apply();
      });

    if (els.q) {
      let t;
      els.q.addEventListener("input", () => {
        clearTimeout(t);
        t = setTimeout(() => {
          state.filters.q = (els.q.value || "").toLowerCase().trim();
          state.page = 1;
          apply();
        }, 160);
      });
    }

    if (els.fIn)
      els.fIn.addEventListener("change", () => {
        state.filters.instock = !!els.fIn.checked;
        state.page = 1;
        apply();
      });

    if (els.apply)
      els.apply.addEventListener("click", () => {
        state.filters.min = parseNum(els.pmin.value);
        state.filters.max = parseNum(els.pmax.value);
        state.page = 1;
        apply();
        closeFilters();
      });

    if (els.reset)
      els.reset.addEventListener("click", () => {
        resetFilters();
        closeFilters();
      });

    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".pager__btn");
      if (btn) {
        state.page = Number(btn.dataset.page) || 1;
        render();
        window.scrollTo({
          top: $(".catalog__bar").offsetTop,
          behavior: "smooth",
        });
      }
    });

    if (els.toggle)
      els.toggle.addEventListener("click", (e) => {
        e.preventDefault();
        openFilters();
      });
    if (els.close)
      els.close.addEventListener("click", (e) => {
        e.preventDefault();
        closeFilters();
      });
    if (els.backdrop) els.backdrop.addEventListener("click", closeFilters);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeFilters();
    });
    window.addEventListener("resize", () => {
      if (!isMobile()) hardCloseFilters();
    });
  }

  function isMobile() {
    return matchMedia("(max-width:1024px)").matches;
  }

  function openFilters() {
    if (!els.box) return;
    els.box.setAttribute("aria-open", "true");
    document.body.classList.add("filters-open");
    if (els.backdrop) els.backdrop.hidden = false;
    if (els.toggle) els.toggle.setAttribute("aria-expanded", "true");
  }

  function closeFilters() {
    if (!els.box) return;
    if (!isMobile()) return;
    els.box.setAttribute("aria-open", "false");
    document.body.classList.remove("filters-open");
    if (els.backdrop) els.backdrop.hidden = true;
    if (els.toggle) els.toggle.setAttribute("aria-expanded", "false");
  }

  function hardCloseFilters() {
    if (!els.box) return;
    els.box.setAttribute("aria-open", "false");
    document.body.classList.remove("filters-open");
    if (els.backdrop) els.backdrop.hidden = true;
    if (els.toggle) els.toggle.setAttribute("aria-expanded", "false");
  }

  function buildTypeChips() {
    const have = new Set(state.items.map((i) => i.productType));
    const order = ["skincare", "bulk", "home"].filter((x) => have.has(x));

    els.chips.innerHTML = order
      .map(
        (t) =>
          `<button type="button" class="chip" data-type="${t}" aria-pressed="false">${
            TYPE_LABEL[t] || t
          }</button>`
      )
      .join("");

    $$(".chip", els.chips).forEach((chip) => {
      chip.addEventListener("click", () => {
        const t = chip.dataset.type;
        const idx = state.filters.types.indexOf(t);
        if (idx > -1) {
          state.filters.types.splice(idx, 1);
          chip.classList.remove("is-active");
          chip.setAttribute("aria-pressed", "false");
        } else {
          state.filters.types.push(t);
          chip.classList.add("is-active");
          chip.setAttribute("aria-pressed", "true");
        }
        state.page = 1;
        apply();
        closeFilters();
      });
    });
  }

  function apply() {
    let list = state.items.slice();
    const f = state.filters;

    if (f.instock) list = list.filter((p) => p.availability === "in");
    if (f.min != null) list = list.filter((p) => p.price >= f.min);
    if (f.max != null) list = list.filter((p) => p.price <= f.max);
    if (f.types.length)
      list = list.filter((p) => f.types.includes(p.productType));

    if (f.q) {
      const q = f.q;
      list = list.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(q) ||
          (TYPE_LABEL[p.productType] || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          (p.tags || []).join(" ").toLowerCase().includes(q)
      );
    }

    switch (state.sort) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "title-asc":
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title-desc":
        list.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        list.sort((a, b) => a.title.localeCompare(b.title));
    }

    state.view = list;
    render();
  }

  function render() {
    const total = state.view.length;
    if (els.count)
      els.count.textContent = `${total} product${total === 1 ? "" : "s"}`;

    if (!total) {
      els.grid.innerHTML = `
          <div class="empty">
            <div class="empty__box">
              <h3 class="empty__title">Nothing found</h3>
              <p>Try to change filters or clear the search.</p>
            </div>
          </div>`;
      if (els.pager) els.pager.innerHTML = "";
      return;
    }

    const pages = Math.max(1, Math.ceil(total / state.per));
    if (state.page > pages) state.page = pages;

    const from = (state.page - 1) * state.per;
    const to = from + state.per;
    const slice = state.view.slice(from, to);

    els.grid.innerHTML = slice.map(card).join("");
    buildPager(pages);
  }

  function card(p) {
    const badge = (p.tags || []).includes("bestseller")
      ? `<div class="badge">Best seller</div>`
      : "";
    const oos = p.availability !== "in" ? " card--oos" : "";
    const img = (p.images && p.images[0]) || "";

    return `
        <article class="card${oos}">
          <div class="card__img">
            ${badge}
            <img src="${escapeHTML(img)}" alt="${escapeHTML(p.title)}">
          </div>
          <div class="card__body">
            <h3 class="card__title">${escapeHTML(p.title)}</h3>
            <div class="card__meta">${escapeHTML(
              TYPE_LABEL[p.productType] || "Product"
            )}</div>
            <div class="card__price">${state.currency}${p.price.toFixed(
      2
    )}</div>
            <div class="card__actions">
              <button class="btn" data-view="${escapeHTML(p.id)}">View</button>
              <button class="btn btn--ghost" data-add="${escapeHTML(
                p.id
              )}">Add</button>
            </div>
          </div>
        </article>
      `;
  }

  function buildPager(pages) {
    if (!els.pager) return;
    if (pages <= 1) {
      els.pager.innerHTML = "";
      return;
    }
    let html = "";
    for (let i = 1; i <= pages; i++) {
      html += `<button class="pager__btn ${
        i === state.page ? "is-active" : ""
      }" data-page="${i}">${i}</button>`;
    }
    els.pager.innerHTML = html;
  }

  function parseNum(v) {
    const n = parseFloat(String(v || "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  function escapeHTML(s) {
    return String(s ?? "").replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[m])
    );
  }
  function resetFilters() {
    state.filters = { instock: true, types: [], q: "", min: null, max: null };
    state.sort = "featured";
    state.page = 1;
    if (els.q) els.q.value = "";
    if (els.fIn) els.fIn.checked = true;
    if (els.pmin) els.pmin.value = "";
    if (els.pmax) els.pmax.value = "";
    if (els.sort) els.sort.value = "featured";
    $$(".chip", els.chips).forEach((c) => {
      c.classList.remove("is-active");
      c.setAttribute("aria-pressed", "false");
    });
    apply();
  }
})();
