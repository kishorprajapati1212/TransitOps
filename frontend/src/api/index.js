import client from './client';

// Normalize backend errors into a simple thrown message.
const handle = async (promise) => {
  try {
    const res = await promise;
    return res.data;
  } catch (err) {
    const details = err.response?.data?.details;
    if (Array.isArray(details) && details.length) {
      throw new Error(details.map((d) => d.message).join(', '));
    }
    throw new Error(err.response?.data?.error || err.message || 'Request failed');
  }
};

export const auth = {
  login: (email, password) => handle(client.post('/auth/login', { email, password })),
  register: (data) => handle(client.post('/auth/register', data)),
  me: () => handle(client.get('/auth/me')),
};

export const vehicles = {
  list: (params) => handle(client.get('/vehicles', { params })),
  get: (id) => handle(client.get(`/vehicles/${id}`)),
  create: (data) => handle(client.post('/vehicles', data)),
  update: (id, data) => handle(client.patch(`/vehicles/${id}`, data)),
  remove: (id) => handle(client.delete(`/vehicles/${id}`)),
};

export const drivers = {
  list: (params) => handle(client.get('/drivers', { params })),
  get: (id) => handle(client.get(`/drivers/${id}`)),
  create: (data) => handle(client.post('/drivers', data)),
  update: (id, data) => handle(client.patch(`/drivers/${id}`, data)),
  updateCompliance: (id, data) => handle(client.patch(`/drivers/${id}/compliance`, data)),
  remove: (id) => handle(client.delete(`/drivers/${id}`)),
};

export const trips = {
  list: (params) => handle(client.get('/trips', { params })),
  get: (id) => handle(client.get(`/trips/${id}`)),
  create: (data) => handle(client.post('/trips', data)),
  update: (id, data) => handle(client.patch(`/trips/${id}`, data)),
  dispatch: (id) => handle(client.post(`/trips/${id}/dispatch`)),
  complete: (id, data) => handle(client.post(`/trips/${id}/complete`, data)),
  cancel: (id) => handle(client.post(`/trips/${id}/cancel`)),
};

export const maintenance = {
  list: (params) => handle(client.get('/maintenance', { params })),
  get: (id) => handle(client.get(`/maintenance/${id}`)),
  create: (data) => handle(client.post('/maintenance', data)),
  close: (id) => handle(client.post(`/maintenance/${id}/close`)),
  remove: (id) => handle(client.delete(`/maintenance/${id}`)),
};

export const fuel = {
  list: (params) => handle(client.get('/fuel', { params })),
  create: (data) => handle(client.post('/fuel', data)),
  remove: (id) => handle(client.delete(`/fuel/${id}`)),
};

export const expenses = {
  list: (params) => handle(client.get('/expenses', { params })),
  create: (data) => handle(client.post('/expenses', data)),
  remove: (id) => handle(client.delete(`/expenses/${id}`)),
};

export const dashboard = {
  get: (params) => handle(client.get('/dashboard', { params })),
};

export const reports = {
  overview: (params) => handle(client.get('/reports', { params })),
  vehicleReport: (params) => handle(client.get('/reports/vehicles', { params })),
  expiringLicenses: (days) => handle(client.get('/reports/expiring-licenses', { params: { days } })),
  exportCsv: async (params) => {
    const res = await client.get('/reports/export.csv', { params, responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transitops_vehicle_report.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};

export const activity = {
  recent: (limit = 20) => handle(client.get('/activity', { params: { limit } })),
};

export const users = {
  list: () => handle(client.get('/users')),
  get: (id) => handle(client.get(`/users/${id}`)),
  create: (data) => handle(client.post('/users', data)),
  changeRole: (id, role) => handle(client.patch(`/users/${id}/role`, { role })),
  linkDriver: (id, driver_id) => handle(client.post(`/users/${id}/link-driver`, { driver_id })),
  remove: (id) => handle(client.delete(`/users/${id}`)),
};
