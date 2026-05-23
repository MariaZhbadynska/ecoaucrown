(() => {
  function init() {
    const header = document.querySelector("[data-header]");
    if (!header || header.dataset.inited === "1") return;

    const burger = header.querySelector("[data-burger]");
    const mobile = header.querySelector("#mobileMenu");
    if (!burger || !mobile) return;

    let overlay = document.querySelector(".mobile-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "mobile-overlay";
      document.body.appendChild(overlay);
    }

    mobile.style.zIndex = "1000";

    const lockScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const sbw = window.innerWidth - document.documentElement.clientWidth; // ширина скролбару
      document.body.style.setProperty("--lock-top", `-${y}px`);
      document.body.style.setProperty("--sbw", `${sbw}px`);
      document.body.dataset.lockY = String(y);
      document.body.classList.add("no-scroll");
    };
    const unlockScroll = () => {
      const y = parseInt(document.body.dataset.lockY || "0", 10);
      document.body.classList.remove("no-scroll");
      document.body.style.removeProperty("--lock-top");
      document.body.style.removeProperty("--sbw");
      delete document.body.dataset.lockY;
      window.scrollTo(0, y);
    };

    const setOpen = (open) => {
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      mobile.classList.toggle("is-open", open);
      overlay.classList.toggle("is-open", open);
      open ? lockScroll() : unlockScroll();
    };

    burger.addEventListener("click", () =>
      setOpen(burger.getAttribute("aria-expanded") !== "true")
    );
    overlay.addEventListener("click", () => setOpen(false));

    const closeBtn = mobile.querySelector(".mobile__close");
    if (closeBtn) closeBtn.addEventListener("click", () => setOpen(false));

    mobile.addEventListener("click", (e) => {
      if (e.target.closest("a, [data-cart-open]")) setOpen(false);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    const mq = window.matchMedia("(min-width:901px)");
    mq.addEventListener("change", () => {
      if (mq.matches) setOpen(false);
    });

    setOpen(false);
    header.dataset.inited = "1";
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("partials:ready", init);
})();
