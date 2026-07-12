# TransitOps — Smart Transport Operations Platform

A complete, hackathon-ready **transport operations platform** built as a scalable monorepo:

- **Backend** — Node.js + Express + PostgreSQL (Neon or any Postgres), raw-SQL repositories, RBAC, full business-rule enforcement.
- **Frontend** — React + Vite + TailwindCSS SPA with dark mode, charts, and every backend feature wired end-to-end.
- **Infra** — Dockerfiles for both services + a `docker-compose.yml` that spins up PostgreSQL, the API and the UI together.

> Problem statement: digitize vehicle, driver, dispatch, maintenance and expense management while enforcing business rules and surfacing operational analytics.

---

## Tech Stack

| Layer | Tech |
|-------|-----|
| Frontend | React 18, Vite, React Router, TailwindCSS, Recharts, Axios |
| Backend  | Node.js, Express, `pg` (PostgreSQL), JWT, bcrypt, express-validator |
| Database | PostgreSQL 14+ (Neon / local / Docker) |
| Infra    | Docker, Docker Compose, Nginx (static SPA + API proxy) |

---

## Features & Deliverables Coverage

- ✅ **Public main Home/Landing page** — product overview, the full 9-step automated workflow timeline, and per-role guidance (what each role does & where they go)
- ✅ Authentication with JWT + Role-Based Access Control (Fleet Manager, Driver, Safety Officer, Financial Analyst)
- ✅ **Four roles, each with seeder credentials** + role-aware navigation and a "your workflow" panel on the dashboard
- ✅ CRUD for Vehicles and Drivers
- ✅ Trip Management with lifecycle (draft → dispatched → completed/cancelled) + validations
- ✅ Automatic status transitions (dispatch/complete/cancel, maintenance in-shop/close)
- ✅ Fuel & Expense tracking with automatic operational-cost computation
- ✅ Dashboard KPIs (active/available/in-shop vehicles, active/pending trips, drivers on duty, fleet utilization %)
- ✅ Reports & Analytics: fuel efficiency, operational cost, ROI, expiring-license alerts, **CSV export**
- ✅ Responsive UI with **dark mode**
- ⚠️ Email license reminders & PDF export — backend exposes `/reports/expiring-licenses`; email/PDF can be layered on top (noted as bonus in the PS)

---

## Project Structure

This is a monorepo with **two independent apps** plus a Compose file that runs them together:

```
.
├── docker-compose.yml        # db + backend + frontend (one command to run all)
├── README.md                 # this file
├── backend/                  # Node + Express + PostgreSQL API
│   ├── .env.example          # backend environment template
│   ├── Dockerfile            # backend image
│   ├── API.md                # full API reference
│   ├── config/ utils/ middlewares/ validation/
│   ├── repositories/ controllers/ routes/ migrations/
│   └── app.js server.js package.json
└── frontend/                 # React + Vite + Tailwind SPA
    ├── .env.example          # frontend build-time template
    ├── Dockerfile nginx.conf .dockerignore
    └── src/
        ├── api/  context/  components/  pages/  constants.js  main.jsx  App.jsx  index.css
```

### Application pages (frontend)
| Route | Page | Who sees it |
|-------|------|-------------|
| `/` | **Main Home** (public landing: overview + workflow timeline + roles) | everyone |
| `/login` | Login (split-screen, demo accounts) | everyone |
| `/dashboard` | Dashboard (KPIs, charts, getting-started, your workflow) | all logged-in roles |
| `/vehicles`, `/drivers` | Registries (CRUD) | Fleet Manager |
| `/trips` | Trip lifecycle (create → dispatch → complete/cancel) | Fleet Manager, Driver |
| `/maintenance` | Maintenance logs (open/close → In Shop) | Fleet Manager |
| `/fuel`, `/expenses` | Fuel & expense tracking | Fleet Manager, Financial Analyst |
| `/reports` | Analytics, ROI, expiring licenses, CSV export | all logged-in roles |

Each app is self-contained and can be developed, built, containerized and deployed on its own.

---

## 🐳 Option A — Run Everything with Docker (recommended)

Requires Docker + Docker Compose.

```bash
# From the project root
docker compose up --build
```

