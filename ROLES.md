# TransitOps — Roles & Responsibilities

A quick reference for **who does what**, and **who owns the trip** through its lifecycle.

---

## 1. What each role does

| Role | Primary responsibility | What they can do |
|------|------------------------|------------------|
| **Fleet Manager** | Owns the fleet end-to-end | Register & manage **vehicles** and **drivers**, create / dispatch / complete / cancel **trips**, log **maintenance** & **expenses**, and view every **report**. |
| **Driver** | Executes deliveries | **Create** trips, **dispatch**, **complete**, and **cancel** trips they are assigned to. |
| **Safety Officer** | Compliance & licensing | Review **all drivers**, spot **expired / expiring licenses**, monitor **safety scores**, and read compliance reports. |
| **Financial Analyst** | Cost & profitability | Review **fuel** & **expenses**, analyse **operational cost**, **fuel efficiency** and **ROI**, and export reports to CSV. |

> Role-Based Access Control (RBAC) is enforced on the backend: writes are limited to the
> roles above, and every status change is validated by server-side business rules.

---

## 2. Trip lifecycle — who assigns first, who updates

The trip is **owned by the Fleet Manager (or a Driver)**. The **System** performs the
status changes automatically; supporting roles only *view* the result.

| # | Step | Who acts first | What happens (System update) |
|---|------|----------------|------------------------------|
| 1 | **Create** trip | **Fleet Manager / Driver** | Picks an *available* vehicle + *available* driver, cargo ≤ capacity → status **draft**. |
| 2 | **Dispatch** | **Fleet Manager / Driver** | System sets the vehicle **and** driver to **On Trip**. |
| 3 | **Complete** | **Fleet Manager / Driver** | Enters final odometer + fuel used → System sets vehicle & driver back to **Available**; reports refresh. |
| 4 | **Cancel** | **Fleet Manager / Driver** | (draft / dispatched only) → System restores vehicle & driver to **Available**. |

**In short:** the **first assigner** is the Fleet Manager (or Driver) who *creates* the trip.
The **updates** (dispatch / complete / cancel) are performed by that **same role**, while the
**System** automatically updates the vehicle & driver status and the analytics.

Supporting roles in the trip workflow:
- **Safety Officer** — reviews the *drivers* involved (licenses & safety scores) but does **not** assign trips.
- **Financial Analyst** — reviews the *cost / fuel / ROI* produced by completed trips but does **not** assign trips.

---

## 3. Maintenance ownership

- **Fleet Manager** logs a maintenance record → the **System** moves the vehicle to **In Shop**
  (hidden from dispatch). On **close**, the System returns it to **Available** (unless it is **retired**).
- Drivers, Safety Officers and Financial Analysts do **not** manage maintenance.

---

## 4. Demo logins (after `npm run db:seed`)

| Role | Email | Password |
|------|-------|----------|
| Fleet Manager | admin@transitops.io | password123 |
| Driver | driver@transitops.io | password123 |
| Safety Officer | safety@transitops.io | password123 |
| Financial Analyst | finance@transitops.io | password123 |
