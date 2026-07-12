# TransitOps — Frontend

React + Vite + TailwindCSS single-page app for the TransitOps platform. Talks to the backend REST API (`/api`).

## Features
- JWT auth + role-based navigation (Fleet Manager, Driver, Safety Officer, Financial Analyst)
- Dashboard with KPIs + charts (vehicle status, trips by status)
- Vehicle Registry, Driver Management, Trip lifecycle, Maintenance, Fuel & Expenses CRUD
- Reports & Analytics with per-vehicle ROI/fuel-efficiency and CSV export
- **Dark mode** toggle (persisted), responsive layout (sidebar collapses on mobile)

## Project Layout
```
src/
  api/          axios client + endpoint modules
  context/      AuthContext (token/user), ThemeContext (dark mode)
  components/   Layout (sidebar+topbar), ProtectedRoute, ui primitives
  pages/        Login, Dashboard, Vehicles, Drivers, Trips, Maintenance, Fuel, Expenses, Reports
  constants.js  roles, status enums + color maps, nav-by-role
  App.jsx       router
```

## Run (development)
```bash
npm install
npm run dev        # http://localhost:5173  (proxies /api -> http://localhost:4000)
```
Open http://localhost:5173 and log in (seeded: `admin@transitops.io` / `password123`).

## Build (production)
```bash
npm run build      # outputs to dist/
npm run preview    # local preview of the production build
```

## Docker
Built as a multi-stage image: Vite builds the bundle, Nginx serves it and proxies
`/api/` to the backend service.

```bash
docker build -t transitops-frontend --build-arg VITE_API_URL=/api .
# or via the root compose file:
#   docker compose up --build   ->  http://localhost:8080
```

`VITE_API_URL` is baked at build time. It defaults to `/api` (relative):
- In dev, Vite proxies it to the backend.
- In Docker, Nginx (`nginx.conf`) proxies it to the `backend` service.

## Environment
| Var | Default | Purpose |
|-----|---------|---------|
| `VITE_API_URL` | `/api` | Base path for API calls (build-time) |