This will:
1. Start a **PostgreSQL 16** container (`transitops` db/user/password).
2. Build & start the **backend** — it auto-runs `db:migrate` + `db:seed`, then listens on `:4000`.
3. Build & start the **frontend** (Nginx) on `:8080`, proxying `/api/*` to the backend.

### URLs (Docker)
| Service | URL |
|---------|-----|
| **Frontend (UI)** | **http://localhost:8080** |
| Backend API | http://localhost:4000/api |
| API via frontend | http://localhost:8080/api |
| PostgreSQL | localhost:5432 |

Stop everything:
```bash
docker compose down          # keep data volume
docker compose down -v       # also delete the database volume
```

---

## 💻 Option B — Run Manually (npm only)

### 1) Backend
```bash
cp .env.example .env         # set DATABASE_URL (Neon or local Postgres) + JWT_SECRET
npm install
npm run db:migrate          # create schema
npm run db:seed             # demo data (optional)
npm run dev                 # or: npm start
```
Backend listens on **http://localhost:4000**.

> `DATABASE_URL` examples:
> - Neon: `postgres://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`
> - Local Postgres: `postgres://transitops:transitops@localhost:5432/transitops`

### 2) Frontend
```bash
cd frontend
npm install
npm run dev                  # http://localhost:5173
```
In dev, Vite proxies `/api` → `http://localhost:4000` (see `vite.config.js`), so no CORS setup is needed.

### URLs (Manual)
| Service | URL |
|---------|-----|
| **Frontend (dev)** | **http://localhost:5173** |
| Backend API | http://localhost:4000/api |

To build a production frontend bundle: `cd frontend && npm run build` (output in `frontend/dist`).

---

## Demo Credentials (after `db:seed`)

| Role | Email | Password |
|------|-------|----------|
| Fleet Manager | admin@transitops.io | password123 |
| Driver | driver@transitops.io | password123 |
| Safety Officer | safety@transitops.io | password123 |
| Financial Analyst | finance@transitops.io | password123 |

> **Seeded demo data** — the seeder creates a *complete* dataset so every screen is populated:
> 5 vehicles (every status: available / on_trip / in_shop / retired), 4 drivers (every status),
> 4 trips spanning the full lifecycle (draft → dispatched → completed → cancelled),
> 2 maintenance records (one open, one closed), plus fuel logs and expenses.
> Re-seed from scratch with `npm run db:reset`.

---

## Environment Variables

Each app ships its own `.env.example`:

- `backend/.env.example` — backend runtime config
- `frontend/.env.example` — frontend build-time config

**Backend (`.env`)**
| Var | Default | Notes |
|-----|---------|-------|
| `DATABASE_URL` | — | PostgreSQL connection string (required) |
| `JWT_SECRET` | dev-secret | Change in production |
| `JWT_EXPIRES_IN` | 7d | Token lifetime |
| `PORT` | 4000 | API port |
| `SQL_LOG` | false | Log SQL queries when `true` |

**Frontend** — `VITE_API_URL` (build-time). Defaults to `/api` (relative), which works in both dev (Vite proxy) and Docker (Nginx proxy). Override for a custom backend origin.

---

## Business Rules (enforced server-side)

1. Vehicle registration number is unique.
2. Retired / In-Shop vehicles are rejected from trip assignment.
3. Drivers with expired licenses or `suspended` status cannot be assigned.
4. A driver/vehicle already `on_trip` cannot be assigned to another trip.
5. `cargo_weight` must not exceed `max_load_capacity`.
6. Dispatching a trip → vehicle & driver become `on_trip`.
7. Completing a trip → vehicle & driver become `available` (odometer updated).
8. Cancelling a dispatched trip → vehicle & driver restored to `available`.
9. Creating maintenance → vehicle becomes `in_shop`.
10. Closing maintenance → vehicle restored to `available` (unless `retired`).

See [API.md](./backend/API.md) for the full endpoint reference.

---

## Scalability Notes

- **Backend** is stateless (JWT), so it scales horizontally behind a load balancer. Neon handles connection pooling.
- **Repositories** use parameterized SQL (no ORM) with a pooled `pg` client and transactions + row locks for state changes.
- **Frontend** is a component-based SPA; each domain (vehicles, drivers, trips, …) is isolated into its own page + API module, easy to extend.
- Both services are containerized; the compose file can be dropped into any Docker host or cloud runner.
