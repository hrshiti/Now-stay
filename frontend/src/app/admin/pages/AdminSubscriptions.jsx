import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import subscriptionService from '../../../services/subscriptionService';

const PlanModal = ({ plan, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        maxProperties: 1,
        price: 0,
        durationDays: 30,
        description: '',
        isActive: true
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (plan) {
            setFormData({
                name: plan.name || '',
                maxProperties: plan.maxProperties || 1,
                price: plan.price || 0,
                durationDays: plan.durationDays || 30,
                description: plan.description || '',
                isActive: plan.isActive !== undefined ? plan.isActive : true
            });
        }
    }, [plan]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (plan) {
                await subscriptionService.updatePlan(plan._id, formData);
                toast.success('Plan updated successfully');
            } else {
                await subscriptionService.createPlan(formData);
                toast.success('Plan created successfully');
            }
            onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save plan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b shrink-0">
                    <h2 className="text-xl font-bold text-gray-900">
                        {plan ? 'Edit Subscription Plan' : 'Add New Plan'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
                    <div className="p-6 space-y-4 overflow-y-auto">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                placeholder="e.g. Starter Pack"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Properties Allowed</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={formData.maxProperties}
                                    onChange={(e) => setFormData({ ...formData, maxProperties: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Validity (Days)</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={formData.durationDays}
                                    onChange={(e) => setFormData({ ...formData, durationDays: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                    className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                rows="3"
                                placeholder="Details about this plan..."
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                                Active (Visible to partners)
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-3 p-6 border-t bg-gray-50 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save Plan
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdminSubscriptions = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const data = await subscriptionService.getAllPlans();
            if (data.success) {
                setPlans(data.plans);
            }
        } catch (error) {
            toast.error('Failed to fetch subscription plans');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingPlan(null);
        setShowModal(true);
    };

    const handleEdit = (plan) => {
        setEditingPlan(plan);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to deactivate this plan?')) return;

        try {
            await subscriptionService.deletePlan(id);
            toast.success('Plan deactivated');
            fetchPlans();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage partner subscription tiers and limits</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700 transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    Add Plan
                </button>
            </div>

            {/* Plans List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                    </div>
                ) : plans.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <AlertCircle className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-lg font-medium">No plans found</p>
                        <p className="text-sm">Create a subscription plan to get started</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan Name</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Limits</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Validity</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {plans.map((plan) => (
                                <tr key={plan._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900">{plan.name}</div>
                                        <div className="text-xs text-gray-500 truncate max-w-xs">{plan.description}</div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {formatCurrency(plan.price)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                            <span className="font-bold">{plan.maxProperties}</span> Properties
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {plan.durationDays} Days
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${plan.isActive
                                            ? 'bg-green-50 text-green-700'
                                            : 'bg-red-50 text-red-700'
                                            }`}>
                                            {plan.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(plan)}
                                                className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(plan._id)}
                                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Deactivate"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <PlanModal
                    plan={editingPlan}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        fetchPlans();
                    }}
                />
            )}
        </div>
    );
};

export default AdminSubscriptions;
