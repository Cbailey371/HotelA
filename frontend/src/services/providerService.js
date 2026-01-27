import api from './api';

export const providerService = {
    getAll: async () => {
        const response = await api.get('/providers');
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/providers', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/providers/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/providers/${id}`);
        return response.data;
    }
};
