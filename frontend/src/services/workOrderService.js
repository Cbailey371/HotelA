import api from './api';

export const workOrderService = {
    getAll: async () => {
        const response = await api.get('/work-orders');
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/work-orders/${id}`);
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
    },

    getComments: async (id) => {
        const response = await api.get(`/work-orders/${id}/comments`);
        return response.data;
    },

    addComment: async (id, comment) => {
        const response = await api.post(`/work-orders/${id}/comments`, { comentario: comment });
        return response.data;
    },

    closeOrder: async (id, comment, status = 'cerrada') => {
        const response = await api.post(`/work-orders/${id}/finish`, { 
            comentario_final: comment,
            estado: status 
        });
        return response.data;
    }
};
