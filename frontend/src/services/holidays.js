import api from './api';

const holidaysService = {
    getAll: (year) => api.get(`/holidays`, { params: { year } }),
    create: (data) => api.post(`/holidays`, data),
    update: (id, data) => api.put(`/holidays/${id}`, data),
    delete: (id) => api.delete(`/holidays/${id}`),
    seed: (year) => api.post(`/holidays/seed`, {}, { params: { year } }),
};

export default holidaysService;
