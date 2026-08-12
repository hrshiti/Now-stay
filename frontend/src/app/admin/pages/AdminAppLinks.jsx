import React, { useState, useEffect } from 'react';
import {
  Smartphone, Plus, Search, Edit, Trash2, X, ExternalLink,
  Upload, Image as ImageIcon, CheckCircle, AlertCircle, RefreshCw
} from 'lucide-react';
import adminService from '../../../services/adminService';
import toast from 'react-hot-toast';

const AdminAppLinks = () => {
  const [appLinks, setAppLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);

  // Form Data State
  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    playStoreUrl: '',
    appStoreUrl: '',
    isActive: true
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'

  useEffect(() => {
    fetchAppLinks();
  }, []);

  const fetchAppLinks = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAppLinks();
      if (data.success) {
        setAppLinks(data.appLinks || []);
      }
    } catch (error) {
      console.error('Error loading app links:', error);
      toast.error('Failed to load app links');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (app = null) => {
    if (app) {
      setEditingApp(app);
      setFormData({
        name: app.name || '',
        logoUrl: app.logo || '',
        playStoreUrl: app.playStoreUrl || '',
        appStoreUrl: app.appStoreUrl || '',
        isActive: app.isActive !== undefined ? app.isActive : true
      });
      setFilePreview(app.logo || null);
      setUploadMode(app.logo ? 'url' : 'file');
    } else {
      setEditingApp(null);
      setFormData({
        name: '',
        logoUrl: '',
        playStoreUrl: '',
        appStoreUrl: '',
        isActive: true
      });
      setFilePreview(null);
      setUploadMode('file');
    }
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingApp(null);
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('App Name is required');
      return;
    }

    if (uploadMode === 'file' && !selectedFile && !editingApp?.logo) {
      toast.error('Please upload an App Logo image');
      return;
    }

    if (uploadMode === 'url' && !formData.logoUrl.trim()) {
      toast.error('Please provide an App Logo URL');
      return;
    }

    try {
      setSubmitting(true);

      const submitData = new FormData();
      submitData.append('name', formData.name.trim());
      submitData.append('playStoreUrl', formData.playStoreUrl.trim());
      submitData.append('appStoreUrl', formData.appStoreUrl.trim());
      submitData.append('isActive', formData.isActive);

      if (uploadMode === 'file' && selectedFile) {
        submitData.append('logoFile', selectedFile);
      } else {
        submitData.append('logo', formData.logoUrl.trim());
      }

      if (editingApp) {
        const res = await adminService.updateAppLink(editingApp._id, submitData);
        if (res.success) {
          toast.success('App link updated successfully');
        }
      } else {
        const res = await adminService.createAppLink(submitData);
        if (res.success) {
          toast.success('App link created successfully');
        }
      }

      handleCloseModal();
      fetchAppLinks();
    } catch (error) {
      console.error('Error saving app link:', error);
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await adminService.deleteAppLink(id);
      if (res.success) {
        toast.success('App link deleted successfully');
        fetchAppLinks();
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete app link');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await adminService.toggleAppLinkStatus(id);
      if (res.success) {
        toast.success(res.message || 'Status updated');
        setAppLinks(prev =>
          prev.map(app => (app._id === id ? { ...app, isActive: !app.isActive } : app))
        );
      }
    } catch (error) {
      console.error('Toggle error:', error);
      toast.error('Failed to update status');
    }
  };

  const filteredApps = appLinks.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Smartphone className="text-[#0F172A]" size={28} />
            Other App Links Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage links for other mobile applications to display App Store & Play Store download links to users.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-[#003836] text-white px-5 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm"
        >
          <Plus size={18} /> Add App Link
        </button>
      </div>

      {/* Search Bar & Refresh */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by app name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A] transition-all"
          />
        </div>

        <button
          onClick={fetchAppLinks}
          className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all flex items-center gap-2 text-sm font-medium"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* App Links Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-200 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Smartphone size={48} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-bold text-gray-800">No App Links Found</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
            {searchQuery ? 'No app links match your search query.' : 'Click "Add App Link" above to add your first app download link.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map(app => (
            <div
              key={app._id}
              className={`bg-white rounded-2xl border p-5 shadow-sm transition-all flex flex-col justify-between hover:shadow-md relative overflow-hidden ${
                app.isActive ? 'border-gray-100' : 'border-gray-200 bg-gray-50/50'
              }`}
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={app.logo}
                      alt={app.name}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border border-gray-100 shadow-sm shrink-0"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/80?text=App';
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-gray-900 leading-tight break-words">{app.name}</h3>
                      <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                        app.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {app.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                  </div>

                  {/* Toggle status switch */}
                  <button
                    onClick={() => handleToggleStatus(app._id)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ml-2 mt-0.5 ${
                      app.isActive ? 'bg-emerald-600' : 'bg-gray-300'
                    }`}
                    title={app.isActive ? 'Deactivate App Link' : 'Activate App Link'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        app.isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Link URLs */}
                <div className="space-y-2.5 my-4 pt-3 border-t border-gray-100 text-xs">
                  {/* Play Store Link */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-gray-50">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] shrink-0">
                        Play Store
                      </span>
                      <span className="text-gray-600 truncate">{app.playStoreUrl || 'Not provided'}</span>
                    </div>
                    {app.playStoreUrl && (
                      <a
                        href={app.playStoreUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-400 hover:text-emerald-600 p-1 shrink-0"
                        title="Test Play Store Link"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>

                  {/* App Store Link */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-gray-50">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[10px] shrink-0">
                        App Store
                      </span>
                      <span className="text-gray-600 truncate">{app.appStoreUrl || 'Not provided'}</span>
                    </div>
                    {app.appStoreUrl && (
                      <a
                        href={app.appStoreUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-400 hover:text-blue-600 p-1 shrink-0"
                        title="Test App Store Link"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleOpenModal(app)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors"
                >
                  <Edit size={14} /> Edit
                </button>

                <button
                  onClick={() => handleDelete(app._id, app.name)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-colors"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
            >
              <X size={20} />
            </button>

            {/* Modal Title */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingApp ? 'Edit App Link' : 'Add New App Link'}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Provide the app name, logo image, and store download URLs.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* App Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  App Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NowStay Partner App"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F172A] transition-all"
                />
              </div>

              {/* Logo Selection (Upload vs URL) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    App Logo Image <span className="text-red-500">*</span>
                  </label>

                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setUploadMode('file')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        uploadMode === 'file' ? 'bg-[#0F172A] text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode('url')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        uploadMode === 'url' ? 'bg-[#0F172A] text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Image URL
                    </button>
                  </div>
                </div>

                {uploadMode === 'file' ? (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-gray-200 hover:border-[#0F172A] rounded-2xl p-4 text-center transition-colors bg-gray-50/50 relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="mx-auto text-gray-400 mb-1" size={24} />
                      <p className="text-xs font-medium text-gray-600">
                        {selectedFile ? selectedFile.name : 'Click or drag image to upload logo'}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">PNG, JPG, WEBP up to 10MB</p>
                    </div>

                    {filePreview && (
                      <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-200">
                        <img
                          src={filePreview}
                          alt="Preview"
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                        />
                        <span className="text-xs text-gray-600 font-medium">Logo Preview</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={formData.logoUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, logoUrl: e.target.value });
                        setFilePreview(e.target.value);
                      }}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F172A] transition-all"
                    />

                    {formData.logoUrl && (
                      <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-200">
                        <img
                          src={formData.logoUrl}
                          alt="URL Preview"
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/80?text=Invalid';
                          }}
                        />
                        <span className="text-xs text-gray-600 font-medium">Image URL Preview</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Play Store Link */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Google Play Store Link
                </label>
                <input
                  type="url"
                  placeholder="https://play.google.com/store/apps/details?id=com.app"
                  value={formData.playStoreUrl}
                  onChange={(e) => setFormData({ ...formData, playStoreUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F172A] transition-all"
                />
              </div>

              {/* App Store Link */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Apple App Store Link
                </label>
                <input
                  type="url"
                  placeholder="https://apps.apple.com/app/id123456789"
                  value={formData.appStoreUrl}
                  onChange={(e) => setFormData({ ...formData, appStoreUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F172A] transition-all"
                />
              </div>

              {/* Active Switch */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <h4 className="text-xs font-bold text-gray-800">Status</h4>
                  <p className="text-[11px] text-gray-500">Make this app link visible to users</p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 text-sm transition-all"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#003836] text-white font-bold text-sm shadow-md active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : editingApp ? (
                    'Save Changes'
                  ) : (
                    'Create App Link'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAppLinks;
