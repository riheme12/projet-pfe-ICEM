import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: attach Firebase Auth token to every request
api.interceptors.request.use(async (config) => {
    try {
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        console.error('Error getting auth token:', error);
    }
    return config;
});

// Interceptor: handle 401 responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('isAuthenticated');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const AuthService = {
    login: (idToken) => api.post('/auth/login', { idToken }),
    getMe: () => api.get('/auth/me'),
};

export const OrderService = {
    getAll: () => api.get('/orders'),
    getById: (id) => api.get(`/orders/${id}`),
    getStats: () => api.get('/orders/stats/summary'),
    create: (data) => api.post('/orders', data),
    updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
    update: (id, data) => api.patch(`/orders/${id}`, data),
    delete: (id) => api.delete(`/orders/${id}`),
};

export const InspectionService = {
    getAll: () => api.get('/inspections'),
    getById: (id) => api.get(`/inspections/${id}`),
    getByOrder: (orderId) => api.get(`/inspections/order/${orderId}`),
    create: (data) => api.post('/inspections', data),
    update: (id, data) => api.patch(`/inspections/${id}`, data),
};

export const AnomalyService = {
    getAll: (params) => api.get('/anomalies', { params }),
    getStats: () => api.get('/anomalies/stats/summary'),
    getByCable: (cableId) => api.get(`/anomalies/cable/${cableId}`),
    create: (data) => api.post('/anomalies', data),
    update: (id, data) => api.patch(`/anomalies/${id}`, data),
    delete: (id) => api.delete(`/anomalies/${id}`),
};

export const ReportService = {
    getAll: () => api.get('/reports'),
    getById: (id) => api.get(`/reports/${id}`),
    getByOrder: (orderId) => api.get(`/reports/order/${orderId}`),
    generate: (data) => api.post('/reports/generate', data),
};

export const UserService = {
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.patch(`/users/${id}`, data),
};

export const CableService = {
    getAll: (params) => api.get('/cables', { params }),
    getById: (id) => api.get(`/cables/${id}`),
    getStats: () => api.get('/cables/stats/summary'),
    create: (data) => api.post('/cables', data),
    update: (id, data) => api.patch(`/cables/${id}`, data),
    delete: (id) => api.delete(`/cables/${id}`),
};

export default api;
