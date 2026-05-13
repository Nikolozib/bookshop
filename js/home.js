import { loadBooks, createBookCard } from "./shop.js";

async function initHome() {

  const allBooks = await loadBooks({});
  const genres = [...new Set(allBooks.map(b => b.genre).filter(Boolean))].sort();

  const filtersEl = document.querySelector(".genre-filters");
  if (filtersEl) {
    filtersEl.innerHTML = `<button class="genre-filter-btn active" data-genre="all">All</button>`;
    genres.forEach(genre => {
      const btn = document.createElement("button");
      btn.className = "genre-filter-btn";
      btn.dataset.genre = genre;
      btn.textContent = genre;
      filtersEl.appendChild(btn);
    });

    filtersEl.querySelectorAll(".genre-filter-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        filtersEl.querySelectorAll(".genre-filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const genre = btn.dataset.genre;
        const grid = document.getElementById("featured-grid");
        if (grid) {
          grid.innerHTML = `<div class="loading-books"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</div>`;
          const books = await loadBooks({ genre, limit: 4 });
          grid.innerHTML = "";
          if (books.length === 0) {
            grid.innerHTML = `<p class="no-books" style="padding:40px;color:var(--text-light)">No books in this genre yet.</p>`;
          } else {
            books.forEach(b => grid.appendChild(createBookCard(b)));
          }
        }
      });
    });
  }


  const featuredGrid = document.getElementById("featured-grid");
  if (featuredGrid) {
    featuredGrid.innerHTML = `<div class="loading-books"><i class="fa-solid fa-spinner fa-spin"></i> Loading books...</div>`;
    const books = await loadBooks({ limit: 4, sort: "newest" });
    featuredGrid.innerHTML = "";
    if (books.length === 0) {
      featuredGrid.innerHTML = `<p class="no-books" style="padding:40px;color:var(--text-light)">No books available yet.</p>`;
    } else {
      books.forEach(book => featuredGrid.appendChild(createBookCard(book)));
    }
  }


  const newGrid = document.getElementById("new-arrivals-grid");
  if (newGrid) {
    const books = await loadBooks({ limit: 4 });
    newGrid.innerHTML = "";
    books.forEach(book => newGrid.appendChild(createBookCard(book)));
  }


  const newsletterForm = document.getElementById("newsletter-form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const msg = document.getElementById("newsletter-msg");
      if (msg) {
        msg.textContent = "Thank you for subscribing! Your 15% discount code: PAGETURN15";
        msg.className = "form-msg success";
      }
      newsletterForm.reset();
    });
  }
}

initHome();
