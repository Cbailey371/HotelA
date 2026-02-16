import api from './api';

export const inventoryService = {
    getAll: async () => {
        const response = await api.get('/inventory');
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/inventory', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/inventory/${id}`, data);
        return response.data;
    },
    uploadImage: async (id, formData) => {
        const response = await api.post(`/inventory/${id}/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/inventory/${id}`);
        return response.data;
    },
    getTemplateCreate: async () => {
        const response = await api.get('/inventory/template/create', { responseType: 'blob' });
        return response.data;
    },
    getTemplateUpdate: async () => {
        const response = await api.get('/inventory/template/update', { responseType: 'blob' });
        return response.data;
    },
    importCreate: async (formData) => {
        const response = await api.post('/inventory/import/create', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    importUpdate: async (formData) => {
        const response = await api.post('/inventory/import/update', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    getHistory: async (id) => {
        const response = await api.get(`/inventory/${id}/history`);
        return response.data;
    }
};
