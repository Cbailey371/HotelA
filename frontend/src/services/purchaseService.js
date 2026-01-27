import api from './api';

export const purchaseService = {
    // Create a new purchase order
    create: async (data) => {
        // data expected: { id_ot, id_proveedor, detalles: [{ id_repuesto, cantidad, costo_unitario }] }
        const response = await api.post('/purchases', data);
        return response.data;
    },

    // Get all purchase orders (with details)
    getAll: async () => {
        const response = await api.get('/purchases');
        // The backend returns [{ order: {...}, details: [...] }, ...]. 
        // We pass it as is or flatten if needed. 
        return response.data;
    },

    // Potential future methods: receive (update stock), getById...
};
