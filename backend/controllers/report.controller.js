const reportRepo = require('../repositories/report.repository');

async function vehicleReport(req, res) {
  const { type, region, status } = req.query;
  res.json({ report: await reportRepo.vehicleReport({ type, region, status }) });
}

async function overview(req, res) {
  const { type, region, status } = req.query;
  res.json({ overview: await reportRepo.overview({ type, region, status }) });
}

async function expiringLicenses(req, res) {
  const days = Number(req.query.days) || 30;
  res.json({ drivers: await reportRepo.expiringLicenses(days) });
}

async function exportCsv(req, res) {
  const { type, region, status } = req.query;
  const rows = await reportRepo.vehicleReport({ type, region, status });

  const headers = [
    'registration_number',
    'name',
    'type',
    'region',
    'status',
    'acquisition_cost',
    'fuel_cost',
    'maintenance_cost',
    'operational_cost',
    'distance_covered',
    'fuel_liters',
    'fuel_efficiency_km_per_l',
    'revenue',
    'roi_ratio',
    'roi_percent',
  ];

  const escape = (value) => {
    const s = String(value ?? '');
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };

  const lines = [headers.join(',')].concat(rows.map((r) => headers.map((h) => escape(r[h])).join(',')));
  const csv = lines.join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="transitops_vehicle_report.csv"');
  res.send(csv);
}

module.exports = { vehicleReport, overview, expiringLicenses, exportCsv };
