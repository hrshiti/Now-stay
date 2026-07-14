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
  getPartnerPlans: async (propertyType = '') => {
    const url = propertyType ? `/subscriptions/plans?propertyType=${propertyType}` : '/subscriptions/plans';
    const response = await apiClient.get(url);
    return response.data;
  },
  getMySubscription: async (propertyType = '') => {
    const url = propertyType ? `/subscriptions/my-subscription?propertyType=${propertyType}` : '/subscriptions/my-subscription';
    const response = await apiClient.get(url);
    return response.data;
  },
  getSubscriptionStatus: async (propertyType = '') => {
    const url = propertyType ? `/subscriptions/status?propertyType=${propertyType}` : '/subscriptions/status';
    const response = await apiClient.get(url);
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
