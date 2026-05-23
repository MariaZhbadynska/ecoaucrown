(() => {
  const KEY = "ecoaucrown_cookies_accepted_v1";
  const DELAY = 2500;
  const showBar = (bar) => {
    bar.removeAttribute("hidden");
    bar.classList.add("is-visible");
  };

  const init = () => {
    const bar = document.querySelector("[data-cookiebar]");
    if (!bar) return;

    const accepted = localStorage.getItem(KEY) === "1";
    if (!accepted) {
      setTimeout(() => showBar(bar), DELAY);
    }

    bar
      .querySelector("[data-accept-cookies]")
      ?.addEventListener("click", () => {
        localStorage.setItem(KEY, "1");
        bar.classList.remove("is-visible");
        setTimeout(() => bar.setAttribute("hidden", ""), 400);
      });
  };

  document.addEventListener("partials:ready", init, { once: true });
  if (document.readyState !== "loading") setTimeout(init, 0);
  else document.addEventListener("DOMContentLoaded", init, { once: true });
})();
