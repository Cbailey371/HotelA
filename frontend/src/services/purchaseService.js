import api from './api';

export const purchaseService = {
    // Create a new purchase order (direct)
    create: async (data) => {
        const response = await api.post('/purchases/orders', data);
        return response.data;
    },

    // Get all purchase orders
    getAll: async () => {
        const response = await api.get('/purchases/orders');
        return response.data;
    },

    // Get all purchase requests
    getRequests: async () => {
        const response = await api.get('/purchases/requests');
        return response.data;
    },

    // Create purchase order from request
    createFromRequest: async (requestId, proveedorId) => {
        const response = await api.post(`/purchases/orders/from-request/${requestId}`, { proveedor_id: proveedorId });
        return response.data;
    },

    // Get a single purchase order with details
    getById: async (id) => {
        const response = await api.get(`/purchases/orders/${id}`);
        return response.data;
    },

    // Update an existing purchase order
    update: async (id, data) => {
        const response = await api.put(`/purchases/orders/${id}`, data);
        return response.data;
    },

    // Delete a purchase order
    delete: async (id) => {
        const response = await api.delete(`/purchases/orders/${id}`);
        return response.data;
    },

    // Update order status
    updateStatus: async (id, status) => {
        const response = await api.put(`/purchases/orders/${id}/status`, { estado: status });
        return response.data;
    },

    // Send order via email
    sendEmail: async (id, data) => {
        const response = await api.post(`/purchases/orders/${id}/send`, data);
        return response.data;
    }
};
