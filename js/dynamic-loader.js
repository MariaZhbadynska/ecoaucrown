document.addEventListener("DOMContentLoaded", () => {
  const inject = async (sel, url) => {
    const host = document.querySelector(sel);
    if (!host) return;
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      host.innerHTML = await res.text();
    } catch (e) {
      console.error(`[partials] ${url}:`, e);
    }
  };

  Promise.all([
    inject("#site-header", "./header.html"),
    inject("#site-footer", "./footer.html"),
  ]).then(() => {
    document.dispatchEvent(new Event("partials:ready"));
  });
});
