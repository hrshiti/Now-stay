import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Check, X, Loader2, 
  Building2, Home, Palmtree, Hotel, Building, BedDouble, Tent, 
  Trees, Mountain, Waves, Umbrella, Coffee, Snowflake, MapPin, 
  Globe, Zap, Shield, Heart, Star, Camera, Compass
} from 'lucide-react';
import adminService from '../../../services/adminService';
import toast from 'react-hot-toast';

const LUCIDE_ICONS = {
  Building2, Home, Palmtree, Hotel, Building, BedDouble, Tent, 
  Trees, Mountain, Waves, Umbrella, Coffee, Snowflake, MapPin, 
  Globe, Zap, Shield, Heart, Star, Camera, Compass
};

const TEMPLATE_TYPES = ["villa", "resort", "hotel", "hostel", "pg", "homestay", "tent"];

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: 'Building2',
    templateType: 'hotel',
    description: '',
    isActive: true
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await adminService.getCategories();
      if (res.success) {
        setCategories(res.categories);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setFormData({
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon || 'Building2',
        templateType: cat.templateType,
        description: cat.description || '',
        isActive: cat.isActive ?? true
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        slug: '',
        icon: 'Building2',
        templateType: 'hotel',
        description: '',
        isActive: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.slug || !formData.templateType) {
      return toast.error('Please fill all required fields');
    }

    try {
      setLoading(true);
      if (editingCategory) {
        const res = await adminService.updateCategory(editingCategory._id, formData);
        if (res.success) {
          toast.success('Category updated successfully');
          fetchCategories();
          handleCloseModal();
        }
      } else {
        const res = await adminService.createCategory(formData);
        if (res.success) {
          toast.success('Category created successfully');
          fetchCategories();
          handleCloseModal();
        }
      }
    } catch (error) {
      toast.error(error.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? Properties using it might be affected.')) return;
    try {
      setLoading(true);
      const res = await adminService.deleteCategory(id);
      if (res.success) {
        toast.success('Category deleted');
        fetchCategories();
      }
    } catch (error) {
      toast.error(error.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Category management</h1>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Manage dynamic property categories and templates</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl font-bold text-xs uppercase transition-transform active:scale-95 shadow-lg shadow-black/20"
        >
          <Plus size={16} /> Add New Category
        </button>
      </div>

      {/* Filters/Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search categories by name or slug..." 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-black/5 transition-all outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Icon</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category Detail</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Slug</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Template Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && categories.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-gray-400 mb-2" />
                    <span className="text-xs font-bold text-gray-400 uppercase">Loading categories...</span>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <span className="text-xs font-bold text-gray-400 uppercase">No categories found matching your search.</span>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => {
                  const IconComp = LUCIDE_ICONS[cat.icon] || Building2;
                  return (
                    <tr key={cat._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-black group-hover:text-white transition-all">
                          <IconComp size={20} />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-bold text-gray-900 group-hover:text-black transition-colors">{cat.name}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-bold truncate max-w-[200px]">{cat.description || 'No description'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{cat.slug}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase border border-blue-100">{cat.templateType}</span>
                      </td>
                      <td className="px-6 py-4">
                        {cat.isActive ? (
                          <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-bold bg-green-50 text-green-600 uppercase">
                            <Check size={10} strokeWidth={3} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 uppercase">
                            <X size={10} strokeWidth={3} /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenModal(cat)} className="p-2 text-gray-400 hover:text-black hover:bg-white rounded-lg transition-all">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(cat._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">{editingCategory ? 'Edit Category' : 'Create New Category'}</h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 hover:bg-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
              {/* Scrollable Body */}
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Category Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Treehouse"
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-black/5 transition-all outline-none"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Slug (URL friendly) *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. treehouse"
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-black/5 transition-all outline-none"
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Template Type (Behavior) *</label>
                    <div className="relative">
                      <select 
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-black/5 transition-all outline-none appearance-none"
                        value={formData.templateType}
                        onChange={(e) => setFormData({...formData, templateType: e.target.value})}
                      >
                        {TEMPLATE_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Status</label>
                    <div className="flex items-center gap-4 py-1.5 px-1">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                        className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${formData.isActive ? 'bg-black' : 'bg-gray-200'}`}
                      >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${formData.isActive ? 'translate-x-6' : ''}`} />
                      </button>
                      <span className="text-xs font-bold uppercase text-gray-500">{formData.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Select Category Icon</label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 p-3 bg-gray-50 rounded-2xl max-h-[160px] overflow-y-auto custom-scrollbar border border-gray-100">
                    {Object.entries(LUCIDE_ICONS).map(([name, Icon]) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setFormData({...formData, icon: name})}
                        className={`p-3 rounded-xl flex items-center justify-center transition-all ${formData.icon === name ? 'bg-black text-white scale-105 shadow-md' : 'bg-white text-gray-400 hover:text-black hover:bg-gray-100'}`}
                      >
                        <Icon size={18} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Description</label>
                  <textarea 
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-black/5 transition-all outline-none resize-none"
                    placeholder="Tell us about this category..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="flex-1 py-3.5 bg-white border border-gray-200 text-gray-600 font-bold text-[11px] uppercase rounded-2xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-[2] py-3.5 bg-black text-white font-bold text-[11px] uppercase rounded-2xl hover:shadow-xl hover:shadow-black/20 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                  {editingCategory ? 'Update category' : 'Create category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
