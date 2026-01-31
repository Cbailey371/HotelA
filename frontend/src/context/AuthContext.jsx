import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                const parsedUser = JSON.parse(savedUser);
                console.log("DEBUG - AuthContext - User data from storage:", parsedUser);
                setUser(parsedUser);
            }
        }
        setLoading(false);
    }, [token]);

    const login = async (username, password) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || '/api';
            const response = await axios.post(`${apiUrl}/auth/login`, {
                usuario: username,
                password: password,
            });

            const { token, usuario } = response.data;

            setToken(token);
            setUser(usuario);

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(usuario));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            return { success: true };
        } catch (error) {
            console.error("Login error", error);
            return {
                success: false,
                message: error.response?.data || "Login failed"
            };
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
