# TransitOps — API Reference

Base URL: `http://localhost:4000/api`
Health check (no auth): `GET http://localhost:4000/health`

All authenticated routes require:
```
Authorization: Bearer <token>
```

Tokens are obtained from `POST /api/auth/login` or `POST /api/auth/register`.

---

## 1. Authentication & Users

| Method | Path | Auth | Body / Query | Description |
|--------|------|------|--------------|-------------|
| POST | `/api/auth/register` | Public | `{ name, email, password, role? }` | Register a user (role defaults to `driver`). Returns JWT + user. |
| POST | `/api/auth/login` | Public | `{ email, password }` | Login. Returns JWT + user. |
| GET  | `/api/auth/me` | Any | — | Returns the currently authenticated user. |
| GET  | `/api/users` | Fleet Manager | — | List all users. |
| GET  | `/api/users/:id` | Fleet Manager | — | Get a single user. |
| PATCH| `/api/users/:id/role` | Fleet Manager | `{ role }` | Change a user's role. |
| DELETE | `/api/users/:id` | Fleet Manager | — | Delete a user. |

---

## 2. Vehicle Registry

| Method | Path | Auth | Body / Query | Description |
|--------|------|------|--------------|-------------|
| GET  | `/api/vehicles` | Any | `?status&type&region&search` | List vehicles (filtered). |
| GET  | `/api/vehicles/:id` | Any | — | Get one vehicle. |
| POST | `/api/vehicles` | Fleet Manager | `{ registration_number, name, type, max_load_capacity, odometer?, acquisition_cost?, status?, region? }` | Create a vehicle. Registration number must be unique. |
| PATCH| `/api/vehicles/:id` | Fleet Manager | any of the above fields | Update a vehicle. |
| DELETE | `/api/vehicles/:id` | Fleet Manager | — | Delete a vehicle. |

Vehicle `status` enum: `available`, `on_trip`, `in_shop`, `retired`.

---

## 3. Driver Management

| Method | Path | Auth | Body / Query | Description |
|--------|------|------|--------------|-------------|
| GET  | `/api/drivers` | Any | `?status&search` | List drivers. |
| GET  | `/api/drivers/:id` | Any | — | Get one driver. |
| POST | `/api/drivers` | Fleet Manager | `{ name, license_number, license_category, license_expiry_date, contact_number?, safety_score?, status? }` | Create a driver. License number must be unique. |
| PATCH| `/api/drivers/:id` | Fleet Manager | any of the above fields | Update a driver. |
| DELETE | `/api/drivers/:id` | Fleet Manager | — | Delete a driver. |

Driver `status` enum: `available`, `on_trip`, `off_duty`, `suspended`.

---

## 4. Trip Management

| Method | Path | Auth | Body / Query | Description |
|--------|------|------|--------------|-------------|
| GET  | `/api/trips` | Any | `?status&vehicle_id&driver_id&search` | List trips (joins vehicle reg + driver name). |
| GET  | `/api/trips/:id` | Any | — | Get one trip. |
| POST | `/api/trips` | Fleet Manager / Driver | `{ source, destination, vehicle_id, driver_id, cargo_weight, planned_distance }` | Create a **draft** trip. Enforces all assignment business rules. |
| PATCH| `/api/trips/:id` | Fleet Manager / Driver | any editable field | Edit a **draft** trip (re-validates rules). |
| POST | `/api/trips/:id/dispatch` | Fleet Manager / Driver | — | Dispatch the trip → vehicle & driver become `on_trip`. |
| POST | `/api/trips/:id/complete` | Fleet Manager / Driver | `{ final_odometer, fuel_consumed?, revenue? }` | Complete the trip → vehicle & driver become `available`. |
| POST | `/api/trips/:id/cancel` | Fleet Manager / Driver | — | Cancel a draft/dispatched trip → restores vehicle & driver to `available`. |

Trip `status` lifecycle: `draft → dispatched → completed` (or `cancelled`).

---

## 5. Maintenance

| Method | Path | Auth | Body / Query | Description |
|--------|------|------|--------------|-------------|
| GET  | `/api/maintenance` | Any | `?vehicle_id&status` | List maintenance records. |
| GET  | `/api/maintenance/:id` | Any | — | Get one record. |
| POST | `/api/maintenance` | Fleet Manager | `{ vehicle_id, type, description?, cost?, performed_at? }` | Create an **open** record → vehicle becomes `in_shop`. |
| PATCH| `/api/maintenance/:id` | Fleet Manager | `{ type?, description?, cost? }` | Update an open record. |
| POST | `/api/maintenance/:id/close` | Fleet Manager | — | Close record → vehicle restored to `available` (unless `retired`). |
| DELETE | `/api/maintenance/:id` | Fleet Manager | — | Delete a record. |

