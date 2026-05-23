const LS_KEY = "crown_cart_v1";
const DATA_URL = "../public/data/data.json";
const confirmBtn = document.querySelector(".btn-submit");
const orderContainer = document.getElementById("orderSummary");

async function loadCatalog() {
  const res = await fetch(DATA_URL);
  return res.json();
}

function fmt(n, currency = "£") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency === "£" ? "GBP" : "USD",
  }).format(n);
}

async function renderOrderSummary() {
  const items = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  const container = document.getElementById("orderSummary");

  if (!items.length) {
    container.innerHTML = "<p class='empty-cart-msg'>Your cart is empty </p>";
    confirmBtn.disabled = true;
    confirmBtn.classList.add("disabled");
    return;
  }

  const catalog = await loadCatalog();
  let total = 0;

  const html = items
    .map((it) => {
      const p = catalog.products.find((pr) => pr.id === it.id);
      if (!p) return "";
      const subtotal = p.price * it.qty;
      total += subtotal;
      return `
        <div class="order-item" data-id="${it.id}">
          <img src="${p.images[0]}" alt="${p.title}">
          <div class="order-details">
            <strong>${p.title}</strong>
            <p>Qty: ${it.qty}</p>
          </div>
          <div class="order-price">${p.price.toFixed(2)} GBP</div>
          <button class="remove-item" data-id="${it.id}" aria-label="Remove item">✕</button>
        </div>
      `;
    })
    .join("");

  container.innerHTML = html + `<div class="order-total">Total: ${fmt(total, catalog.currency)}</div>`;
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".remove-item");
  if (!btn) return;

  const id = btn.dataset.id;
  let cart = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  cart = cart.filter((item) => item.id !== id);
  localStorage.setItem(LS_KEY, JSON.stringify(cart));

  const itemEl = btn.closest(".order-item");
  itemEl.style.transition = "opacity 0.3s ease, transform 0.3s ease";
  itemEl.style.opacity = "0";
  itemEl.style.transform = "translateX(20px)";
  setTimeout(() => itemEl.remove(), 300);
  setTimeout(() => {
    updateTotal();
  }, 350);
});

async function updateTotal() {
  const cart = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  const totalEl = document.querySelector(".order-total");

  if (!cart.length) {
    orderContainer.innerHTML = "<p class='empty-cart-msg'>Your cart is empty </p>";
    confirmBtn.disabled = true;
    confirmBtn.classList.add("disabled");
    return;
  }

  const catalog = await loadCatalog();
  const total = cart.reduce((sum, item) => {
    const p = catalog.products.find((pr) => pr.id === item.id);
    return sum + (p ? p.price * item.qty : 0);
  }, 0);

  totalEl.textContent = `Total: ${fmt(total, catalog.currency)}`;
}

document.getElementById("orderForm").addEventListener("submit", (e) => {
  const cartItems = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  if (!cartItems.length) {
    e.preventDefault();
    showEmptyCartAlert();
    return;
  }

  e.preventDefault();
  const form = document.getElementById("orderForm");
  const summary = document.getElementById("orderSummary");
  const thankYou = document.getElementById("thankYouMsg");
  const progressContainer = document.createElement("div");
  progressContainer.className = "processing-container";


  form.style.transition = "opacity 0.6s ease";
  summary.style.transition = "opacity 0.6s ease";
  form.style.opacity = "0";
  summary.style.opacity = "0";

  setTimeout(() => {
    form.style.display = "none";
    summary.style.display = "none";
    progressContainer.style.display = "block";

    setTimeout(() => {
      progressContainer.querySelector(".progress").style.width = "100%";
    }, 100);

    setTimeout(() => {
      localStorage.removeItem(LS_KEY);
      progressContainer.style.opacity = "0";
      setTimeout(() => {
        progressContainer.remove();
        thankYou.style.display = "block";
        thankYou.style.opacity = "0";
        setTimeout(() => {
          thankYou.style.transition = "opacity 0.8s ease";
          thankYou.style.opacity = "1";
        }, 100);
      }, 500);
    }, 1500);
  }, 600);
});

function showEmptyCartAlert() {
  const alertMessage = document.createElement("div");
  alertMessage.className = "empty-cart-alert";
  alertMessage.innerHTML = `
    <div class="alert-content">
      <p>Your cart is empty! Please add items to your cart before proceeding.</p>
      <button class="close-alert">Close</button>
    </div>
  `;
  document.body.appendChild(alertMessage);
  document.querySelector(".close-alert").addEventListener("click", () => {
    alertMessage.style.opacity = "0";
    setTimeout(() => alertMessage.remove(), 300);
  });
  setTimeout(() => {
    alertMessage.style.opacity = "1";
  }, 100);
}

renderOrderSummary();
