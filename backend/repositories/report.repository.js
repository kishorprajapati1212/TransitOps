const { query } = require('../config/db');

function vehicleFilters({ type, region, status } = {}) {
  const where = [];
  const params = [];
  if (type) {
    params.push(type);
    where.push(`v.type = $${params.length}`);
  }
  if (region) {
    params.push(region);
    where.push(`v.region = $${params.length}`);
  }
  if (status) {
    params.push(status);
    where.push(`v.status = $${params.length}`);
  }
  return { vWhere: where.length ? 'WHERE ' + where.join(' AND ') : '', params };
}

/**
 * Per-vehicle analytics:
 *  - operational cost = fuel cost + maintenance cost
 *  - fuel efficiency  = distance / fuel (km per litre)
 *  - ROI              = (revenue - operational cost) / acquisition cost
 */
async function vehicleReport(filters = {}) {
  const { vWhere, params } = vehicleFilters(filters);

  const sql = `
    SELECT
      v.id,
      v.registration_number,
      v.name,
      v.type,
      v.region,
      v.status,
      v.acquisition_cost,
      COALESCE(f.fuel_cost, 0)     AS fuel_cost,
      COALESCE(f.fuel_liters, 0)   AS fuel_liters,
      COALESCE(m.maint_cost, 0)    AS maintenance_cost,
      COALESCE(t.distance, 0)      AS distance_covered,
      COALESCE(t.revenue, 0)       AS revenue
    FROM vehicles v
    LEFT JOIN (
      SELECT vehicle_id, SUM(cost) AS fuel_cost, SUM(liters) AS fuel_liters
      FROM fuel_logs GROUP BY vehicle_id
    ) f ON f.vehicle_id = v.id
    LEFT JOIN (
      SELECT vehicle_id, SUM(cost) AS maint_cost
      FROM maintenance_logs GROUP BY vehicle_id
    ) m ON m.vehicle_id = v.id
    LEFT JOIN (
      SELECT vehicle_id,
             SUM(CASE WHEN status = 'completed' THEN planned_distance ELSE 0 END) AS distance,
             SUM(CASE WHEN status = 'completed' THEN revenue ELSE 0 END)         AS revenue
      FROM trips GROUP BY vehicle_id
    ) t ON t.vehicle_id = v.id
    ${vWhere}
    ORDER BY v.registration_number`;

  const res = await query(sql, params);
  return res.rows.map((r) => {
    const fuelCost = Number(r.fuel_cost) || 0;
    const maintCost = Number(r.maintenance_cost) || 0;
    const fuelLiters = Number(r.fuel_liters) || 0;
    const distance = Number(r.distance_covered) || 0;
    const revenue = Number(r.revenue) || 0;
    const acquisition = Number(r.acquisition_cost) || 0;

    const operationalCost = fuelCost + maintCost;
    const fuelEfficiency = fuelLiters > 0 ? +(distance / fuelLiters).toFixed(2) : 0;
    const roiRatio = acquisition > 0 ? +((revenue - operationalCost) / acquisition).toFixed(4) : 0;
    const roiPercent = acquisition > 0 ? +(((revenue - operationalCost) / acquisition) * 100).toFixed(2) : 0;

    return {
      vehicle_id: r.id,
      registration_number: r.registration_number,
      name: r.name,
      type: r.type,
      region: r.region,
      status: r.status,
      acquisition_cost: acquisition,
      fuel_cost: +fuelCost.toFixed(2),
      maintenance_cost: +maintCost.toFixed(2),
      operational_cost: +operationalCost.toFixed(2),
      distance_covered: distance,
      fuel_liters: fuelLiters,
      fuel_efficiency_km_per_l: fuelEfficiency,
      revenue: +revenue.toFixed(2),
      roi_ratio: roiRatio,
      roi_percent: roiPercent,
    };
  });
}

/** Fleet-wide rollup used by the overview report. */
async function overview(filters = {}) {
  const { vWhere, params } = vehicleFilters(filters);

  const sql = `
    SELECT
      COUNT(DISTINCT v.id)                                       AS total_vehicles,
      COALESCE(SUM(CASE WHEN v.status = 'on_trip' THEN 1 ELSE 0 END), 0) AS active_vehicles,
      COALESCE(SUM(f.fuel_cost), 0)                 AS total_fuel_cost,
      COALESCE(SUM(f.fuel_liters), 0)              AS total_fuel_liters,
      COALESCE(SUM(m.maint_cost), 0)               AS total_maintenance_cost,
      COALESCE(SUM(t.distance), 0)                 AS total_distance,
      COALESCE(SUM(t.revenue), 0)                  AS total_revenue,
      COALESCE(SUM(v.acquisition_cost), 0)         AS total_acquisition
    FROM vehicles v
    LEFT JOIN (
      SELECT vehicle_id, SUM(cost) AS fuel_cost, SUM(liters) AS fuel_liters
      FROM fuel_logs GROUP BY vehicle_id
    ) f ON f.vehicle_id = v.id
    LEFT JOIN (
      SELECT vehicle_id, SUM(cost) AS maint_cost
      FROM maintenance_logs GROUP BY vehicle_id
    ) m ON m.vehicle_id = v.id
    LEFT JOIN (
      SELECT vehicle_id,
             SUM(CASE WHEN status = 'completed' THEN planned_distance ELSE 0 END) AS distance,
             SUM(CASE WHEN status = 'completed' THEN revenue ELSE 0 END)         AS revenue
      FROM trips GROUP BY vehicle_id
    ) t ON t.vehicle_id = v.id
    ${vWhere}`;

  const r = (await query(sql, params)).rows[0];
  const fuelCost = Number(r.total_fuel_cost) || 0;
  const maintCost = Number(r.total_maintenance_cost) || 0;
  const operationalCost = fuelCost + maintCost;
  const distance = Number(r.total_distance) || 0;
  const liters = Number(r.total_fuel_liters) || 0;
  const revenue = Number(r.total_revenue) || 0;
  const acquisition = Number(r.total_acquisition) || 0;

  return {
    totalVehicles: Number(r.total_vehicles) || 0,
    activeVehicles: Number(r.active_vehicles) || 0,
    fleetUtilizationPct: Number(r.total_vehicles)
      ? +((Number(r.active_vehicles) / Number(r.total_vehicles)) * 100).toFixed(2)
      : 0,
    totalFuelCost: +fuelCost.toFixed(2),
    totalMaintenanceCost: +maintCost.toFixed(2),
    operationalCost: +operationalCost.toFixed(2),
    totalDistance: distance,
    totalFuelLiters: liters,
    fuelEfficiencyKmPerL: liters > 0 ? +(distance / liters).toFixed(2) : 0,
    totalRevenue: +revenue.toFixed(2),
    totalAcquisitionCost: acquisition,
    roiPercent: acquisition > 0 ? +(((revenue - operationalCost) / acquisition) * 100).toFixed(2) : 0,
  };
}

/** Drivers whose license expires within `days` (used for compliance reminders). */
async function expiringLicenses(days = 30) {
  const sql = `
    SELECT id, name, license_number, license_category, license_expiry_date, contact_number, safety_score, status
    FROM drivers
    WHERE license_expiry_date <= (CURRENT_DATE + $1::integer)
    ORDER BY license_expiry_date ASC`;
  const res = await query(sql, [days]);
  return res.rows;
}

module.exports = { vehicleReport, overview, expiringLicenses };
