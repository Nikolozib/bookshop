import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const tabBtns = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");

tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.tab;
    tabBtns.forEach(b => b.classList.remove("active"));
    tabPanels.forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(target).classList.add("active");
    clearMessages();
  });
});

const registerForm = document.getElementById("register-form");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;
    const confirm = document.getElementById("reg-confirm").value;

    if (password !== confirm) {
      showMessage("register-msg", "Passwords do not match.", "error");
      return;
    }
    if (password.length < 6) {
      showMessage("register-msg", "Password must be at least 6 characters.", "error");
      return;
    }

    const btn = registerForm.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Creating account...";

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await setDoc(doc(db, "users", cred.user.uid), {
        name,
        email,
        role: "user",
        createdAt: new Date().toISOString()
      });
      showMessage("register-msg", "Account created! Redirecting...", "success");
      setTimeout(() => window.location.href = "index.html", 1500);
    } catch (err) {
      showMessage("register-msg", getErrorMessage(err.code), "error");
      btn.disabled = false;
      btn.textContent = "Create Account";
    }
  });
}

const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    const btn = loginForm.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Signing in...";

    try {
      await signInWithEmailAndPassword(auth, email, password);
      const redirect = new URLSearchParams(window.location.search).get("redirect") || "index.html";
      window.location.href = redirect;
    } catch (err) {
      showMessage("login-msg", getErrorMessage(err.code), "error");
      btn.disabled = false;
      btn.textContent = "Sign In";
    }
  });
}

const forgotBtn = document.getElementById("forgot-password");
if (forgotBtn) {
  forgotBtn.addEventListener("click", async () => {
    const email = document.getElementById("login-email").value.trim();
    if (!email) {
      showMessage("login-msg", "Enter your email first.", "error");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      showMessage("login-msg", "Password reset email sent!", "success");
    } catch (err) {
      showMessage("login-msg", getErrorMessage(err.code), "error");
    }
  });
}

document.querySelectorAll(".toggle-password").forEach(btn => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    if (input.type === "password") {
      input.type = "text";
      btn.querySelector("i").classList.replace("fa-eye", "fa-eye-slash");
    } else {
      input.type = "password";
      btn.querySelector("i").classList.replace("fa-eye-slash", "fa-eye");
    }
  });
});

function showMessage(id, text, type) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = text;
    el.className = `form-msg ${type}`;
  }
}

function clearMessages() {
  document.querySelectorAll(".form-msg").forEach(el => {
    el.textContent = "";
    el.className = "form-msg";
  });
}

function getErrorMessage(code) {
  const map = {
    "auth/email-already-in-use": "This email is already registered.",
    "auth/invalid-email": "Invalid email address.",
    "auth/weak-password": "Password is too weak.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "auth/invalid-credential": "Invalid email or password."
  };
  return map[code] || "Something went wrong. Please try again.";
}
