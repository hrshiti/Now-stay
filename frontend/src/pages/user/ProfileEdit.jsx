import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Phone, Mail, ArrowLeft, Save, Loader2, MapPin, Navigation, Home, Camera, Trash2, AlertTriangle, LogOut } from 'lucide-react';
import { authService, userService } from '../../services/apiService';
import toast from 'react-hot-toast';
import AuthRequired from '../../components/ui/AuthRequired';
import { isFlutterApp, openFlutterCamera, uploadBase64Image } from '../../utils/flutterBridge';

const ProfileEdit = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [deletionOtp, setDeletionOtp] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    profileImage: '',
    profileImagePublicId: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
      coordinates: { lat: null, lng: null }
    }
  });

  useEffect(() => {
    if (showDeleteConfirm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDeleteConfirm]);

  useEffect(() => {
    // Load user data from localStorage
    const token = localStorage.getItem('token');
    if (!token) return;

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setFormData({
          name: user.name || '',
          phone: user.phone || '',
          email: user.email || '',
          profileImage: user.profileImage || '',
          profileImagePublicId: user.profileImagePublicId || '',
          address: user.address || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'India',
            coordinates: { lat: null, lng: null }
          }
        });
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    }
  }, []);

  if (!localStorage.getItem('token')) {
    return <AuthRequired title="Your Profile" message="Please sign in to view and update your personal information and account settings." />;
  }

  const autoFillAddress = async (lat, lng) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAP_API_KEY;
    if (!apiKey) return;

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results?.[0]) {
        const result = data.results[0];
        const addressComponents = result.address_components;

        let streetNumber = '';
        let route = '';
        let neighborhood = '';
        let city = '';
        let state = '';
        let pincode = '';
        let country = '';

        addressComponents.forEach(component => {
          const types = component.types;
          if (types.includes('street_number')) streetNumber = component.long_name;
          if (types.includes('route')) route = component.long_name;
          if (types.includes('neighborhood') || types.includes('sublocality')) neighborhood = component.long_name;
          if (types.includes('locality')) city = component.long_name;
          if (types.includes('administrative_area_level_1')) state = component.long_name;
          if (types.includes('postal_code')) pincode = component.long_name;
          if (types.includes('country')) country = component.long_name;
        });

        if (!city) {
          const sublocality = addressComponents.find(c => c.types.includes('sublocality_level_1'))?.long_name;
          city = sublocality || '';
        }

        const street = [streetNumber, route, neighborhood].filter(Boolean).join(', ') || result.formatted_address.split(',')[0];

        setFormData(prev => ({
          ...prev,
          address: {
            street: street,
            city: city,
            state: state,
            zipCode: pincode,
            country: country || 'India',
            coordinates: { lat, lng }
          }
        }));

        toast.success('Address auto-filled!');
      }
    } catch (error) {
      console.error('Auto-fill error:', error);
      toast.error('Failed to get address details.');
    }
  };

  const handleGetCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation not supported');
      return;
    }

    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await autoFillAddress(latitude, longitude);
        setFetchingLocation(false);
      },
      (error) => {
        console.error('Location error:', error);
        setFetchingLocation(false);
        toast.error('Unable to retrieve location');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const persistProfileImage = async (url, publicId) => {
    const response = await authService.updateProfile({
      profileImage: url,
      profileImagePublicId: publicId
    });

    if (response?.user) {
      const savedUser = localStorage.getItem('user');
      let existingUser = {};

      if (savedUser) {
        try {
          existingUser = JSON.parse(savedUser);
        } catch (error) {
          console.error('Error parsing saved user:', error);
        }
      }

      localStorage.setItem('user', JSON.stringify({
        ...existingUser,
        ...response.user,
        profileImage: url,
        profileImagePublicId: publicId
      }));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPG, PNG and WebP images supported');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('images', file);

    try {
      setImageUploading(true);
      // Reuse existing generic upload service
      const response = await authService.uploadDocs(uploadData);

      if (response && response.files && response.files.length > 0) {
        const { url, publicId } = response.files[0];
        await persistProfileImage(url, publicId);
        setFormData(prev => ({
          ...prev,
          profileImage: url,
          profileImagePublicId: publicId
        }));
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('Failed to upload image');
    } finally {
      setImageUploading(false);
    }
  };

  const handleCameraCapture = async () => {
    try {
      setImageUploading(true);
      const cameraResult = await openFlutterCamera();

      if (!cameraResult.success || !cameraResult.base64) {
        throw new Error(cameraResult.message || 'Camera capture failed');
      }

      // Use the generic base64 upload utility (now uses Axios)
      const uploadResult = await uploadBase64Image(
        cameraResult.base64,
        cameraResult.mimeType,
        cameraResult.fileName
      );

      if (uploadResult.success && uploadResult.files && uploadResult.files.length > 0) {
        const { url, publicId } = uploadResult.files[0];
        await persistProfileImage(url, publicId);
        setFormData(prev => ({
          ...prev,
          profileImage: url,
          profileImagePublicId: publicId
        }));
        toast.success('Photo updated successfully');
      } else {
        throw new Error('Upload failed: No file returned from server');
      }
    } catch (err) {
      console.error('Profile Image Error:', err);
      const msg = err.message || 'Failed to update profile photo';
      toast.error(msg);
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (formData.address.zipCode && !/^\d{6}$/.test(formData.address.zipCode.trim())) {
      newErrors.zipCode = 'Please enter a valid 6-digit pincode';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please correct the highlighted errors');
      return;
    }

    setErrors({});

    try {
      setLoading(true);
      const response = await authService.updateProfile(formData);

      // Update localStorage with new user data
      localStorage.setItem('user', JSON.stringify(response.user));

      toast.success('Profile updated successfully!');
      setIsEditing(false); // Switch back to view mode instead of navigating back immediately
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (!deletionReason.trim()) {
      return toast.error('Please provide a reason for deletion');
    }

    try {
      setDeleteLoading(true);
      await userService.requestDeletion(deletionReason);
      setShowOtpStep(true);
      toast.success('Verification OTP sent to your email');
    } catch (error) {
      toast.error(error.message || 'Deletion request failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleVerifyDeletion = async () => {
    if (!deletionOtp || deletionOtp.length < 4) {
      return toast.error('Please enter a valid OTP');
    }

    try {
      setDeleteLoading(true);
      await userService.verifyDeletion(deletionOtp);
      toast.success('Account permanently deleted');
      authService.logout();
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Verification failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    toast.success('Logged out successfully');
    navigate('/', { replace: true });
  };

  const handleAddressChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  const handleCameraClick = () => {
    if (isFlutterApp()) {
      handleCameraCapture();
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="min-h-screen bg-emerald-100 flex flex-col items-center pt-safe-top pb-24 md:pb-0">

      {/* Sticky Header */}
      <div className="sticky top-0 left-0 right-0 w-full z-20 bg-white/70 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b border-white/50 shadow-sm mb-6">
        <button onClick={() => isEditing ? setIsEditing(false) : navigate(-1)} className="p-2 rounded-full hover:bg-white/50 transition-colors">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-lg font-black text-gray-900 tracking-tight">{isEditing ? 'Edit Profile' : 'My Profile'}</h1>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="p-2 rounded-full bg-surface text-white shadow-lg shadow-surface/20 hover:scale-105 transition-all active:scale-95">
            <Save size={18} />
          </button>
        )}
        {isEditing && <div className="w-10"></div>}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md px-4"
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-[2.5rem] p-8 shadow-xl shadow-emerald-900/5 space-y-8 border border-white/50 mb-8">

          {!isEditing ? (
            /* VIEW MODE */
            <div className="space-y-8">
              {/* Profile Header in View Mode */}
              <div className="flex flex-col items-center">
                <div className="w-28 h-28 rounded-full bg-surface text-white flex items-center justify-center shadow-xl shadow-surface/20 overflow-hidden border-4 border-white mb-4">
                  {formData.profileImage ? (
                    <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} />
                  )}
                </div>
                <h2 className="text-xl font-black text-gray-900">{formData.name || 'Set Name'}</h2>
                <p className="text-sm text-gray-400 font-bold">{formData.email || 'No email'}</p>
              </div>

              {/* Info Cards */}
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Phone</p>
                    <p className="text-sm font-bold text-gray-800">{formData.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Email</p>
                    <p className="text-sm font-bold text-gray-800">{formData.email || 'N/A'}</p>
                  </div>
                </div>

                <div className="p-5 bg-white border border-gray-100 rounded-3xl space-y-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-surface/5 flex items-center justify-center text-surface">
                      <MapPin size={16} />
                    </div>
                    <span className="text-xs font-black text-gray-900 uppercase">Address</span>
                  </div>
                  <div className="space-y-3 pl-2 border-l-2 border-emerald-100">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Street</p>
                      <p className="text-sm font-medium text-gray-700">{formData.address.street || 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">City</p>
                        <p className="text-sm font-medium text-gray-700">{formData.address.city || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Pincode</p>
                        <p className="text-sm font-medium text-gray-700">{formData.address.zipCode || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">State</p>
                      <p className="text-sm font-medium text-gray-700">{formData.address.state || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-surface text-white py-4 rounded-3xl font-black text-sm shadow-xl shadow-surface/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Edit Profile Information
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full bg-gray-50 text-gray-700 py-4 rounded-3xl font-black text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut size={18} className="text-gray-400" />
                  Logout
                </button>
              </div>
            </div>
          ) : (
            /* EDIT MODE */
            <>
              {/* Profile Picture */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-surface text-white flex items-center justify-center shadow-lg shadow-surface/20 overflow-hidden border-4 border-white">
                    {formData.profileImage ? (
                      <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={32} />
                    )}
                    {imageUploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 size={24} className="animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleCameraClick}
                    disabled={imageUploading}
                    className="absolute bottom-0 right-0 p-2 bg-surface text-white rounded-full border-2 border-white shadow-md cursor-pointer hover:bg-surface-dark transition-colors"
                  >
                    <Camera size={16} />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={imageUploading}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-400">Tap icon to change photo</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Section: Personal Info */}
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Full Name</label>
                    <div className={`flex items-center gap-3 border-b pb-2 transition-colors ${errors.name ? 'border-red-500' : 'border-gray-100 focus-within:border-surface'}`}>
                      <User size={16} className={errors.name ? 'text-red-400' : 'text-gray-300'} />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (errors.name) setErrors({ ...errors, name: null });
                        }}
                        className="flex-1 text-sm font-bold text-gray-800 outline-none placeholder:text-gray-300"
                        placeholder="Your Name"
                      />
                    </div>
                    {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tight">{errors.name}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Email Address</label>
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-2 focus-within:border-surface transition-colors">
                      <Mail size={16} className="text-gray-300" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="flex-1 text-sm font-bold text-gray-800 outline-none placeholder:text-gray-300"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Phone Number</label>
                    <div className={`flex items-center gap-3 border-b pb-2 transition-colors ${errors.phone ? 'border-red-500' : 'border-gray-100 focus-within:border-surface'}`}>
                      <Phone size={16} className={errors.phone ? 'text-red-400' : 'text-gray-300'} />
                      <input
                        type="tel"
                        maxLength={10}
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') });
                          if (errors.phone) setErrors({ ...errors, phone: null });
                        }}
                        className="flex-1 text-sm font-bold text-gray-800 outline-none placeholder:text-gray-300"
                        placeholder="9876543210"
                      />
                    </div>
                    {errors.phone && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tight">{errors.phone}</p>}
                  </div>
                </div>


                {/* Section: Address */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Address Details</label>
                    <button
                      type="button"
                      onClick={handleGetCurrentLocation}
                      disabled={fetchingLocation}
                      className="flex items-center gap-1 text-[10px] font-bold text-surface bg-surface/5 px-2 py-1 rounded-md hover:bg-surface/10 transaction-colors"
                    >
                      {fetchingLocation ? <Loader2 size={10} className="animate-spin" /> : <Navigation size={10} />}
                      Auto-Detect
                    </button>
                  </div>

                  {/* Address Inputs - Minimalist Style */}
                  <div className="space-y-4 pt-1">
                    {/* Street */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Street Address</label>
                      <div className="border-b border-gray-100 focus-within:border-surface transition-colors">
                        <input
                          type="text"
                          value={formData.address.street}
                          onChange={(e) => handleAddressChange('street', e.target.value)}
                          className="w-full py-2 text-sm font-bold text-gray-800 outline-none placeholder:text-gray-300 bg-transparent"
                          placeholder="House No, Street, Area"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      {/* City */}
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">City</label>
                        <div className="border-b border-gray-100 focus-within:border-surface transition-colors">
                          <input
                            type="text"
                            value={formData.address.city}
                            onChange={(e) => handleAddressChange('city', e.target.value)}
                            className="w-full py-2 text-sm font-bold text-gray-800 outline-none placeholder:text-gray-300 bg-transparent"
                            placeholder="City"
                          />
                        </div>
                      </div>

                      {/* Pincode */}
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Pincode</label>
                        <div className={`border-b transition-colors ${errors.zipCode ? 'border-red-500' : 'border-gray-100 focus-within:border-surface'}`}>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={formData.address.zipCode}
                            onChange={(e) => {
                              handleAddressChange('zipCode', e.target.value.replace(/\D/g, ''));
                              if (errors.zipCode) setErrors({ ...errors, zipCode: null });
                            }}
                            className="w-full py-2 text-sm font-bold text-gray-800 outline-none placeholder:text-gray-300 bg-transparent"
                            placeholder="000000"
                          />
                        </div>
                        {errors.zipCode && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tight">{errors.zipCode}</p>}
                      </div>
                    </div>

                    {/* State */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">State</label>
                      <div className="border-b border-gray-100 focus-within:border-surface transition-colors">
                        <input
                          type="text"
                          value={formData.address.state}
                          onChange={(e) => handleAddressChange('state', e.target.value)}
                          className="w-full py-2 text-sm font-bold text-gray-800 outline-none placeholder:text-gray-300 bg-transparent"
                          placeholder="State"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 border border-gray-200 text-gray-500 py-3.5 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || imageUploading}
                    className="flex-[2] bg-surface text-white py-3.5 rounded-2xl font-bold text-sm shadow-xl shadow-surface/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Update Profile'}
                  </button>
                </div>
              </form>
            </>
          )}

        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] grid place-items-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-sm rounded-[32px] p-8 overflow-hidden relative shadow-2xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {showOtpStep ? 'Verify Identity' : 'Delete Account?'}
              </h3>

              {!showOtpStep ? (
                <>
                  <p className="text-sm text-gray-500 leading-relaxed mb-6">
                    Are you absolutely sure? This action is <span className="text-red-500 font-bold">permanent</span> and will deactivate your account immediately.
                  </p>
                  <div className="w-full mb-6">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest text-left mb-2 ml-1">Reason for leaving</label>
                    <textarea
                      value={deletionReason}
                      onChange={(e) => setDeletionReason(e.target.value)}
                      placeholder="Tell us why you want to delete your account..."
                      className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold text-gray-800 focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500/30 transition-all resize-none h-24"
                    />
                  </div>
                  <div className="flex flex-col w-full gap-3">
                    <button
                      onClick={handleRequestDeletion}
                      disabled={deleteLoading}
                      className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {deleteLoading ? <Loader2 size={18} className="animate-spin" /> : 'Send Verification OTP'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleteLoading}
                      className="w-full bg-gray-50 text-gray-600 font-bold py-4 rounded-2xl active:scale-95 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500 leading-relaxed mb-6">
                    Enter the 4-digit code sent to your registered email <span className="font-bold text-gray-900">{formData.email || 'account email'}</span>
                  </p>
                  <div className="w-full mb-8">
                    <input
                      type="text"
                      maxLength={4}
                      value={deletionOtp}
                      onChange={(e) => setDeletionOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="0000"
                      className="w-full text-center text-3xl font-black tracking-[0.5em] p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-4 focus:ring-surface/10 focus:border-surface/30 transition-all"
                    />
                  </div>
                  <div className="flex flex-col w-full gap-3">
                    <button
                      onClick={handleVerifyDeletion}
                      disabled={deleteLoading}
                      className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {deleteLoading ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Permanent Deletion'}
                    </button>
                    <button
                      onClick={() => setShowOtpStep(false)}
                      disabled={deleteLoading}
                      className="w-full bg-gray-50 text-gray-600 font-bold py-4 rounded-2xl active:scale-95 transition-all"
                    >
                      Back
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
export default ProfileEdit;
