require('dotenv').config();

const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

/**
 * Seeds a COMPLETE demo dataset so every screen is populated.
 *
 * Idempotent: if any user already exists, seeding is skipped.
 * To re-seed from scratch run:  npm run db:reset   (migrate + seed)
 *
 * Demo logins (password = password123):
 *   admin@transitops.io   – Fleet Manager (full access)
 *   driver@transitops.io  – Driver (Alex — linked to driver record)
 *   safety@transitops.io  – Safety Officer
 *   finance@transitops.io – Financial Analyst
 */
async function seed() {
  const client = await pool.connect();
  try {
    const existing = await client.query('SELECT 1 FROM users LIMIT 1');
    if (existing.rowCount > 0) {
      console.log('Database already contains data — skipping seed. (Use `npm run db:reset` to re-seed.)');
      return;
    }

    await client.query('BEGIN');
    const passwordHash = await bcrypt.hash('password123', 10);

    // ---------------- Users (all four roles) ----------------
    const usersRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES
        ('Fleet Manager',  'admin@transitops.io',   $1, 'fleet_manager'),
        ('Alex Driver',    'driver@transitops.io',  $1, 'driver'),
        ('Safety Officer', 'safety@transitops.io',  $1, 'safety_officer'),
        ('Finance Analyst','finance@transitops.io', $1, 'financial_analyst')
       RETURNING id, email, role`,
      [passwordHash]
    );
    const driverUserId = usersRes.rows.find(u => u.email === 'driver@transitops.io').id;
    const adminUserId = usersRes.rows.find(u => u.email === 'admin@transitops.io').id;

    // ---------------- Vehicles (every status) ----------------
    const veh = await client.query(
      `INSERT INTO vehicles (registration_number, name, type, max_load_capacity, odometer, acquisition_cost, status, region) VALUES
        ('GJ-01-VAN05', 'Van-05',   'Van',    500,  12000, 800000,  'available', 'Ahmedabad'),
        ('GJ-02-TRK01', 'Truck-01', 'Truck',  2000, 45000, 2500000, 'available', 'Ahmedabad'),
        ('GJ-03-VAN09', 'Van-09',   'Van',    600,  8000,  750000,  'in_shop',   'Rajkot'),
        ('GJ-04-VAN12', 'Van-12',   'Van',    750,  30000, 900000,  'on_trip',   'Surat'),
        ('GJ-05-TRK07', 'Truck-07', 'Truck',  3000, 60000, 3000000, 'retired',   'Rajkot')
       RETURNING id, registration_number`
    );
    const vid = (reg) => veh.rows.find((r) => r.registration_number === reg).id;
    const van05 = vid('GJ-01-VAN05');
    const trk01 = vid('GJ-02-TRK01');
    const van09 = vid('GJ-03-VAN09');
    const van12 = vid('GJ-04-VAN12');

    // ---------------- Drivers (every status) ----------------
    // Alex is linked to the driver user account via user_id
    const drv = await client.query(
      `INSERT INTO drivers (name, license_number, license_category, license_expiry_date, contact_number, safety_score, status, user_id) VALUES
        ('Alex',    'DL-1001', 'B', '2027-01-15', '9999900001', 92, 'available', $1),
        ('Bharat',  'DL-1002', 'C', '2026-12-31', '9999900002', 85, 'available', NULL),
        ('Charlie', 'DL-1003', 'B', '2024-01-01', '9999900003', 70, 'suspended', NULL),
        ('Deepa',   'DL-1004', 'C', '2026-06-30', '9999900004', 88, 'on_trip',   NULL)
       RETURNING id, license_number`,
      [driverUserId]
    );
    const did = (lic) => drv.rows.find((r) => r.license_number === lic).id;
    const alex = did('DL-1001');
    const bharat = did('DL-1002');
    const deepa = did('DL-1004');

    // ---------------- Trips (full lifecycle) ----------------
    // Trips created by admin (fleet manager) — visible to FM
    await client.query(
      `INSERT INTO trips (trip_code, source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status, created_by)
       VALUES ('TRP-SEED-DRAFT','Ahmedabad','Gandhinagar',$1,$2,300,30,'draft',$3)`,
      [van05, alex, adminUserId]
    );
    await client.query(
      `INSERT INTO trips (trip_code, source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status, dispatched_at, created_by)
       VALUES ('TRP-SEED-DISP','Surat','Mumbai',$1,$2,600,300,'dispatched',NOW(),$3)`,
      [van12, deepa, adminUserId]
    );
    // Trip created by Alex (driver user) — shows in "My Trips" for driver login
    const doneTrip = await client.query(
      `INSERT INTO trips (trip_code, source, destination, vehicle_id, driver_id, cargo_weight, planned_distance,
                          status, final_odometer, fuel_consumed, revenue, dispatched_at, completed_at, created_by)
       VALUES ('TRP-SEED-001','Ahmedabad','Surat',$1,$2,450,250,'completed',12260,35,15000,
               NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', $3)
       RETURNING id`,
      [trk01, bharat, driverUserId]
    );
    const doneId = doneTrip.rows[0].id;
    await client.query(`UPDATE vehicles SET odometer = 12260 WHERE id = $1`, [trk01]);
    await client.query(
      `INSERT INTO trips (trip_code, source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status, created_by)
       VALUES ('TRP-SEED-CANCEL','Rajkot','Jamnagar',$1,$2,200,90,'cancelled',$3)`,
      [van05, bharat, adminUserId]
    );

    // ---------------- Maintenance (open + closed) ----------------
    await client.query(
      `INSERT INTO maintenance_logs (vehicle_id, type, description, cost, status, performed_at)
       VALUES ($1,'Oil Change','Regular oil change',2000,'open',NOW())`,
      [van09]
    );
    await client.query(
      `INSERT INTO maintenance_logs (vehicle_id, type, description, cost, status, performed_at, closed_at)
       VALUES ($1,'Tire Rotation','Rotated + balanced',1500,'closed',NOW() - INTERVAL '5 days',NOW() - INTERVAL '4 days')`,
      [van05]
    );

    // ---------------- Fuel logs ----------------
    await client.query(
      `INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, log_date)
       VALUES ($1,$2,35,3500, CURRENT_DATE - INTERVAL '2 days')`,
      [trk01, doneId]
    );
    await client.query(
      `INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, log_date)
       VALUES ($1,NULL,40,4000, CURRENT_DATE)`,
      [van12]
    );
    await client.query(
      `INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, log_date)
       VALUES ($1,$2,20,2200, CURRENT_DATE - INTERVAL '2 days')`,
      [van05, doneId]
    );

    // ---------------- Expenses ----------------
    await client.query(
      `INSERT INTO expenses (vehicle_id, trip_id, category, description, amount, expense_date)
       VALUES ($1,$2,'toll','Expressway toll',600, CURRENT_DATE - INTERVAL '2 days')`,
      [trk01, doneId]
    );
    await client.query(
      `INSERT INTO expenses (vehicle_id, trip_id, category, description, amount, expense_date)
       VALUES ($1,NULL,'maintenance','Oil change parts',2000, CURRENT_DATE)`,
      [van09]
    );
    await client.query(
      `INSERT INTO expenses (vehicle_id, trip_id, category, description, amount, expense_date)
       VALUES ($1,$2,'misc','Fuel surcharge',500, CURRENT_DATE - INTERVAL '2 days')`,
      [van05, doneId]
    );

    await client.query('COMMIT');
    console.log('Seed complete — demo data created for every entity.');
    console.log('Login with any of: admin@transitops.io / driver@transitops.io / safety@transitops.io / finance@transitops.io  (password: password123)');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
