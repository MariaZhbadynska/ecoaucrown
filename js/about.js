function applyImgFallback(img) {
  img.classList.add("is-broken");
  const ph = document.createElement("div");
  ph.style.cssText =
    "position:absolute;inset:0;display:grid;place-items:center;color:#2a5a53;font-weight:900;opacity:.16";
  ph.textContent = "Crown";
  const wrap = img.parentElement;
  if (wrap) {
    wrap.style.position = "relative";
    wrap.appendChild(ph);
  }
}
document.querySelectorAll(".js-img").forEach((img) => {
  img.addEventListener("error", () => applyImgFallback(img));
});

(function () {
  const items = Array.from(document.querySelectorAll("[data-reveal]"));
  if (!items.length) return;

  const markVisible = () => {
    const vh = window.innerHeight || 0;
    items.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.88 && r.bottom > 0) el.classList.add("in-view");
    });
  };

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in-view");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach((el) => io.observe(el));
  }

  window.addEventListener("load", markVisible);
  setTimeout(markVisible, 300);
})();

(function () {
  const nav = document.getElementById("about-nav");
  if (!nav) return;
  const secs = Array.from(document.querySelectorAll("section[id]"));
  if (!secs.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const id = en.target.id;
        nav.querySelectorAll("a").forEach((a) => {
          a.classList.toggle("active", a.getAttribute("href") === "#" + id);
        });
      });
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
  );
  secs.forEach((s) => io.observe(s));
})();

(function () {
  const els = Array.from(document.querySelectorAll("[data-parallax]"));
  if (!els.length) return;
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;

  let y = 0,
    raf = null;
  const tick = () => {
    els.forEach((el) => {
      el.style.transform = `translateY(${y * 0.06}px)`;
    });
    raf = null;
  };
  window.addEventListener(
    "scroll",
    () => {
      y = window.scrollY || 0;
      if (!raf) raf = requestAnimationFrame(tick);
    },
    { passive: true }
  );
})();
(function () {
  var el = document.getElementById("supportEmail");
  if (!el) return;
  var host = (location.hostname || "").replace(/^www\./, "");
  if (!host || host === "localhost" || host === "127.0.0.1")
    host = "ecoaucrown.com";
  var addr = "support@" + host;
  el.textContent = addr;
  el.href = "mailto:" + addr;
})();

(function () {
  const host = document.getElementById("impact");
  if (!host) return;

  function animateCounters() {
    document.querySelectorAll(".icard").forEach((card) => {
      const target = Math.max(0, +card.dataset.target || 0);
      const num = card.querySelector(".num");
      if (!num) return;
      let v = 0;
      const step = () => {
        v += Math.max(1, Math.round((target - v) * 0.12));
        if (v > target) v = target;
        num.textContent = String(v);
        if (v < target) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  const run = () => {
    animateCounters();
    off();
  };
  let off = () => {};
  if ("IntersectionObserver" in window) {
    const once = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) run();
        });
      },
      { threshold: 0.2 }
    );
    once.observe(host);
    off = () => once.disconnect();
  } else {
    run();
  }

  const r = host.getBoundingClientRect();
  if (r.top < (window.innerHeight || 0) * 0.8 && r.bottom > 0) run();
})();
