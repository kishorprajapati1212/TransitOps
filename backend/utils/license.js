/**
 * Returns true when a driver's license expiry date is strictly before today
 * (local midnight). Used by business-rule validation before trip assignment.
 * @param {string|Date} expiryDate
 */
function isLicenseExpired(expiryDate) {
  if (!expiryDate) return true;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return expiry < todayMidnight;
}

module.exports = { isLicenseExpired };
