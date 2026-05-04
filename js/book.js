import { db } from "./firebase-config.js";
import { doc, getDoc, collection, getDocs, query, where, limit } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { addToCart, createBookCard } from "./shop.js";

const params = new URLSearchParams(window.location.search);
const bookId = params.get("id");

async function loadBook() {
  if (!bookId) {
    window.location.href = "shop.html";
    return;
  }

  const snap = await getDoc(doc(db, "Books", bookId));
  if (!snap.exists()) {
    window.location.href = "shop.html";
    return;
  }

  const raw = snap.data();
  const book = {
    id: snap.id,
    title: raw.title || raw.name || "Untitled",
    author: raw.author || "Unknown",
    genre: raw.genre || "General",
    price: raw.price || 0,
    originalPrice: raw.originalPrice || null,
    imageUrl: raw.imageUrl || raw.coverImage || raw.image || "",
    description: raw.description || "",
    pages: raw.pages || "—",
    publisher: raw.publisher || "—",
    isbn: raw.isbn || "—",
    language: raw.language || "English",
    isNew: raw.isNew || false,
    isSale: raw.isSale || false,
  };

  document.title = `${book.title} — PageTurn`;
  document.getElementById("book-cover").src = book.imageUrl || "assets/images/placeholder.svg";
  document.getElementById("book-cover").alt = book.title;
  document.getElementById("book-title").textContent = book.title;
  document.getElementById("book-author").textContent = `by ${book.author}`;
  document.getElementById("book-genre").textContent = book.genre;
  document.getElementById("book-description").textContent = book.description || "No description available.";
  document.getElementById("book-pages").textContent = book.pages || "—";
  document.getElementById("book-publisher").textContent = book.publisher || "—";
  document.getElementById("book-isbn").textContent = book.isbn || "—";
  document.getElementById("book-language").textContent = book.language || "English";

  const priceEl = document.getElementById("book-price");
  if (book.isSale && book.originalPrice) {
    priceEl.innerHTML = `<span class="price-original">$${Number(book.originalPrice).toFixed(2)}</span> <span class="price-current">$${Number(book.price).toFixed(2)}</span>`;
  } else {
    priceEl.innerHTML = `<span class="price-current">$${Number(book.price).toFixed(2)}</span>`;
  }

  
  const addBtn = document.getElementById("add-to-cart-btn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      addToCart({ id: book.id, title: book.title, price: book.price, image: book.imageUrl || "" });
    });
  }

  
  const relatedSnap = await getDocs(query(
    collection(db, "Books"),
    where("genre", "==", book.genre),
    limit(4)
  ));
  const relatedGrid = document.getElementById("related-books");
  if (relatedGrid) {
    let count = 0;
    relatedSnap.forEach(d => {
      if (d.id !== bookId && count < 4) {
        relatedGrid.appendChild(createBookCard({ id: d.id, ...d.data() }));
        count++;
      }
    });
  }
}

loadBook();
