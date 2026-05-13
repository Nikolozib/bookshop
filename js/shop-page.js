import { loadBooks, createBookCard } from "./shop.js";

let currentFilters = { genre: "all", sort: "newest", search: "" };

async function renderShop() {
  const grid = document.getElementById("shop-grid");
  const count = document.getElementById("results-count");
  if (!grid) return;

  grid.innerHTML = `<div class="loading-books"><i class="fa-solid fa-spinner fa-spin"></i> Loading books...</div>`;
  const books = await loadBooks(currentFilters);
  grid.innerHTML = "";

  if (count) count.textContent = `${books.length} book${books.length !== 1 ? "s" : ""} found`;

  if (books.length === 0) {
    grid.innerHTML = `<div class="no-results"><i class="fa-solid fa-book-open"></i><p>No books found. Try a different search or filter.</p></div>`;
    return;
  }

  books.forEach(book => grid.appendChild(createBookCard(book)));
}

async function buildGenreFilters() {
  const allBooks = await loadBooks({});
  const genres = [...new Set(allBooks.map(b => b.genre).filter(Boolean))].sort();

  const genreList = document.querySelector(".genre-list");
  if (!genreList) return;

  genreList.innerHTML = `<button class="genre-btn active" data-genre="all">All Books</button>`;
  genres.forEach(genre => {
    const btn = document.createElement("button");
    btn.className = "genre-btn";
    btn.dataset.genre = genre;
    btn.textContent = genre;
    genreList.appendChild(btn);
  });


  const params = new URLSearchParams(window.location.search);
  const genreParam = params.get("genre");
  if (genreParam) {
    currentFilters.genre = genreParam;
    genreList.querySelectorAll(".genre-btn").forEach(b => {
      b.classList.toggle("active", b.dataset.genre === genreParam);
    });
  }


  genreList.querySelectorAll(".genre-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      genreList.querySelectorAll(".genre-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilters.genre = btn.dataset.genre;
      renderShop();
    });
  });
}

const sortSelect = document.getElementById("sort-select");
if (sortSelect) {
  sortSelect.addEventListener("change", () => {
    currentFilters.sort = sortSelect.value;
    renderShop();
  });
}

const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");

function doSearch() {
  currentFilters.search = searchInput ? searchInput.value.trim() : "";
  renderShop();
}

if (searchBtn) searchBtn.addEventListener("click", doSearch);
if (searchInput) {
  searchInput.addEventListener("keydown", e => {
    if (e.key === "Enter") doSearch();
  });
}

async function init() {
  await buildGenreFilters();
  renderShop();
}

init();
