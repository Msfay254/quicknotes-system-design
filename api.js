// QuickNotes API client - talks to the JSONPlaceholder practice API.

const API_URL = "https://jsonplaceholder.typicode.com/posts";

// ---------- Page elements ----------
const loadBtn = document.getElementById("load-btn");
const statusEl = document.getElementById("status");
const notesList = document.getElementById("notes-list");
const noteForm = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const MAX_TITLE_LENGTH = 100;

// ---------- State ----------
let notes = [];     // the notes currently shown on the page
let keyCounter = 0; // our own unique id per note (see the DELETE comment below)

function withKey(note) {
  keyCounter += 1;
  return { ...note, key: keyCounter };
}

// ---------- Small helpers ----------
function showStatus(message, type) {
  statusEl.textContent = message; // textContent = safe, never parsed as HTML
  statusEl.className = type;      // "loading", "success" or "error" (styled in style.css)
}

// Disable (or re-enable) every button so the user cannot send two requests at once.
function setBusy(isBusy) {
  document.querySelectorAll("button").forEach((button) => {
    button.disabled = isBusy;
  });
}

function friendlyError(error) {
  if (error.status) {
    return `Something went wrong on the server (status ${error.status}). Please try again.`;
  }
  return "Could not reach the server. Check your internet connection and try again.";
}

// ---------- The one reusable request function ----------
async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) { // 4xx and 5xx do NOT throw by themselves, so we do it here
    const error = new Error(`Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }
  const data = await response.json();
  return { status: response.status, data };
}

// ---------- API functions (one per HTTP method) ----------
async function fetchNotes() { // GET
  const { data } = await request(`${API_URL}?_limit=10`);
  return data;
}
async function createNote(title, body) { // POST
  return request(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body, userId: 1 }),
  });
}
async function deleteNote(id) { // DELETE
  return request(`${API_URL}/${id}`, { method: "DELETE" });
}

// ---------- Rendering ----------
function renderNotes() {
  notesList.replaceChildren();

  if (notes.length === 0) { // empty state
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No notes to show yet. Click \"Load notes\" or create one.";
    notesList.append(li);
    return;
  }

  notes.forEach((note) => {
    const li = document.createElement("li");

    const title = document.createElement("h3");
    title.textContent = note.title; // user text -> textContent only

    const body = document.createElement("p");
    body.textContent = note.body;

    li.append(title, body);
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.dataset.key = note.key;
    li.append(deleteBtn);
    notesList.append(li);
  });
}

// ---------- GET: load notes ----------
async function handleLoad() {
  setBusy(true);
  showStatus("Loading notes...", "loading");
  try {
    notes = (await fetchNotes()).map(withKey);
    renderNotes();
    if (notes.length === 0) {
      showStatus("The server has no notes yet.", "success");
    } else {
      showStatus(`Loaded ${notes.length} notes from the server.`, "success");
    }
  } catch (error) {
    showStatus(friendlyError(error), "error");
  } finally {
    setBusy(false);
  }
}

// ---------- POST: create a note ----------
function validateTitle(title) {
  if (title.length === 0) return "Please enter a title.";
  if (title.length > MAX_TITLE_LENGTH) {
    return `The title is too long (${title.length} of ${MAX_TITLE_LENGTH} characters).`;
  }
  return null; // null means "valid"
}

async function handleSubmit(event) {
  event.preventDefault(); // stop the browser reloading the page
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim(); // body is optional

  const problem = validateTitle(title);
  if (problem) {
    showStatus(problem, "error");
    titleInput.focus();
    return;
  }

  setBusy(true);
  showStatus("Saving note...", "loading");
  try {
    const { status, data } = await createNote(title, body);
    notes.unshift(withKey(data)); // newest note goes to the top
    renderNotes();
    noteForm.reset();
    showStatus(`Note created (status ${status}, id ${data.id}).`, "success");
  } catch (error) {
    showStatus(friendlyError(error), "error");
  } finally {
    setBusy(false);
  }
}

// ---------- DELETE: remove a note ----------
// JSONPlaceholder is a FAKE API: it accepts our POST and DELETE requests and answers
// with success, but it never really saves or removes anything. Every created note also
// comes back with the same id (101). So our approach is:
//   1. Send the real DELETE request and wait for the server to say OK.
//   2. Only then remove the note from our own `notes` list and redraw the page.
//   3. Identify notes by our own unique `key`, not the server id, so deleting one
//      "id 101" note never removes the others.
// The page is the source of truth. Clicking "Load notes" again brings back the
// original 10 notes, because the server never changed.
async function handleDelete(key) {
  const note = notes.find((n) => n.key === key);
  if (!note) return;

  setBusy(true);
  showStatus(`Deleting note ${note.id}...`, "loading");
  try {
    const { status } = await deleteNote(note.id);
    notes = notes.filter((n) => n.key !== key);
    renderNotes();
    showStatus(`Note deleted (status ${status}, id ${note.id}).`, "success");
  } catch (error) {
    showStatus(friendlyError(error), "error");
  } finally {
    setBusy(false);
  }
}

notesList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-key]");
  if (button) handleDelete(Number(button.dataset.key));
});

// ---------- Start-up ----------
loadBtn.addEventListener("click", handleLoad);
noteForm.addEventListener("submit", handleSubmit);
renderNotes(); // show the empty state first
