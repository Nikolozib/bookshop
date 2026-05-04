import { auth, db, storage } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const BOOKS_COL = "Books"; 
let editingId = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "auth.html?redirect=admin.html";
    return;
  }
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists() || userDoc.data().role !== "admin") {
    document.getElementById("admin-content").style.display = "none";
    document.getElementById("admin-denied").style.display = "block";
    return;
  }
  document.getElementById("admin-content").style.display = "block";
  loadBooks();
});

async function loadBooks() {
  const tbody = document.getElementById("books-table-body");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" class="table-empty"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</td></tr>`;

  try {
    const snap = await getDocs(collection(db, BOOKS_COL));

    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="6" class="table-empty">No books yet. Add one above.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    snap.forEach(d => {
      const book = { id: d.id, ...d.data() };
      
      const title = book.title || book.name || "Untitled";
      const imageUrl = book.imageUrl || book.coverImage || "assets/images/placeholder.svg";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><img src="${imageUrl}" class="admin-book-thumb" alt="${title}"></td>
        <td>${title}</td>
        <td>${book.author || "—"}</td>
        <td>${book.genre || "—"}</td>
        <td>$${Number(book.price || 0).toFixed(2)}</td>
        <td class="admin-actions">
          <button class="btn-edit" data-id="${book.id}"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-delete" data-id="${book.id}"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty" style="color:var(--rust)">Error loading books: ${err.message}</td></tr>`;
    console.error("loadBooks error:", err);
  }
}

const bookForm = document.getElementById("book-form");
if (bookForm) {
  bookForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = bookForm.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Saving...";

    const data = {
      title: document.getElementById("f-title").value.trim(),
      author: document.getElementById("f-author").value.trim(),
      genre: document.getElementById("f-genre").value,
      price: parseFloat(document.getElementById("f-price").value),
      originalPrice: parseFloat(document.getElementById("f-original-price").value) || null,
      description: document.getElementById("f-description").value.trim(),
      pages: document.getElementById("f-pages").value.trim(),
      publisher: document.getElementById("f-publisher").value.trim(),
      isbn: document.getElementById("f-isbn").value.trim(),
      language: document.getElementById("f-language").value.trim(),
      isNew: document.getElementById("f-isnew").checked,
      isSale: document.getElementById("f-issale").checked,
      updatedAt: new Date().toISOString()
    };

    
    const imageFile = document.getElementById("f-image").files[0];
    if (imageFile) {
      try {
        const storageRef = ref(storage, `books/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        data.imageUrl = await getDownloadURL(storageRef);
      } catch (err) {
        showAdminMsg("Image upload failed: " + err.message, "error");
        btn.disabled = false;
        btn.textContent = editingId ? "Update Book" : "Add Book";
        return;
      }
    } else if (editingId) {
      
      try {
        const existing = await getDoc(doc(db, BOOKS_COL, editingId));
        if (existing.exists()) {
          data.imageUrl = existing.data().imageUrl || existing.data().coverImage || "";
        }
      } catch {}
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, BOOKS_COL, editingId), data);
        showAdminMsg("Book updated successfully!", "success");
        editingId = null;
        document.getElementById("form-title").textContent = "Add New Book";
        btn.textContent = "Add Book";
      } else {
        data.createdAt = new Date().toISOString();
        await addDoc(collection(db, BOOKS_COL), data);
        showAdminMsg("Book added successfully!", "success");
        btn.textContent = "Add Book";
      }
      bookForm.reset();
      loadBooks();
    } catch (err) {
      showAdminMsg("Error saving book: " + err.message, "error");
      btn.textContent = editingId ? "Update Book" : "Add Book";
    }

    btn.disabled = false;
  });
}

document.addEventListener("click", async (e) => {
  const editBtn = e.target.closest(".btn-edit");
  const deleteBtn = e.target.closest(".btn-delete");

  if (editBtn) {
    const id = editBtn.dataset.id;
    try {
      const snap = await getDoc(doc(db, BOOKS_COL, id));
      if (!snap.exists()) {
        showAdminMsg("Book not found.", "error");
        return;
      }
      const b = snap.data();
      editingId = id;
      document.getElementById("form-title").textContent = "Edit Book";
      document.getElementById("f-title").value = b.title || b.name || "";
      document.getElementById("f-author").value = b.author || "";
      document.getElementById("f-genre").value = b.genre || "";
      document.getElementById("f-price").value = b.price || "";
      document.getElementById("f-original-price").value = b.originalPrice || "";
      document.getElementById("f-description").value = b.description || "";
      document.getElementById("f-pages").value = b.pages || "";
      document.getElementById("f-publisher").value = b.publisher || "";
      document.getElementById("f-isbn").value = b.isbn || "";
      document.getElementById("f-language").value = b.language || "English";
      document.getElementById("f-isnew").checked = b.isNew || false;
      document.getElementById("f-issale").checked = b.isSale || false;
      document.querySelector("button[type=submit]").textContent = "Update Book";
      document.getElementById("book-form-section").scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      showAdminMsg("Error loading book: " + err.message, "error");
      console.error("edit error:", err);
    }
  }

  if (deleteBtn) {
    if (!confirm("Delete this book? This cannot be undone.")) return;
    const id = deleteBtn.dataset.id;
    try {
      await deleteDoc(doc(db, BOOKS_COL, id));
      showAdminMsg("Book deleted successfully.", "success");
      loadBooks();
    } catch (err) {
      showAdminMsg("Error deleting book: " + err.message, "error");
      console.error("delete error:", err);
    }
  }
});

const cancelBtn = document.getElementById("cancel-edit");
if (cancelBtn) {
  cancelBtn.addEventListener("click", () => {
    editingId = null;
    bookForm.reset();
    document.getElementById("form-title").textContent = "Add New Book";
    document.querySelector("button[type=submit]").textContent = "Add Book";
  });
}

function showAdminMsg(text, type) {
  const el = document.getElementById("admin-msg");
  if (el) {
    el.textContent = text;
    el.className = `admin-msg ${type}`;
    setTimeout(() => { el.textContent = ""; el.className = "admin-msg"; }, 4000);
  }
}
