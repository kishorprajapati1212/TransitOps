# TransitOps — Smart Transport Operations Platform

A complete **transport operations platform** that digitizes vehicle, driver, dispatch, maintenance and expense management while enforcing business rules and providing operational analytics.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6, TailwindCSS, Recharts, Axios |
| Backend | Node.js, Express, `pg` (PostgreSQL), JWT, bcrypt, express-validator |
| Database | PostgreSQL 14+ (Neon / Local / Docker) |
| Infra | Docker, Docker Compose, Nginx |

---

## Features & Deliverables

### Mandatory (All Implemented ✅)

| # | Feature | Status |
|---|---------|--------|
| 1 | Responsive web interface | ✅ Mobile-first + dark mode |
| 2 | Authentication with RBAC | ✅ JWT + 4 roles |
| 3 | CRUD for Vehicles and Drivers | ✅ Full validation |
| 4 | Trip Management with validations | ✅ Draft → Dispatched → Completed/Cancelled |
| 5 | Automatic status transitions | ✅ Vehicle + Driver status sync |
| 6 | Maintenance workflow | ✅ Open → In Shop, Close → Available |
| 7 | Fuel & Expense tracking | ✅ Per-vehicle cost computation |
| 8 | Dashboard with KPIs | ✅ 8 KPI cards + 5 charts |
| 9 | Charts and visual analytics | ✅ Donut, bar, gauge, cost breakdown |

### Bonus Features

| Feature | Status |
|---------|--------|
| Dark mode | ✅ System-wide toggle |
| Search, filters, and sorting | ✅ All list pages |
| CSV export | ✅ Vehicle report export |
| Settings page | ✅ Profile, theme, app info |
| Activity logs | ✅ Trip activity tracking |
| Custom confirmation dialogs | ✅ Professional modals (no browser alerts) |
| Toast notifications | ✅ Fixed-position, auto-dismiss |

---

## Business Rules (Server-Enforced)

1. Vehicle registration number must be **unique**
2. **Retired** or **In Shop** vehicles cannot be assigned to trips
3. Drivers with **expired licenses** or **Suspended** status cannot be assigned
4. A driver or vehicle already **On Trip** cannot be double-booked
5. **Cargo weight** must not exceed the vehicle's maximum load capacity
6. **Dispatching** a trip → vehicle & driver status become `on_trip`
7. **Completing** a trip → vehicle & driver status become `available`
8. **Cancelling** a dispatched trip → vehicle & driver restored to `available`
9. **Creating** active maintenance → vehicle status becomes `in_shop`
10. **Closing** maintenance → vehicle restored to `available` (unless retired)

---

## Project Structure

```
TransitOps/
├── docker-compose.yml
├── README.md
├── ROLES.md
├── backend/
│   ├── API.md
│   ├── Dockerfile
│   ├── app.js / server.js
│   ├── config/         → Database connection
│   ├── controllers/    → Route handlers
│   ├── middlewares/     → Auth, RBAC, validation, error handling
│   ├── migrations/     → SQL schema + seeder
│   ├── repositories/   → Raw SQL data access
│   ├── routes/         → Express routers
│   ├── utils/          → JWT, password, error helpers
│   └── validation/     → express-validator schemas
└── frontend/
    ├── Dockerfile / nginx.conf
    └── src/
        ├── api/        → Axios client + API modules
        ├── components/ → Layout, UI component library
        ├── context/    → Auth + Theme providers
        ├── pages/      → Dashboard, Vehicles, Drivers, Trips,
        │                  Maintenance, Fuel, Expenses, Reports,
        │                  Settings, Landing, Login, NotFound
        ├── constants.js
        └── index.css
```

---

## Application Pages

| Route | Page | Accessible By |
|-------|------|---------------|
| `/` | Landing page (public) | Everyone |
| `/login` | Authentication | Everyone |
| `/dashboard` | KPI dashboard with charts | All authenticated |
| `/vehicles` | Vehicle registry (CRUD) | Fleet Manager |
| `/drivers` | Driver management (CRUD) | Fleet Manager, Safety Officer (read) |
| `/trips` | Trip lifecycle management | Fleet Manager, Driver |
| `/maintenance` | Maintenance logs | Fleet Manager |
| `/fuel` | Fuel log tracking | Fleet Manager, Financial Analyst |
| `/expenses` | Expense management | Fleet Manager, Financial Analyst |
| `/reports` | Analytics & CSV export | All authenticated |
| `/settings` | Profile & preferences | All authenticated |

---

## 🐳 Quick Start — Docker (Recommended)

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:4000/api |
| PostgreSQL | localhost:5432 |

```bash
docker compose down       # Stop (keep data)
docker compose down -v    # Stop + delete database
```

---

## 💻 Manual Setup

### Backend
```bash
cd backend
cp .env.example .env      # Set DATABASE_URL + JWT_SECRET
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Fleet Manager | admin@transitops.io | password123 |
| Driver | driver@transitops.io | password123 |
| Safety Officer | safety@transitops.io | password123 |
| Financial Analyst | finance@transitops.io | password123 |

### Seeded Data
The seeder creates a complete dataset: 5 vehicles (all statuses), 4 drivers (all statuses), 4 trips (full lifecycle), 2 maintenance records, fuel logs, and expenses.

---

## Environment Variables

### Backend (`.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL connection string (required) |
| `JWT_SECRET` | dev-secret | JWT signing secret |
| `JWT_EXPIRES_IN` | 7d | Token expiration |
| `PORT` | 4000 | API server port |

### Frontend
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api` | Backend API base URL |

---

## Example Workflow

1. Register vehicle `Van-05` (500 kg capacity, status = Available)
2. Register driver `Alex` (valid license)
3. Create trip (cargo = 450 kg) → system validates 450 ≤ 500 → Draft
4. Dispatch trip → vehicle & driver → On Trip
5. Complete trip (final odometer + fuel) → vehicle & driver → Available
6. Log maintenance (Oil Change) → vehicle → In Shop (hidden from dispatch)
7. Reports update with operational cost and fuel efficiency

---

## Architecture Decisions

- **Raw SQL** — No ORM. All queries use parameterized SQL with `pg` for full control and auditability
- **Transactional state changes** — Trip dispatch/complete/cancel use PostgreSQL transactions with row-level locking
- **Stateless auth** — JWT tokens enable horizontal scaling
- **Component library** — Custom UI components (Button, Modal, Table, Toast, ConfirmDialog) ensure consistent UX
- **RBAC** — Server-side role enforcement on every protected endpoint
