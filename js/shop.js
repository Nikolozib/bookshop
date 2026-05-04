import { db } from "./firebase-config.js";
import {
  collection, getDocs, query, where, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

function normalizeBook(id, data) {
  return {
    id,
    title: data.title || data.name || "Untitled",
    author: data.author || "Unknown",
    genre: data.genre || "General",
    price: data.price || 0,
    originalPrice: data.originalPrice || null,
    imageUrl: data.imageUrl || data.coverImage || data.image || "",
    description: data.description || "",
    pages: data.pages || "",
    publisher: data.publisher || "",
    isbn: data.isbn || "",
    language: data.language || "English",
    isNew: data.isNew || false,
    isSale: data.isSale || false,
    createdAt: data.createdAt || "",
    quantity: data.quantity || null,
    rating: data.rating || null,
  };
}

export async function loadBooks(filters = {}) {
  try {

    let snap = null;
    let constraints = [];

    if (filters.genre && filters.genre !== "all") {
      constraints.push(where("genre", "==", filters.genre));
    }
    if (filters.limit) {
      constraints.push(limit(filters.limit));
    }

    try {
      const q = collection(db, "Books");
      snap = await getDocs(constraints.length ? query(q, ...constraints) : q);
      if (snap.empty) throw new Error("empty");
    } catch {
      const q = collection(db, "books");
      snap = await getDocs(constraints.length ? query(q, ...constraints) : q);
    }

    let books = [];
    snap.forEach(doc => books.push(normalizeBook(doc.id, doc.data())));

    if (filters.search) {
      const s = filters.search.toLowerCase();
      books = books.filter(b =>
        b.title?.toLowerCase().includes(s) ||
        b.author?.toLowerCase().includes(s) ||
        b.genre?.toLowerCase().includes(s)
      );
    }

    if (filters.sort === "price-asc") books.sort((a, b) => a.price - b.price);
    if (filters.sort === "price-desc") books.sort((a, b) => b.price - a.price);
    if (filters.sort === "title") books.sort((a, b) => a.title.localeCompare(b.title));
    if (filters.sort === "newest") books.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return books;
  } catch (err) {
    console.error("Error loading books:", err);
    return [];
  }
}

export function createBookCard(book) {
  const card = document.createElement("div");
  card.className = "book-card";
  card.innerHTML = `
    <a href="book.html?id=${book.id}" class="book-card-link">
      <div class="book-cover">
        <img src="${book.imageUrl || 'assets/images/placeholder.svg'}" alt="${book.title}" loading="lazy">
        ${book.isNew ? '<span class="badge badge-new">New</span>' : ''}
        ${book.isSale ? `<span class="badge badge-sale">Sale</span>` : ''}
      </div>
      <div class="book-info">
        <span class="book-genre">${book.genre || 'General'}</span>
        <h3 class="book-title">${book.title}</h3>
        <p class="book-author">${book.author}</p>
        <div class="book-price-row">
          ${book.isSale && book.originalPrice
      ? `<span class="price-original">$${Number(book.originalPrice).toFixed(2)}</span>`
      : ''}
          <span class="price-current">$${Number(book.price).toFixed(2)}</span>
        </div>
      </div>
    </a>
    <button class="btn-add-cart" data-id="${book.id}" data-title="${book.title}" data-price="${book.price}" data-image="${book.imageUrl || ''}">
      <i class="fa-solid fa-cart-plus"></i> Add to Cart
    </button>
  `;
  return card;
}

export function addToCart(item) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const existing = cart.find(i => i.id === item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge();
  showCartToast(item.title);
}

function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const total = cart.reduce((s, i) => s + i.quantity, 0);
  document.querySelectorAll(".cart-badge").forEach(b => {
    b.textContent = total;
    b.style.display = total > 0 ? "flex" : "none";
  });
}

function showCartToast(title) {
  let toast = document.getElementById("cart-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "cart-toast";
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fa-solid fa-check"></i> <strong>${title}</strong> added to cart`;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-add-cart");
  if (btn) {
    addToCart({
      id: btn.dataset.id,
      title: btn.dataset.title,
      price: parseFloat(btn.dataset.price),
      image: btn.dataset.image
    });
  }
});
