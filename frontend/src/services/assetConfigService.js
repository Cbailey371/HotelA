
import api from './api';

export const getCategories = () => api.get('/asset-config/categories');
export const getTypes = () => api.get('/asset-config/types');
export const getLocations = () => api.get('/asset-config/locations');
export const getMaintenanceTasks = () => api.get('/asset-config/maintenance-tasks');

export const createCategory = (data) => api.post('/asset-config/categories', data);
export const deleteCategory = (id) => api.delete(`/asset-config/categories/${id}`);

export const createType = (data) => api.post('/asset-config/types', data);
export const deleteType = (id) => api.delete(`/asset-config/types/${id}`);

export const createLocation = (data) => api.post('/asset-config/locations', data);
export const deleteLocation = (id) => api.delete(`/asset-config/locations/${id}`);

export const createMaintenanceTask = (data) => api.post('/asset-config/maintenance-tasks', data);
export const deleteMaintenanceTask = (id) => api.delete(`/asset-config/maintenance-tasks/${id}`);
