import api from './api';

export const locationService = {
    getAll: async () => {
        const response = await api.get('/asset-config/locations');
        return response.data;
    }
};
