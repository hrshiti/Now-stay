import axios from 'axios';
import { axiosInstance } from '../app/admin/store/adminStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const subscriptionService = {
    // --- ADMIN ---
    createPlan: async (planData) => {
        const response = await axiosInstance.post('/subscriptions/admin/create', planData);
        return response.data;
    },

    getAllPlans: async () => {
        const response = await axiosInstance.get('/subscriptions/admin/all');
        return response.data;
    },

    updatePlan: async (id, planData) => {
        const response = await axiosInstance.put(`/subscriptions/admin/${id}`, planData);
        return response.data;
    },

    deletePlan: async (id) => {
        const response = await axiosInstance.delete(`/subscriptions/admin/${id}`);
        return response.data;
    },

    // --- PARTNER ---
    getActivePlans: async () => {
        const response = await axios.get(`${API_URL}/subscriptions/plans`, {
            withCredentials: true
        });
        return response.data;
    },

    getCurrentSubscription: async () => {
        const response = await axios.get(`${API_URL}/subscriptions/current`, {
            withCredentials: true
        });
        return response.data;
    },

    createSubscriptionOrder: async (planId) => {
        const response = await axios.post(`${API_URL}/subscriptions/checkout`, { planId }, {
            withCredentials: true
        });
        return response.data;
    },

    verifySubscription: async (paymentData) => {
        const response = await axios.post(`${API_URL}/subscriptions/verify`, paymentData, {
            withCredentials: true
        });
        return response.data;
    }
};

export default subscriptionService;
