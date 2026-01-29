import api from './api';

export const getInventoryStatus = (params) => api.get('/reports/inventory-status', { params });
export const getMaintenanceRoi = () => api.get('/reports/maintenance-roi');
export const getAssetDepreciation = () => api.get('/reports/asset-depreciation');
export const getScheduledReports = () => api.get('/reports/scheduled');
export const createScheduledReport = (data) => api.post('/reports/scheduled', data);
export const updateScheduledReport = (id, data) => api.put(`/reports/scheduled/${id}`, data);
export const deleteScheduledReport = (id) => api.delete(`/reports/scheduled/${id}`);
