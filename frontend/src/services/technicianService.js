import api from './api';

export const technicianService = {
    getAll: async () => {
        const response = await api.get('/technicians');
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/technicians', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/technicians/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/technicians/${id}`);
        return response.data;
    }
};