---

## 6. Fuel & Expenses

| Method | Path | Auth | Body / Query | Description |
|--------|------|------|--------------|-------------|
| GET  | `/api/fuel` | Any | `?vehicle_id&trip_id&from&to` | List fuel logs. |
| GET  | `/api/fuel/:id` | Any | — | Get one fuel log. |
| POST | `/api/fuel` | Fleet Manager / Financial Analyst | `{ vehicle_id, liters, cost, trip_id?, log_date? }` | Record fuel. |
| DELETE | `/api/fuel/:id` | Fleet Manager / Financial Analyst | — | Delete a fuel log. |
| GET  | `/api/expenses` | Any | `?category&vehicle_id&trip_id&from&to` | List expenses. |
| GET  | `/api/expenses/:id` | Any | — | Get one expense. |
| POST | `/api/expenses` | Fleet Manager / Financial Analyst | `{ category, amount, vehicle_id?, trip_id?, description?, expense_date? }` | Record an expense. |
| DELETE | `/api/expenses/:id` | Fleet Manager / Financial Analyst | — | Delete an expense. |

---

## 7. Dashboard & Reports

| Method | Path | Auth | Query | Description |
|--------|------|------|-------|-------------|
| GET  | `/api/dashboard` | Any | `?type&status&region` | KPI snapshot (active/available/in-shop vehicles, active/pending trips, drivers on duty, fleet utilization %). |
| GET  | `/api/reports` | Fleet Mgr / Fin Analyst / Safety Officer | `?type&region&status` | Fleet-wide overview (operational cost, fuel efficiency, utilization, ROI). |
| GET  | `/api/reports/vehicles` | Fleet Mgr / Fin Analyst / Safety Officer | `?type&region&status` | Per-vehicle report (operational cost, fuel efficiency, ROI). |
| GET  | `/api/reports/expiring-licenses` | Fleet Mgr / Fin Analyst / Safety Officer | `?days=30` | Drivers whose license expires within N days. |
| GET  | `/api/reports/export.csv` | Fleet Mgr / Fin Analyst / Safety Officer | `?type&region&status` | CSV export of the per-vehicle report. |

---

## Enforced Business Rules (server-side)

1. Vehicle registration number is unique.
2. Retired / In-Shop vehicles are rejected from trip assignment.
3. Drivers with expired licenses or `suspended` status cannot be assigned.
4. A driver/vehicle already `on_trip` cannot be assigned to another trip.
5. `cargo_weight` must not exceed `max_load_capacity`.
6. Dispatching a trip → vehicle & driver become `on_trip`.
7. Completing a trip → vehicle & driver become `available` (vehicle odometer updated).
8. Cancelling a dispatched trip → vehicle & driver restored to `available`.
9. Creating a maintenance record → vehicle becomes `in_shop`.
10. Closing maintenance → vehicle restored to `available` (unless `retired`).

---

## Example flow (matches the problem statement)

```bash
# 1. Register & login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@transitops.io","password":"password123"}'
# -> copy the token

# 2. Create Van-05 (capacity 500kg)
curl -X POST http://localhost:4000/api/vehicles -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"registration_number":"GJ-01-VAN05","name":"Van-05","type":"Van","max_load_capacity":500}'

# 3. Create driver Alex (valid license)
curl -X POST http://localhost:4000/api/drivers -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alex","license_number":"DL-1001","license_category":"B","license_expiry_date":"2027-01-15"}'

# 4. Create a trip (cargo 450kg <= 500kg)
curl -X POST http://localhost:4000/api/trips -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"source":"A","destination":"B","vehicle_id":"<V_ID>","driver_id":"<D_ID>","cargo_weight":450,"planned_distance":100}'

# 5. Dispatch -> vehicle & driver on_trip
curl -X POST http://localhost:4000/api/trips/<T_ID>/dispatch -H "Authorization: Bearer $TOKEN"

# 6. Complete -> enter final odometer + fuel
curl -X POST http://localhost:4000/api/trips/<T_ID>/complete -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"final_odometer":12500,"fuel_consumed":20}'

# 7. Maintenance -> vehicle in_shop
curl -X POST http://localhost:4000/api/maintenance -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vehicle_id":"<V_ID>","type":"Oil Change","cost":1500}'

# 8. Reports
curl http://localhost:4000/api/reports/vehicles -H "Authorization: Bearer $TOKEN"
```
