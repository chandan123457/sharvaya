# TalentDesk — Candidate Registration

A full-stack candidate registration app with a searchable grid, edit, and **soft delete**:
deleting a candidate only hides them from the grid; the record is never removed from the database.

| Layer    | Tech                                                    |
| -------- | ------------------------------------------------------- |
| Frontend | React 19, Vite, Tailwind CSS v4, React Router, lucide icons, sonner toasts |
| Backend  | Node.js, Express 5, Zod validation, Helmet, Morgan       |
| Database | PostgreSQL 16 (via Docker Compose)                       |

```
sharvay/
├── backend/     Express REST API + PostgreSQL schema, migration & seed
├── frontend/    React single-page app
└── docker-compose.yml   PostgreSQL container
```

## Features

**Task requirements**
- **Candidate registration page**: a sectioned form (personal, professional, application) with client- and server-side validation.
- **Grid view** of all registrations.
- **Edit**: every row opens a pre-filled edit form.
- **Delete hides the row only**: `DELETE` sets `is_deleted = TRUE` and `deleted_at = NOW()`. The row stays in PostgreSQL.

**Extras**
- An **Archive** view that lists hidden candidates, with one-click **Restore**, plus an **Undo** button on the delete toast.
- An overview of key metrics and a clickable **pipeline bar**. Click a stage to filter the grid.
- Search across name, email, phone, city, role and skills (debounced), sorting and pagination. The state lives in the URL, so a filtered view can be shared or refreshed.
- **Export to CSV** of the current filtered view.
- A candidate profile drawer with quick Email, Call and Copy actions.
- A registration form with a progress rail (completeness % and section checkmarks), a live preview, segmented controls, a skills tag input, an unsaved-changes indicator and a leave-page warning.
- Keyboard shortcuts: `/` search, `N` new candidate, `Ctrl/⌘ + Enter` save, `Esc` close.
- Duplicate-email protection that ignores archived rows (partial unique index).
- Responsive layout: table on desktop, cards on mobile. Also includes loading skeletons, empty states and error states.

**Design**: Geist for the UI, Instrument Serif for page titles, a warm stone palette with one restrained accent, and a floating-panel app shell.

## Run locally

Prerequisites: Node.js 18+ and Docker.

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Backend (http://localhost:5000)
cd backend
cp .env.example .env
npm install
npm run seed      # creates the table and adds 12 sample candidates
npm run dev

# 3. Frontend (http://localhost:5173), in a new terminal
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

> Using your own PostgreSQL instead of Docker? Point `DATABASE_URL` in `backend/.env` at it.
> The schema is created automatically when the server starts.

## REST API

Base URL: `http://localhost:5000/api`

| Method | Endpoint                     | Description                                         |
| ------ | ---------------------------- | --------------------------------------------------- |
| GET    | `/health`                    | API and database health check                       |
| GET    | `/candidates`                | List. Query: `search, status, view=active\|archived, sort, order, page, limit` |
| GET    | `/candidates/stats`          | Dashboard counters                                  |
| GET    | `/candidates/:id`            | Single candidate                                    |
| POST   | `/candidates`                | Register a candidate                                |
| PUT    | `/candidates/:id`            | Update a candidate                                  |
| DELETE | `/candidates/:id`            | **Soft delete**: hide from the grid only            |
| PATCH  | `/candidates/:id/restore`    | Bring a hidden candidate back                       |

Validation errors return `422` with a per-field map, for example
`{ "error": "...", "fields": { "email": "Enter a valid email address" } }`.
A duplicate email returns `409`.

## How soft delete works

```sql
-- DELETE /api/candidates/:id
UPDATE candidates SET is_deleted = TRUE, deleted_at = NOW() WHERE id = $1;

-- The grid only ever reads active rows
SELECT ... FROM candidates WHERE is_deleted = FALSE;
```

You can check that a "deleted" candidate is still in the database:

```bash
docker exec -it talentdesk-db psql -U talentdesk -c "SELECT id, full_name, is_deleted, deleted_at FROM candidates;"
```
