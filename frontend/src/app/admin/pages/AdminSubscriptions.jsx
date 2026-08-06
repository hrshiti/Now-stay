import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Users, CreditCard, Calendar, CheckCircle, Clock, Waves, Mountain, Trees, Sun } from 'lucide-react';
import subscriptionService from '../../../services/subscriptionService';
import { format } from 'date-fns';
import { api } from '../../../services/apiService';

const AdminSubscriptions = () => {
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' or 'purchases'
  const [plans, setPlans] = useState([]);
  const [partnerSubscriptions, setPartnerSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dynamicCategories, setDynamicCategories] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    durationInMonths: '',
    propertyTemplate: 'all',
    starRatings: [],
    hotelCategories: [],
    resortTypes: []
  });
  const [editId, setEditId] = useState(null);

  const toggleStarRating = (star) => {
    setFormData(prev => {
      const current = prev.starRatings || [];
      const updated = current.includes(star) ? current.filter(s => s !== star) : [...current, star];
      return { ...prev, starRatings: updated };
    });
  };

  const toggleHotelCategory = (cat) => {
    setFormData(prev => {
      const current = prev.hotelCategories || [];
      const updated = current.includes(cat) ? current.filter(c => c !== cat) : [...current, cat];
      return { ...prev, hotelCategories: updated };
    });
  };

  const toggleResortType = (rt) => {
    setFormData(prev => {
      const current = prev.resortTypes || [];
      const updated = current.includes(rt) ? current.filter(r => r !== rt) : [...current, rt];
      return { ...prev, resortTypes: updated };
    });
  };

  useEffect(() => {
    if (activeTab === 'plans') {
      fetchPlans();
    } else {
      fetchPartnerSubscriptions();
    }
    
    // Fetch dynamic categories once
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data.success) {
          setDynamicCategories(res.data.categories);
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchCategories();
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
    if (formData.price < 0) {
      return toast.error('Price cannot be negative');
    }
    const submissionData = {
      ...formData,
      price: Number(formData.price || 0),
      durationInMonths: Number(formData.durationInMonths || 1),
      commissionRate: 0,
      starRatings: formData.starRatings || [],
      hotelCategories: formData.hotelCategories || [],
      resortTypes: formData.resortTypes || []
    };

    try {
      if (editId) {
        await subscriptionService.updateAdminPlan(editId, submissionData);
        toast.success('Plan updated successfully');
      } else {
        await subscriptionService.createAdminPlan(submissionData);
        toast.success('Plan created successfully');
      }
      setShowModal(false);
      fetchPlans();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save plan');
    }
  };

  const openEditModal = (plan) => {
    const validCategories = ["Small Scale", "Lodge", "Budget", "Premium", "Luxury"];
    setEditId(plan._id);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: Number(plan.price) === 0 ? '' : plan.price,
      durationInMonths: Number(plan.durationInMonths) === 0 ? '' : plan.durationInMonths,
      propertyTemplate: plan.propertyTemplate || 'all',
      starRatings: plan.starRatings || [],
      hotelCategories: (plan.hotelCategories || []).filter(c => validCategories.includes(c)),
      resortTypes: (plan.resortTypes || []).filter(rt => ["Beach", "Hill", "Jungle", "Desert"].includes(rt))
    });
    setShowModal(true);
  };

  const handleAdminCancelSubscription = async (subId, partnerName) => {
    if (!window.confirm(`Are you sure you want to cancel subscription for ${partnerName}? Remaining prorated balance will be credited to partner wallet.`)) {
      return;
    }
    try {
      const res = await subscriptionService.adminCancelSubscription(subId);
      toast.success(res.message || 'Subscription cancelled successfully!');
      fetchPartnerSubscriptions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel subscription');
    }
  };

  const renderStatusBadge = (sub) => {
    if (sub.paymentStatus === 'cancelled' || !sub.isActive) {
      return (
        <span className="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
          Cancelled
        </span>
      );
    }
    const isExpired = new Date(sub.endDate) < new Date();
    if (isExpired) {
      return (
        <span className="bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
          Expired
        </span>
      );
    }
    return (
      <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
        Active
      </span>
    );
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
              setFormData({ name: '', description: '', price: '', durationInMonths: '', propertyTemplate: 'all', starRatings: [], hotelCategories: [], resortTypes: [] });
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {plans.map(plan => (
            <div key={plan._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-wrap gap-1.5 items-center">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                    <CreditCard size={24} />
                  </div>
                  <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    {plan.propertyTemplate}
                  </span>
                </div>
                {!plan.isActive && (
                  <span className="bg-red-50 text-red-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    Inactive
                  </span>
                )}
              </div>

              {/* Target Categories / Stars Badges */}
              {((plan.starRatings && plan.starRatings.length > 0) || (plan.hotelCategories && plan.hotelCategories.length > 0) || (plan.resortTypes && plan.resortTypes.length > 0)) && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {plan.starRatings && plan.starRatings.length > 0 && (
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1">
                      ★ {plan.starRatings.join(', ')} Stars
                    </span>
                  )}
                  {plan.hotelCategories && plan.hotelCategories.filter(c => c !== 'Low Budget').length > 0 && (
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                      🏢 {plan.hotelCategories.filter(c => c !== 'Low Budget').join(', ')}
                    </span>
                  )}
                  {plan.resortTypes && plan.resortTypes.filter(rt => !["5 Star Resort", "Luxury"].includes(rt)).length > 0 && (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                      🏝️ {plan.resortTypes.filter(rt => !["5 Star Resort", "Luxury"].includes(rt)).join(', ')}
                    </span>
                  )}
                </div>
              )}

              <h2 className="text-base font-bold text-gray-900 mb-1 leading-snug break-words">{plan.name}</h2>
              <p className="text-xs text-gray-500 mb-3 min-h-[32px] leading-relaxed break-words">{plan.description}</p>
              
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-black text-gray-900">₹{plan.price}</span>
                <span className="text-gray-400 text-xs font-medium">/ {plan.durationInMonths} mon</span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock size={14} className="text-blue-500" />
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
                <option value="cancelled">Cancelled</option>
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
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Payment & Refund</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredSubscriptions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
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
                          <div className="text-xs text-gray-500">Rate: 0%</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-gray-400" />
                            <span>{format(new Date(sub.startDate), 'dd MMM yyyy')} - {format(new Date(sub.endDate), 'dd MMM yyyy')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="font-semibold text-gray-900">Paid: ₹{sub.amountPaid || 0}</div>
                          {sub.paymentStatus === 'cancelled' ? (
                            <div className="mt-1 space-y-0.5 text-xs">
                              <div className="font-medium text-red-600">Refunded / Remaining: ₹{sub.refundAmount || 0}</div>
                              <div className="font-medium text-emerald-700">Net Admin Revenue: ₹{Math.max(0, (sub.amountPaid || 0) - (sub.refundAmount || 0))}</div>
                              {sub.cancelledAt && (
                                <div className="text-[10px] text-gray-400">
                                  Cancelled on {format(new Date(sub.cancelledAt), 'dd MMM yyyy, p')} {sub.cancelledBy ? `by ${sub.cancelledBy}` : ''}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400">{sub.paymentMethod || 'Online'} • {sub.paymentId || 'N/A'}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {renderStatusBadge(sub)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {sub.isActive && sub.paymentStatus !== 'cancelled' && new Date(sub.endDate) > new Date() ? (
                            <button
                              onClick={() => handleAdminCancelSubscription(sub._id, sub.partnerId?.name || 'Partner')}
                              className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-all"
                            >
                              Cancel & Refund
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium">--</span>
                          )}
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
                    onFocus={(e) => e.target.select()}
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
                    onFocus={(e) => e.target.select()}
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Property Type</label>
                <select
                  name="propertyTemplate"
                  value={formData.propertyTemplate}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all font-medium capitalize"
                >
                  <option value="all">All Properties</option>
                  <option value="hotel">Hotel</option>
                  <option value="villa">Villa</option>
                  <option value="resort">Resort</option>
                  <option value="hostel">Hostel</option>
                  <option value="pg">PG</option>
                  <option value="homestay">Homestay</option>
                  <option value="tent">Tent</option>
                  <option value="apartment">Apartment</option>
                  {dynamicCategories.map(cat => (
                    <option key={cat._id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Star Rating & Property Scale Selection (For Hotel, Resort, or All) */}
              {(formData.propertyTemplate === 'all' || formData.propertyTemplate === 'hotel' || formData.propertyTemplate === 'resort') && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      Target Star Ratings (Leave empty for All Stars)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(star => {
                        const selected = (formData.starRatings || []).includes(star);
                        return (
                          <button
                            type="button"
                            key={star}
                            onClick={() => toggleStarRating(star)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                              selected
                                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {star} ★
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      Target Scale / Category (Optional)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["Small Scale", "Lodge", "Budget", "Premium", "Luxury"].map(cat => {
                        const selected = (formData.hotelCategories || []).includes(cat);
                        return (
                          <button
                            type="button"
                            key={cat}
                            onClick={() => toggleHotelCategory(cat)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                              selected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Resort Category Selection (Only for Resort or All) */}
              {(formData.propertyTemplate === 'all' || formData.propertyTemplate === 'resort') && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Target Resort Type (Optional)
                  </label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {[
                      { value: 'Beach', label: 'Beach Resort', icon: Waves },
                      { value: 'Hill', label: 'Hill Resort', icon: Mountain },
                      { value: 'Jungle', label: 'Jungle Resort', icon: Trees },
                      { value: 'Desert', label: 'Desert Resort', icon: Sun }
                    ].map(rt => {
                      const selected = (formData.resortTypes || []).includes(rt.value);
                      return (
                        <button
                          key={rt.value}
                          type="button"
                          onClick={() => toggleResortType(rt.value)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${selected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500'
                            : 'border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/50 text-gray-600'
                            }`}
                        >
                          <div className={`p-2 rounded-lg ${selected ? 'bg-white text-emerald-600 shadow-sm' : 'bg-gray-100 text-gray-500'}`}>
                            <rt.icon size={20} />
                          </div>
                          <span className="text-sm font-bold">{rt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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
