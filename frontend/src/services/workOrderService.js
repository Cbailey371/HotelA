import api from './api';

export const workOrderService = {
    getAll: async () => {
        const response = await api.get('/work-orders');
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/work-orders', data);
        return response.data;
    },

    updateStatus: async (id, status) => {
        const response = await api.put(`/work-orders/${id}/status`, { estado: status });
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/work-orders/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/work-orders/${id}`);
        return response.data;
    },

    sendEmail: async (id, data) => {
        const response = await api.post(`/work-orders/${id}/send`, data);
        return response.data;
    }
};
