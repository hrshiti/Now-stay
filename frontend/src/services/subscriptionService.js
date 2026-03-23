import { api as apiClient } from './apiService';

const subscriptionService = {
  // --- ADMIN ---
  getAdminPlans: async () => {
    const response = await apiClient.get('/subscriptions/admin/plans');
    return response.data;
  },
  createAdminPlan: async (data) => {
    const response = await apiClient.post('/subscriptions/admin/plans', data);
    return response.data;
  },
  updateAdminPlan: async (id, data) => {
    const response = await apiClient.put(`/subscriptions/admin/plans/${id}`, data);
    return response.data;
  },
  deleteAdminPlan: async (id) => {
    const response = await apiClient.delete(`/subscriptions/admin/plans/${id}`);
    return response.data;
  },
  getAdminPartnerSubscriptions: async () => {
    const response = await apiClient.get('/subscriptions/admin/partner-subscriptions');
    return response.data;
  },

  // --- PARTNER ---
  getPartnerPlans: async () => {
    const response = await apiClient.get('/subscriptions/plans');
    return response.data;
  },
  getMySubscription: async () => {
    const response = await apiClient.get('/subscriptions/my-subscription');
    return response.data;
  },
  buySubscription: async (data) => {
    // data must have { planId, paymentMethod, paymentId, ...razorpayFields }
    const response = await apiClient.post('/subscriptions/buy-subscription', data);
    return response.data;
  },
  createSubscriptionOrder: async (planId) => {
    const response = await apiClient.post('/subscriptions/create-order', { planId });
    return response.data;
  }
};

export default subscriptionService;
