# TransitOps — Smart Transport Operations Platform

A complete transport operations platform that digitizes vehicle, driver, dispatch, maintenance and expense management while enforcing business rules and providing operational analytics.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6, TailwindCSS, Recharts, Axios |
| Backend | Node.js, Express, PostgreSQL (`pg`), JWT, bcrypt, express-validator |
| Database | PostgreSQL 14+ |
| Infra | Docker, Docker Compose, Nginx |

## Features

### Mandatory Deliverables

| # | Feature | Status |
|---|---------|--------|
| 1 | Responsive web interface | ✅ |
| 2 | Authentication with RBAC | ✅ |
| 3 | CRUD for Vehicles and Drivers | ✅ |
| 4 | Trip Management with validations | ✅ |
| 5 | Automatic status transitions | ✅ |
| 6 | Maintenance workflow | ✅ |
| 7 | Fuel & Expense tracking | ✅ |
| 8 | Dashboard with KPIs | ✅ |
| 9 | Charts and visual analytics | ✅ |
| 10 | PDF export | ✅ |

### Bonus Features

| Feature | Status |
|---------|--------|
| Dark mode | ✅ |
| Search, filters, and sorting | ✅ |
| CSV export | ✅ |
| PDF export | ✅ |
| Activity logs (persistent, server-side) | ✅ |
| User management + driver linking | ✅ |
| Custom confirmation dialogs | ✅ |
| Toast notifications | ✅ |
| Trip ownership (drivers see only their trips) | ✅ |
| Settings page | ✅ |

## Business Rules (Server-Enforced)

1. Vehicle registration number must be unique
2. Retired or In Shop vehicles cannot be assigned to trips
3. Drivers with expired licenses or Suspended status cannot be assigned
4. A driver or vehicle already On Trip cannot be double-booked
5. Cargo weight must not exceed the vehicle's maximum load capacity
6. Dispatching a trip → vehicle & driver status become `on_trip`
7. Completing a trip → vehicle & driver status become `available`
8. Cancelling a dispatched trip → vehicle & driver restored to `available`
9. Creating active maintenance → vehicle status becomes `in_shop`
10. Closing maintenance → vehicle restored to `available` (unless retired)

## Project Structure

```
TransitOps/
├── docker-compose.yml
├── README.md
├── ROLES.md
├── DEPLOY.md
│
├── backend/
│   ├── .env.example
│   ├── API.md
│   ├── Dockerfile
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── driver.controller.js
│   │   ├── expense.controller.js
│   │   ├── fuel.controller.js
│   │   ├── maintenance.controller.js
│   │   ├── report.controller.js
│   │   ├── trip.controller.js
│   │   ├── users.controller.js
│   │   └── vehicle.controller.js
│   ├── middlewares/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── notFound.js
│   │   ├── rbac.js
│   │   └── validate.js
│   ├── migrations/
│   │   ├── schema.sql
│   │   ├── seeder.js
│   │   └── run.js
│   ├── repositories/
│   │   ├── activity.repository.js
│   │   ├── dashboard.repository.js
│   │   ├── driver.repository.js
│   │   ├── expense.repository.js
│   │   ├── fuel.repository.js
│   │   ├── maintenance.repository.js
│   │   ├── report.repository.js
│   │   ├── trip.repository.js
│   │   ├── user.repository.js
│   │   └── vehicle.repository.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── activity.routes.js
│   │   ├── auth.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── drivers.routes.js
│   │   ├── expenses.routes.js
│   │   ├── fuel.routes.js
│   │   ├── maintenance.routes.js
│   │   ├── reports.routes.js
│   │   ├── trips.routes.js
│   │   ├── users.routes.js
│   │   └── vehicles.routes.js
│   ├── utils/
│   │   ├── asyncHandler.js
│   │   ├── httpError.js
│   │   ├── jwt.js
│   │   ├── license.js
│   │   └── password.js
│   └── validation/
│       ├── auth.validation.js
│       ├── driver.validation.js
│       ├── expense.validation.js
│       ├── fuel.validation.js
│       ├── maintenance.validation.js
│       ├── trip.validation.js
│       ├── users.validation.js
│       └── vehicle.validation.js
│
└── frontend/
    ├── .env.example
    ├── Dockerfile
    ├── nginx.conf
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── constants.js
        ├── api/
        │   ├── client.js
        │   └── index.js
        ├── components/
        │   ├── Layout.jsx
        │   ├── ProtectedRoute.jsx
        │   └── ui.jsx
        ├── context/
        │   ├── AuthContext.jsx
        │   └── ThemeContext.jsx
        └── pages/
            ├── Dashboard.jsx
            ├── Vehicles.jsx
            ├── Drivers.jsx
            ├── Trips.jsx
            ├── Maintenance.jsx
            ├── Fuel.jsx
            ├── Expenses.jsx
            ├── Reports.jsx
            ├── Users.jsx
            ├── Settings.jsx
            ├── Landing.jsx
            ├── Login.jsx
            └── NotFound.jsx
```

## Application Pages

| Route | Page | Accessible By |
|-------|------|---------------|
| `/` | Landing page | Public |
| `/login` | Authentication | Public |
| `/dashboard` | KPI dashboard + activity log | All authenticated |
| `/vehicles` | Vehicle registry | Fleet Manager |
| `/drivers` | Driver management | Fleet Manager, Safety Officer (read) |
| `/trips` | Trip lifecycle | Fleet Manager (all), Driver (own only) |
| `/maintenance` | Maintenance logs | Fleet Manager |
| `/fuel` | Fuel tracking | Fleet Manager, Financial Analyst |
| `/expenses` | Expense management | Fleet Manager, Financial Analyst |
| `/reports` | Analytics + PDF/CSV export | FM, FA, Safety Officer |
| `/users` | User management + driver linking | Fleet Manager |
| `/settings` | Profile & preferences | All authenticated |

## Quick Start — Docker

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:4000/api |

## Quick Start — Manual

```bash
# Backend
cd backend && cp .env.example .env
npm install && npm run db:migrate && npm run db:seed && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Fleet Manager | admin@transitops.io | password123 |
| Driver | driver@transitops.io | password123 |
| Safety Officer | safety@transitops.io | password123 |
| Financial Analyst | finance@transitops.io | password123 |

## Architecture

- **Raw SQL** — No ORM. Parameterized queries with `pg` for full control
- **Transactions** — Trip state changes use PostgreSQL transactions with row locks
- **Stateless JWT** — Enables horizontal scaling
- **RBAC** — Server-side role enforcement on every endpoint
- **Activity Logs** — Persistent server-side audit trail (Fleet Manager only)
- **User ↔ Driver linking** — Driver user accounts are linked to driver records via `user_id`
