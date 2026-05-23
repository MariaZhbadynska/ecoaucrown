(function () {
  var DATA = null,
    overlay = null,
    current = null,
    focusables = [];
  var scrollLockY = 0;
  var TIPS_URL = "/tips.html";

  var $ = function (sel, root) {
    return (root || document).querySelector(sel);
  };

  document.addEventListener("DOMContentLoaded", init, { once: true });
  document.addEventListener("click", onGlobalClick, true);
  document.addEventListener("keydown", onKeyDown);

  async function init() {
    try {
      DATA = await fetch("./public/data/data.json", { cache: "no-cache" }).then(
        function (r) {
          return r.json();
        }
      );
    } catch (e) {
      console.warn("[modal] data.json failed → fallback", e);
      DATA = { currency: "£", products: [] };
    }
    window.ProductModal = { open: open, close: close };
  }

  function onGlobalClick(e) {
    var btn = e.target.closest && e.target.closest("[data-view]");
    if (!btn) return;
    e.preventDefault();
    var id = btn.getAttribute("data-view");
    var p = (DATA.products || []).find(function (x) {
      return String(x.id) === String(id);
    });
    if (p) open(p);
  }

  function onKeyDown(e) {
    if (!overlay) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
    if (e.key === "Tab") trapFocus(e);
  }

  function lockBodyScroll() {
    scrollLockY = window.scrollY || document.documentElement.scrollTop || 0;
    document.documentElement.style.scrollBehavior = "auto"; // чтобы не дёргало при возврате
    document.body.style.position = "fixed";
    document.body.style.inset = "0";
    document.body.style.width = "100%";
    document.body.style.top = "-" + scrollLockY + "px";
  }
  function unlockBodyScroll() {
    document.body.style.position = "";
    document.body.style.inset = "";
    document.body.style.width = "";
    document.body.style.top = "";
    window.scrollTo(0, scrollLockY | 0);
    document.documentElement.style.scrollBehavior = ""; // вернуть как было
  }

  function setInnerScrollable(modal) {
    var inner = $(".eco-modal__inner", modal);
    if (!inner) return;

    var vh = window.innerHeight || document.documentElement.clientHeight || 700;
    var maxH = Math.max(320, vh - 60);

    inner.style.maxHeight = maxH + "px";
    inner.style.overflowY = "auto";
    inner.style.webkitOverflowScrolling = "touch";
    inner.style.touchAction = "pan-y";

    var ov = modal.parentElement;
    if (ov) {
      ov.style.overflow = "auto";
      ov.style.webkitOverflowScrolling = "touch";
      ov.style.touchAction = "pan-y";
    }
  }

  function bindResizeRecalc(modal) {
    var recalc = function () {
      setInnerScrollable(modal);
    };
    window.addEventListener("resize", recalc);
    window.addEventListener("orientationchange", recalc);
    modal._recalc = recalc;
  }
  function unbindResizeRecalc(modal) {
    if (modal && modal._recalc) {
      window.removeEventListener("resize", modal._recalc);
      window.removeEventListener("orientationchange", modal._recalc);
      delete modal._recalc;
    }
  }

  function open(p) {
    close();
    current = p;

    var currency = DATA.currency || "£";
    var gallery = (
      p.gallery && p.gallery.length ? p.gallery : p.images || []
    ).slice(0, 4);
    if (!gallery.length) gallery = [""];
    if (gallery.length === 1) gallery = [gallery[0], gallery[0]];

    overlay = document.createElement("div");
    overlay.className = "eco-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");

    var modal = document.createElement("div");
    modal.className = "eco-modal";
    modal.innerHTML =
      '<button class="eco-close" type="button" aria-label="Close">✕</button>' +
      '<div class="eco-modal__inner" role="document">' +
      '<div class="eco-modal__left">' +
      '<div class="eco-main-img"><img src="' +
      esc(gallery[0]) +
      '" alt="' +
      esc(p.title) +
      '"></div>' +
      '<div class="eco-thumbs">' +
      gallery
        .map(function (src, i) {
          return (
            '<button class="eco-thumb ' +
            (i === 0 ? "is-active" : "") +
            '" data-img="' +
            esc(src) +
            '" type="button"><img src="' +
            esc(src) +
            '" alt=""></button>'
          );
        })
        .join("") +
      "</div>" +
      "</div>" +
      '<div class="eco-modal__right">' +
      '<h2 class="eco-title">' +
      esc(p.title) +
      "</h2>" +
      '<div class="eco-price">' +
      esc(currency) +
      num(p.price) +
      "</div>" +
      '<p class="eco-desc">' +
      esc(p.description || "Plant-based. Refillable. Plastic-smart.") +
      "</p>" +
      '<div class="eco-specs">' +
      "<div><strong>Size / Volume</strong><br>" +
      esc(p.size || "—") +
      "</div>" +
      "<div><strong>Type</strong><br>" +
      cap(p.productType || "—") +
      "</div>" +
      "<div><strong>Fragrance</strong><br>" +
      esc((p.fragrance || []).join(", ") || "Unscented") +
      "</div>" +
      "<div><strong>Availability</strong><br>" +
      (p.availability === "in" ? "In stock" : "Out of stock") +
      "</div>" +
      "</div>" +
      '<div class="eco-actions">' +
      '<button class="btn" id="eco-add" data-id="' +
      esc(p.id) +
      '" type="button">Add to cart</button>' +
      '<button class="btn btn--ghost" id="eco-more" type="button">Learn more</button>' +
      "</div>" +
      "</div>" +
      "</div>";

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    lockBodyScroll();

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    modal.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    $(".eco-close", modal) &&
      $(".eco-close", modal).addEventListener("click", close);

    modal.querySelectorAll(".eco-thumb").forEach(function (btn) {
      btn.addEventListener("click", function () {
        modal.querySelectorAll(".eco-thumb").forEach(function (b) {
          b.classList.remove("is-active");
        });
        btn.classList.add("is-active");
        var img = $(".eco-main-img img", modal);
        if (img) img.src = btn.getAttribute("data-img") || "";
      });
    });

    $("#eco-add", modal) &&
      $("#eco-add", modal).addEventListener("click", function () {
        const id = String(current.id);
        if (window.Cart && typeof window.Cart.add === "function") {
          window.Cart.add(id, 1);
        }
        close();
        window.Cart?.open?.();
      });

    $("#eco-more", modal) &&
      $("#eco-more", modal).addEventListener("click", function () {
        window.location.href = current.url || current.link || TIPS_URL;
      });
    modal.setAttribute("tabindex", "-1");
    modal.focus({ preventScroll: true });
    rememberFocusables(modal);

    setInnerScrollable(modal);
    bindResizeRecalc(modal);
  }

  function close() {
    if (!overlay) return;
    var modal = $(".eco-modal", overlay);
    unbindResizeRecalc(modal);
    overlay.remove();
    overlay = null;
    current = null;
    unlockBodyScroll();
  }

  function rememberFocusables(root) {
    focusables = Array.prototype.slice
      .call(
        root.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      )
      .filter(function (el) {
        return !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden");
      });
  }
  function trapFocus(e) {
    if (!focusables.length) return;
    var first = focusables[0],
      last = focusables[focusables.length - 1],
      a = document.activeElement;
    if (e.shiftKey && a === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && a === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function esc(s) {
    var m = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (x) {
      return m[x];
    });
  }
  function cap(s) {
    return String(s || "").replace(
      /(^|\s|[-_/])([a-z])/g,
      function (_, sp, ch) {
        return sp + ch.toUpperCase();
      }
    );
  }
  function num(v) {
    var n = Number(v || 0);
    return n.toFixed(2);
  }
})();
