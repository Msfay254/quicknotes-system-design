# QuickNotes API Design

This document describes the **real** QuickNotes REST API the backend team should build. (The JSONPlaceholder API used in the browser client is only a practice stand-in.)

**Conventions**

- Base URL: `https://api.quicknotes.example/v1`
- All bodies are JSON (`Content-Type: application/json`).
- Resources are **plural nouns** (`/notes`), the HTTP method is the verb. No verbs in paths.
- Authentication: `Authorization: Bearer <token>` on every endpoint except `POST /auth/login`.
- Every note belongs to one user. A user can only see and change their own notes.
- Lists are paginated with `?limit=` (default 10, max 100) and `?cursor=`.

## 1. Endpoints

| # | Method | Path | Description | Success status |
|---|--------|------|-------------|----------------|
| 1 | `POST` | `/auth/login` | Exchange email and password for an access token | `200 OK` |
| 2 | `GET` | `/notes` | List the logged-in user's notes (newest first, paginated, optional `?tag=`) | `200 OK` |
| 3 | `POST` | `/notes` | Create a new note | `201 Created` |
| 4 | `GET` | `/notes/{id}` | Get one note | `200 OK` |
| 5 | `PUT` | `/notes/{id}` | Replace a note's title and body | `200 OK` |
| 6 | `DELETE` | `/notes/{id}` | Delete a note | `204 No Content` |
| 7 | `GET` | `/tags` | List the user's tags | `200 OK` |
| 8 | `PUT` | `/notes/{id}/tags/{tagId}` | Attach a tag to a note (safe to repeat) | `204 No Content` |
| 9 | `DELETE` | `/notes/{id}/tags/{tagId}` | Remove a tag from a note | `204 No Content` |

Why these status codes? `201` tells the client something new was made; `204` means "done, nothing to send back"; `200` means "here is the data you asked for".

## 2. Examples

### Create a note: `POST /notes`

Request:

```http
POST /v1/notes
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json
```

```json
{
  "title": "Buy milk",
  "body": "Two litres, semi-skimmed",
  "tags": ["shopping"]
}
```

Response: `201 Created` (the `Location` header is `/v1/notes/501`)

```json
{
  "id": 501,
  "userId": 7,
  "title": "Buy milk",
  "body": "Two litres, semi-skimmed",
  "tags": ["shopping"],
  "createdAt": "2026-10-14T09:30:00Z",
  "updatedAt": "2026-10-14T09:30:00Z"
}
```

Rules: `title` is required, 1 to 100 characters. `body` is optional.

### List notes: `GET /notes?limit=2`

Response: `200 OK`

```json
{
  "data": [
    {
      "id": 501,
      "title": "Buy milk",
      "body": "Two litres, semi-skimmed",
      "tags": ["shopping"],
      "createdAt": "2026-10-14T09:30:00Z"
    },
    {
      "id": 498,
      "title": "Call the bank",
      "body": "",
      "tags": [],
      "createdAt": "2026-10-13T16:05:00Z"
    }
  ],
  "nextCursor": "eyJpZCI6NDk4fQ"
}
```

An empty account returns `200` with `"data": []` (an empty list is not an error).

## 3. Error codes

| Status | Meaning | When it happens |
|--------|---------|-----------------|
| `400 Bad Request` | The request is malformed or invalid | Missing title, title over 100 characters, invalid JSON |
| `401 Unauthorized` | You are not logged in | Missing, expired or invalid token |
| `403 Forbidden` | Logged in, but not allowed | Trying to read or change another user's note |
| `404 Not Found` | The thing does not exist | Note id not found |
| `500 Internal Server Error` | Our bug or outage | Unexpected server failure |

Every error uses the same JSON shape, so clients only need one error handler:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title must be between 1 and 100 characters.",
    "details": [
      { "field": "title", "issue": "too_long", "max": 100 }
    ],
    "requestId": "req_8f31c2"
  }
}
```

For `500` errors the body never exposes stack traces. It only includes a `requestId` so engineers can find the log entry.
