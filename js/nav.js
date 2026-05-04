import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const total = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll(".cart-badge").forEach(b => {
    b.textContent = total;
    b.style.display = total > 0 ? "flex" : "none";
  });
}

onAuthStateChanged(auth, async (user) => {
  const navAuth  = document.getElementById("nav-auth");
  const navUser  = document.getElementById("nav-user");
  const navAdmin = document.getElementById("nav-admin");

  if (user) {
    if (navAuth) navAuth.style.display = "none";
    if (navUser) {
      navUser.style.display = "flex";
      const nameEl = document.getElementById("nav-username");
      if (nameEl) nameEl.textContent = user.displayName || user.email.split("@")[0];
    }
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().role === "admin") {
        if (navAdmin) navAdmin.style.display = "flex";
      }
    } catch {}
  } else {
    if (navAuth) navAuth.style.display = "flex";
    if (navUser) navUser.style.display = "none";
    if (navAdmin) navAdmin.style.display = "none";
  }
});

const userMenu = document.getElementById("nav-user");
if (userMenu) {
  const toggle = userMenu.querySelector(".nav-user-toggle");
  const dropdown = userMenu.querySelector(".nav-dropdown");

  if (toggle && dropdown) {
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("open");
    });

    
    document.addEventListener("click", (e) => {
      if (!userMenu.contains(e.target)) {
        dropdown.classList.remove("open");
      }
    });
  }
}

const signOutBtn = document.getElementById("sign-out-btn");
if (signOutBtn) {
  signOutBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    try {
      await signOut(auth);
      window.location.href = "index.html";
    } catch (err) {
      console.error("Sign out error:", err);
    }
  });
}

const menuToggle = document.getElementById("menu-toggle");
const navLinks   = document.getElementById("nav-links");
if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
    menuToggle.classList.toggle("active");
  });
}

document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    if (navLinks) navLinks.classList.remove("open");
    if (menuToggle) menuToggle.classList.remove("active");
  });
});

updateCartCount();
window.addEventListener("storage", updateCartCount);
