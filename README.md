# QuickNotes System Design

QuickNotes is a notes app that is moving from a browser-only tool to an online service for 1 million users. This repository has two halves:

1. **A working API client** (`index.html`, `api.js`, `style.css`) that proves the front end can talk to a REST API, using the free [JSONPlaceholder](https://jsonplaceholder.typicode.com) practice API.
2. **Three design documents** the backend team will build the real service from.

## How to run the API client

1. Clone the repository:
   ```bash
   git clone https://github.com/msfay254/quicknotes-system-design.git
   cd quicknotes-system-design
   ```
2. Open `index.html` in your browser (double-click it), or run a local server:
   ```bash
   python3 -m http.server 8000
   ```
   then visit <http://localhost:8000>.
3. Click **Load notes** to fetch 10 notes (GET), fill in the form to create one (POST), and click **Delete** on a note to remove it (DELETE).

Note: JSONPlaceholder pretends to save changes but never stores them. Created and deleted notes only change on the page, and **Load notes** brings back the original 10.

## Design documents

- [API design](docs/api-design.md): REST endpoints, JSON examples and error codes
- [Data model](docs/data-model.md): tables, relationships, SQL, indexes and the SQL vs NoSQL choice
- [Architecture](docs/architecture.md): requirements, load estimate, diagram, request flows and trade-offs

## What I learned

- **`fetch` does not throw on 404 or 500.** It only rejects on network failure, so I must check `response.ok` myself and throw. Putting this in one reusable `request()` function keeps the code short.
- **Users need every state:** loading, success, error and empty. Disabling buttons while a request runs prevents double submits.
- **Never put user text into `innerHTML`.** Using `textContent` stops malicious HTML or scripts from running.
- **Fake APIs need careful handling.** Because JSONPlaceholder does not save data, the page has to be the source of truth, and notes need their own unique key.
- **Design starts with numbers.** Turning "1 million users" into reads/s, writes/s and GB/year shows that one primary database is enough, and that caches, replicas and queues are there for speed and safety.
- **Every component solves a specific problem** and every trade-off has a cost (for example cache speed vs. freshness).
