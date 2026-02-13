import api from './api';

export const purchaseInvoicesService = {
    getAll: async () => {
        const response = await api.get('/purchases/invoices');
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/purchases/invoices', data);
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/purchases/invoices/${id}`);
        return response.data;
    },
    receive: async (id, items) => {
        const response = await api.post(`/purchases/invoices/${id}/receive`, { items });
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/purchases/invoices/${id}`);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/purchases/invoices/${id}`, data);
        return response.data;
    }
};
