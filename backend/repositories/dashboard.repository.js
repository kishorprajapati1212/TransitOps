const { query } = require('../config/db');

/**
 * Aggregates the dashboard KPIs.
 * Vehicle-scoped filters (type / status / region) are applied to the vehicle
 * counts and therefore also to Fleet Utilization.
 */
async function getKpis({ type, status, region } = {}) {
  const where = [];
  const params = [];
  if (type) {
    params.push(type);
    where.push(`type = $${params.length}`);
  }
  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (region) {
    params.push(region);
    where.push(`region = $${params.length}`);
  }
  const vWhere = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const vehicleStats = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN status = 'on_trip'   THEN 1 ELSE 0 END), 0) AS active_vehicles,
       COALESCE(SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END), 0) AS available_vehicles,
       COALESCE(SUM(CASE WHEN status = 'in_shop'   THEN 1 ELSE 0 END), 0) AS vehicles_in_maintenance,
       COALESCE(SUM(CASE WHEN status = 'retired'   THEN 1 ELSE 0 END), 0) AS retired_vehicles,
       COUNT(*)                                                   AS total_vehicles
     FROM vehicles ${vWhere}`,
    params
  );

  const tripStats = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN status = 'dispatched' THEN 1 ELSE 0 END), 0) AS active_trips,
       COALESCE(SUM(CASE WHEN status = 'draft'      THEN 1 ELSE 0 END), 0) AS pending_trips,
       COALESCE(SUM(CASE WHEN status = 'completed'  THEN 1 ELSE 0 END), 0) AS completed_trips,
       COALESCE(SUM(CASE WHEN status = 'cancelled'  THEN 1 ELSE 0 END), 0) AS cancelled_trips,
       COUNT(*)                                                                  AS total_trips
     FROM trips`
  );

  const driverStats = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN status = 'on_trip'  THEN 1 ELSE 0 END), 0) AS drivers_on_duty,
       COALESCE(SUM(CASE WHEN status = 'available'THEN 1 ELSE 0 END), 0) AS available_drivers,
       COALESCE(SUM(CASE WHEN status = 'suspended'THEN 1 ELSE 0 END), 0) AS suspended_drivers,
       COUNT(*)                                                            AS total_drivers
     FROM drivers`
  );

  const vs = vehicleStats.rows[0];
  const totalVehicles = Number(vs.total_vehicles) || 0;
  const activeVehicles = Number(vs.active_vehicles) || 0;
  const fleetUtilizationPct = totalVehicles ? +((activeVehicles / totalVehicles) * 100).toFixed(2) : 0;

  return {
    totalVehicles,
    activeVehicles,
    availableVehicles: Number(vs.available_vehicles) || 0,
    vehiclesInMaintenance: Number(vs.vehicles_in_maintenance) || 0,
    retiredVehicles: Number(vs.retired_vehicles) || 0,
    totalTrips: Number(tripStats.rows[0].total_trips) || 0,
    activeTrips: Number(tripStats.rows[0].active_trips) || 0,
    pendingTrips: Number(tripStats.rows[0].pending_trips) || 0,
    completedTrips: Number(tripStats.rows[0].completed_trips) || 0,
    cancelledTrips: Number(tripStats.rows[0].cancelled_trips) || 0,
    totalDrivers: Number(driverStats.rows[0].total_drivers) || 0,
    driversOnDuty: Number(driverStats.rows[0].drivers_on_duty) || 0,
    availableDrivers: Number(driverStats.rows[0].available_drivers) || 0,
    suspendedDrivers: Number(driverStats.rows[0].suspended_drivers) || 0,
    fleetUtilizationPct,
  };
}

module.exports = { getKpis };
