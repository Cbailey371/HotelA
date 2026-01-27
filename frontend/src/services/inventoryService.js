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
    delete: async (id) => {
        const response = await api.delete(`/inventory/${id}`);
        return response.data;
    },
    getTemplate: async () => {
        const response = await api.get('/inventory/template', { responseType: 'blob' });
        return response.data;
    },
    importCsv: async (formData) => {
        const response = await api.post('/inventory/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};
