import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchAlerts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/notifications/alerts');
            setAlerts(response.data);
            setUnreadCount(response.data.length);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAlerts();
        // Polling every 5 minutes
        const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchAlerts]);

    const markAsRead = (id) => {
        // Since we don't have a "read" state in the backend yet, we can filter locally or just manage a "seen" state
        // For now, let's just keep them until the source problem is fixed (e.g. stock restored)
    };

    return (
        <NotificationContext.Provider value={{ alerts, loading, unreadCount, fetchAlerts, markAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
