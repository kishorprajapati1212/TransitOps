# TransitOps — Roles & Access Control

## Role Permissions Matrix

| Feature | Fleet Manager | Driver | Safety Officer | Financial Analyst |
|---------|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Vehicle CRUD | ✅ | ❌ | ❌ | ❌ |
| Driver CRUD | ✅ | ❌ | 👁 Read | ❌ |
| Create/Edit Trips | ✅ | ✅ | ❌ | ❌ |
| Dispatch/Complete/Cancel | ✅ | ✅ | ❌ | ❌ |
| Maintenance Logs | ✅ | ❌ | ❌ | ❌ |
| Fuel Logs | ✅ | ❌ | ❌ | ✅ |
| Expenses | ✅ | ❌ | ❌ | ✅ |
| Reports & Analytics | ✅ | ❌ | ✅ | ✅ |
| Settings | ✅ | ✅ | ✅ | ✅ |

---

## Trip Lifecycle Ownership

| Step | Who Acts | System Update |
|------|----------|---------------|
| **Create** trip | Fleet Manager / Driver | Validates capacity → status `draft` |
| **Dispatch** | Fleet Manager / Driver | Vehicle + Driver → `on_trip` |
| **Complete** | Fleet Manager / Driver | Vehicle + Driver → `available`, odometer updated |
| **Cancel** | Fleet Manager / Driver | Vehicle + Driver restored to `available` |

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Fleet Manager | admin@transitops.io | password123 |
| Driver | driver@transitops.io | password123 |
| Safety Officer | safety@transitops.io | password123 |
| Financial Analyst | finance@transitops.io | password123 |
