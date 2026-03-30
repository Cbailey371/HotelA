import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add the auth token header to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor (optional, e.g. for handling 401s globally)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login'; 
            }
            console.warn("Unauthorized, token might be invalid. Redirecting to login.");
        }
        return Promise.reject(error);
    }
);

export const purchaseQuotes = {
    getAll: () => api.get('/purchases/quotes'),
    create: (data) => api.post('/purchases/quotes', data),
    getById: (id) => api.get(`/purchases/quotes/${id}`),
    update: (id, data) => api.put(`/purchases/quotes/${id}`, data),
    delete: (id) => api.delete(`/purchases/quotes/${id}`),
    sendEmail: (id, emailData) => api.post(`/purchases/quotes/${id}/send`, emailData),
};

export const providers = {
    getAll: () => api.get('/providers'),
};

export const assets = {
    getAllParts: () => api.get('/inventory/parts'),
};

export const purchaseOrders = {
    getAll: () => api.get('/purchases/orders'),
    create: (data) => api.post('/purchases/orders', data),
    getById: (id) => api.get(`/purchases/orders/${id}`),
    update: (id, data) => api.put(`/purchases/orders/${id}`, data),
    updateStatus: (id, status) => api.put(`/purchases/orders/${id}/status`, { status }),
    delete: (id) => api.delete(`/purchases/orders/${id}`),
    sendEmail: (id, data) => api.post(`/purchases/orders/${id}/send`, data),
};

export const purchaseInvoices = {
    getAll: () => api.get('/purchases/invoices'),
    create: (data) => api.post('/purchases/invoices', data),
    receive: (id) => api.post(`/purchases/invoices/${id}/receive`),
    update: (id, data) => api.put(`/purchases/invoices/${id}`, data),
    delete: (id) => api.delete(`/purchases/invoices/${id}`),
};

export const inventory = assets;

export default api;
