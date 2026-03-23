import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Users, CreditCard, Calendar, CheckCircle, Clock } from 'lucide-react';
import subscriptionService from '../../../services/subscriptionService';
import { format } from 'date-fns';

const AdminSubscriptions = () => {
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' or 'purchases'
  const [plans, setPlans] = useState([]);
  const [partnerSubscriptions, setPartnerSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    durationInMonths: 12,
    commissionRate: 0
  });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    if (activeTab === 'plans') {
      fetchPlans();
    } else {
      fetchPartnerSubscriptions();
    }
  }, [activeTab]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await subscriptionService.getAdminPlans();
      setPlans(data.plans || []);
    } catch (error) {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchPartnerSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await subscriptionService.getAdminPartnerSubscriptions();
      setPartnerSubscriptions(data.subscriptions || []);
    } catch (error) {
      toast.error('Failed to load partner subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscriptions = partnerSubscriptions.filter(sub => {
    const matchesSearch = 
      sub.partnerId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.partnerId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.partnerId?.phone?.includes(searchTerm);
    
    const matchesPlan = filterPlan === 'all' || sub.planId?._id === filterPlan;
    const matchesStatus = filterStatus === 'all' || sub.paymentStatus === filterStatus;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.commissionRate < 0 || formData.commissionRate > 100) {
      return toast.error('Commission rate must be between 0 and 100');
    }
    if (formData.price < 0) {
      return toast.error('Price cannot be negative');
    }
    try {
      if (editId) {
        await subscriptionService.updateAdminPlan(editId, formData);
        toast.success('Plan updated successfully');
      } else {
        await subscriptionService.createAdminPlan(formData);
        toast.success('Plan created successfully');
      }
      setShowModal(false);
      fetchPlans();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save plan');
    }
  };

  const openEditModal = (plan) => {
    setEditId(plan._id);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      durationInMonths: plan.durationInMonths,
      commissionRate: plan.commissionRate
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this plan?')) {
      try {
        await subscriptionService.deleteAdminPlan(id);
        toast.success('Plan deactivated successfully');
        fetchPlans();
      } catch (error) {
        toast.error('Failed to deactivate plan');
      }
    }
  };

  const renderStatusBadge = (status) => {
    const styles = {
      paid: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status?.toUpperCase() || 'UNKNOWN'}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions Management</h1>
          <p className="text-gray-500 text-sm">Manage plans and view partner purchases</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'plans' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Subscription Plans
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'purchases' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Partner Subscriptions
          </button>
        </div>

        {activeTab === 'plans' && (
          <button
            onClick={() => {
              setEditId(null);
              setFormData({ name: '', description: '', price: 0, durationInMonths: 12, commissionRate: 0 });
              setShowModal(true);
            }}
            className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors"
          >
            <Plus size={20} /> Add Plan
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      ) : activeTab === 'plans' ? (
        /* Plans Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                  <CreditCard size={24} />
                </div>
                {!plan.isActive && (
                  <span className="bg-red-50 text-red-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    Inactive
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
              <p className="text-gray-500 text-sm mb-4 min-h-[40px]">{plan.description}</p>
              
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-black">₹{plan.price}</span>
                <span className="text-gray-400 text-sm">/ {plan.durationInMonths} mon</span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle size={16} className="text-green-500" />
                  <span>{plan.commissionRate}% Commission Rate</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={16} className="text-blue-500" />
                  <span>{plan.durationInMonths} Months Validity</span>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-50">
                <button
                  onClick={() => openEditModal(plan)}
                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  <Edit2 size={16} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(plan._id)}
                  className="flex items-center gap-1.5 text-red-600 hover:text-red-800 font-medium text-sm"
                >
                  <Trash2 size={16} /> Deactivate
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Partner Subscriptions View */
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search partner name, email or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all text-sm"
              />
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
            
            <div className="flex gap-4">
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black outline-none text-sm font-medium"
              >
                <option value="all">All Plans</option>
                {plans.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black outline-none text-sm font-medium"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Partner</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Plan</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Validity</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredSubscriptions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                        {searchTerm || filterPlan !== 'all' || filterStatus !== 'all' 
                          ? 'No subscriptions match your filters.' 
                          : 'No partner subscriptions found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredSubscriptions.map((sub) => (
                      <tr key={sub._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                              <Users size={16} />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{sub.partnerId?.name || 'N/A'}</div>
                              <div className="text-xs text-gray-500">{sub.partnerId?.phone || sub.partnerId?.email || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{sub.planId?.name || 'Deleted Plan'}</div>
                          <div className="text-xs text-gray-500">Rate: {sub.commissionRate}%</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-gray-400" />
                            <span>{format(new Date(sub.startDate), 'dd MMM yyyy')} - {format(new Date(sub.endDate), 'dd MMM yyyy')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="font-semibold text-gray-900">₹{sub.amountPaid}</div>
                          <div className="text-xs text-gray-400">{sub.paymentMethod} • {sub.paymentId}</div>
                        </td>
                        <td className="px-6 py-4">
                          {renderStatusBadge(sub.paymentStatus)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal remains largely same but updated for better styling */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 overflow-y-auto">
          <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-md shadow-2xl relative my-auto animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-black text-gray-900 mb-6">{editId ? 'Edit Subscription Plan' : 'Create New Plan'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Plan Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all placeholder:text-gray-300 font-medium"
                  placeholder="e.g. Platinum Annual Plan"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all h-28 placeholder:text-gray-300 font-medium"
                  placeholder="Briefly describe the plan benefits"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Duration (Mon)</label>
                  <input
                    type="number"
                    name="durationInMonths"
                    min="1"
                    value={formData.durationInMonths}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all font-bold"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Commission Rate (%)</label>
                <input
                  type="number"
                  name="commissionRate"
                  min="0"
                  max="100"
                  value={formData.commissionRate}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all font-bold"
                  required
                />
                <p className="text-[10px] text-gray-400 font-medium mt-2 px-1">Percentage deducted from booking amount (0-100%)</p>
              </div>
              
              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-all font-bold text-sm active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-black text-white py-4 rounded-2xl hover:bg-gray-900 transition-all font-bold text-sm shadow-xl shadow-black/10 active:scale-95"
                >
                  {editId ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptions;
