const dashboardRepo = require('../repositories/dashboard.repository');

async function getDashboard(req, res) {
  const { type, status, region } = req.query;
  res.json({ kpis: await dashboardRepo.getKpis({ type, status, region }) });
}

module.exports = { getDashboard };
