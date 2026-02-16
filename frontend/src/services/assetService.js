import api from './api';

export const assetService = {
    getAll: async () => {
        const response = await api.get('/assets');
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/assets/${id}`);
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/assets', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/assets/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/assets/${id}`);
        return response.data;
    },
    getTemplateCreate: async () => {
        const response = await api.get('/assets/template/create', { responseType: 'blob' });
        return response.data;
    },
    getTemplateUpdate: async () => {
        const response = await api.get('/assets/template/update', { responseType: 'blob' });
        return response.data;
    },
    importCreate: async (formData) => {
        const response = await api.post('/assets/import/create', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    importUpdate: async (formData) => {
        const response = await api.post('/assets/import/update', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};
