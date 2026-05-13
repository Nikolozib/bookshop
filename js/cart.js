import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}
function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function renderCart() {
  const cart = getCart();
  const container = document.getElementById("cart-items");
  const emptyMsg = document.getElementById("cart-empty");
  const cartSummary = document.getElementById("cart-summary");
  const subtotalEl = document.getElementById("cart-subtotal");
  const totalEl = document.getElementById("cart-total");

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = "";
    if (emptyMsg) emptyMsg.style.display = "block";
    if (cartSummary) cartSummary.style.display = "none";
    return;
  }

  if (emptyMsg) emptyMsg.style.display = "none";
  if (cartSummary) cartSummary.style.display = "block";

  container.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item-img">
        <img src="${item.image || 'assets/images/placeholder.svg'}" alt="${item.title}">
      </div>
      <div class="cart-item-details">
        <h4>${item.title}</h4>
        <p class="cart-item-price">$${Number(item.price).toFixed(2)}</p>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" data-action="decrease" data-id="${item.id}"><i class="fa-solid fa-minus"></i></button>
        <span class="qty-value">${item.quantity}</span>
        <button class="qty-btn" data-action="increase" data-id="${item.id}"><i class="fa-solid fa-plus"></i></button>
      </div>
      <div class="cart-item-total">$${(item.price * item.quantity).toFixed(2)}</div>
      <button class="cart-remove" data-id="${item.id}"><i class="fa-solid fa-trash"></i></button>
    </div>
  `).join("");

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal > 35 ? 0 : 4.99;
  const total = subtotal + shipping;

  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (document.getElementById("cart-shipping"))
    document.getElementById("cart-shipping").textContent = shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

document.addEventListener("click", (e) => {
  const qtyBtn = e.target.closest(".qty-btn");
  const removeBtn = e.target.closest(".cart-remove");

  if (qtyBtn) {
    const id = qtyBtn.dataset.id;
    const action = qtyBtn.dataset.action;
    let cart = getCart();
    const item = cart.find(i => i.id === id);
    if (item) {
      if (action === "increase") item.quantity += 1;
      if (action === "decrease") {
        item.quantity -= 1;
        if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
      }
    }
    saveCart(cart);
    renderCart();
    window.dispatchEvent(new Event("storage"));
  }

  if (removeBtn) {
    const id = removeBtn.dataset.id;
    let cart = getCart().filter(i => i.id !== id);
    saveCart(cart);
    renderCart();
    window.dispatchEvent(new Event("storage"));
  }
});

const checkoutForm = document.getElementById("checkout-form");
if (checkoutForm) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      const emailField = document.getElementById("checkout-email");
      if (emailField) emailField.removeAttribute("readonly");
    } else {
      const emailField = document.getElementById("checkout-email");
      if (emailField) {
        emailField.value = user.email;
        emailField.setAttribute("readonly", true);
      }
    }
  });

  checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const cart = getCart();
    if (cart.length === 0) return;

    const btn = checkoutForm.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Processing...";


    setTimeout(() => {
      localStorage.removeItem("cart");
      document.getElementById("checkout-success").style.display = "block";
      document.getElementById("cart-page-content").style.display = "none";
    }, 1500);
  });
}

renderCart();
