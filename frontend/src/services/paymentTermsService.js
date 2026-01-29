import api from './api';

export const paymentTermsService = {
    getAll: async () => {
        const response = await api.get('/settings/payment-terms');
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/settings/payment-terms', data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/settings/payment-terms/${id}`);
        return response.data;
    }
};
