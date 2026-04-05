'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Lock,
  Store,
  Camera,
  Save,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Trash2,
  Shield,
} from 'lucide-react';
import { useCRMStore } from '@/store/use-crm-store';
import { useToast } from '@/hooks/use-toast';

type Tab = 'personal' | 'password' | 'shop' | 'photo';

interface AdminData {
  id: string;
  username: string;
  role: string;
  fullName: string;
  mobile: string;
  email: string;
  createdAt: string;
}

interface ShopData {
  id: string;
  shopName: string;
  gstNo: string;
  address: string;
  phone: string;
}

export default function ProfileModule() {
  const { admin, setAdmin } = useCRMStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [loading, setLoading] = useState(false);

  // Personal info
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [savingPersonal, setSavingPersonal] = useState(false);

  // Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Shop
  const [shopName, setShopName] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [savingShop, setSavingShop] = useState(false);

  // Photo
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/crm/profile', { headers: { 'x-admin-id': admin?.id || '' } });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      if (data.admin) {
        setFullName(data.admin.fullName || '');
        setMobile(data.admin.mobile || '');
        setEmail(data.admin.email || '');
      }
      if (data.shop) {
        setShopName(data.shop.shopName || '');
        setGstNo(data.shop.gstNo || '');
        setShopAddress(data.shop.address || '');
        setShopPhone(data.shop.phone || '');
      }
      if (admin?.id) {
        // Try to load existing photo
        const jpgUrl = `/profiles/${admin.id}.jpg`;
        const pngUrl = `/profiles/${admin.id}.png`;
        const img = new Image();
        img.onload = () => { setCurrentPhotoUrl(jpgUrl); };
        img.onerror = () => {
          const img2 = new Image();
          img2.onload = () => { setCurrentPhotoUrl(pngUrl); };
          img2.onerror = () => {};
          img2.src = pngUrl;
        };
        img.src = jpgUrl;
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  /* ─── Save Handlers ─── */

  const handleSavePersonal = async () => {
    if (!fullName.trim()) { toast({ title: 'Error', description: 'Full name is required', variant: 'destructive' }); return; }
    try {
      setSavingPersonal(true);
      const res = await fetch('/api/crm/profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-id': admin?.id || '' },
        body: JSON.stringify({ type: 'personal', fullName, mobile, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Update local state
      if (admin) setAdmin({ ...admin, fullName, mobile, email });
      toast({ title: 'Saved!', description: 'Personal info updated successfully' });
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to save', variant: 'destructive' });
    } finally { setSavingPersonal(false); }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) { toast({ title: 'Error', description: 'All fields required', variant: 'destructive' }); return; }
    if (newPassword !== confirmPassword) { toast({ title: 'Error', description: 'New passwords do not match', variant: 'destructive' }); return; }
    if (newPassword.length < 4) { toast({ title: 'Error', description: 'Password must be at least 4 characters', variant: 'destructive' }); return; }
    try {
      setSavingPassword(true);
      const res = await fetch('/api/crm/profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-id': admin?.id || '' },
        body: JSON.stringify({ type: 'password', oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
      toast({ title: 'Password Changed!', description: 'Your password has been updated' });
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to change password', variant: 'destructive' });
    } finally { setSavingPassword(false); }
  };

  const handleSaveShop = async () => {
    try {
      setSavingShop(true);
      const res = await fetch('/api/crm/profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-id': admin?.id || '' },
        body: JSON.stringify({ type: 'shop', shopName, gstNo, address: shopAddress, phone: shopPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: 'Saved!', description: 'Shop details updated successfully' });
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to save', variant: 'destructive' });
    } finally { setSavingShop(false); }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast({ title: 'Invalid', description: 'Only JPG/PNG allowed', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Too Large', description: 'Max 2MB allowed', variant: 'destructive' });
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) { toast({ title: 'Error', description: 'Select a photo first', variant: 'destructive' }); return; }
    try {
      setUploadingPhoto(true);
      const res = await fetch('/api/crm/profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-id': admin?.id || '' },
        body: JSON.stringify({ type: 'photo', imageData: photoPreview }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCurrentPhotoUrl(data.photoUrl);
      setPhotoPreview(null);
      setPhotoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast({ title: 'Uploaded!', description: 'Profile photo updated' });
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Upload failed', variant: 'destructive' });
    } finally { setUploadingPhoto(false); }
  };

  /* ─── Tabs Config ─── */
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'personal', label: 'Personal Info', icon: <User size={18} /> },
    { key: 'password', label: 'Change Password', icon: <Lock size={18} /> },
    { key: 'shop', label: 'Shop Details', icon: <Store size={18} /> },
    { key: 'photo', label: 'Profile Photo', icon: <Camera size={18} /> },
  ];

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-10 bg-[#DCDCDC] rounded w-64 animate-pulse" />
        <div className="bg-white rounded-xl border border-[#D1D1D1] p-8 animate-pulse h-[400px]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-[#D1D1D1] p-6 flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF5F00] to-[#CC4D00] flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
            {currentPhotoUrl ? (
              <img src={currentPhotoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              admin?.fullName?.charAt(0) || 'A'
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border-2 border-[#D1D1D1] flex items-center justify-center">
            <Shield size={12} className="text-[#FF5F00]" />
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-[#00092C]">{admin?.fullName || 'Admin'}</h2>
          <p className="text-sm text-[#555555]">@{admin?.username}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="badge bg-[#FFF5F0] text-[#FF5F00]">{admin?.role}</span>
            <span className="text-xs text-[#888888]">Joined {admin?.id ? 'recently' : ''}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-[#D1D1D1] overflow-hidden">
        <div className="flex border-b border-[#EEEEEE]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all relative ${
                activeTab === tab.key
                  ? 'text-[#FF5F00]'
                  : 'text-[#555555] hover:text-[#00092C] hover:bg-[#FAFAFA]'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {activeTab === tab.key && (
                <motion.div layoutId="profileTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF5F00]" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* ═══ Personal Info ═══ */}
            {activeTab === 'personal' && (
              <motion.div key="personal" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-[#00092C] mb-1">Personal Information</h3>
                  <p className="text-sm text-[#888888]">Update your name, mobile number and email address.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#00092C] mb-1.5">Full Name <span className="text-[#B20600]">*</span></label>
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter full name" className="w-full px-4 py-2.5 rounded-lg border border-[#D1D1D1] bg-[#FAFAFA] text-[#00092C] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F00] focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#00092C] mb-1.5">Mobile</label>
                    <input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Enter mobile number" className="w-full px-4 py-2.5 rounded-lg border border-[#D1D1D1] bg-[#FAFAFA] text-[#00092C] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F00] focus:border-transparent" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[#00092C] mb-1.5">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email address" className="w-full px-4 py-2.5 rounded-lg border border-[#D1D1D1] bg-[#FAFAFA] text-[#00092C] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F00] focus:border-transparent" />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button onClick={handleSavePersonal} disabled={savingPersonal} className="flex items-center gap-2 px-5 py-2.5 bg-[#FF5F00] text-white rounded-lg text-sm font-medium hover:bg-[#CC4D00] transition-colors disabled:opacity-60">
                    <Save size={16} />
                    {savingPersonal ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ═══ Change Password ═══ */}
            {activeTab === 'password' && (
              <motion.div key="password" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-[#00092C] mb-1">Change Password</h3>
                  <p className="text-sm text-[#888888]">Enter your current password and choose a new one.</p>
                </div>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-[#00092C] mb-1.5">Current Password <span className="text-[#B20600]">*</span></label>
                    <div className="relative">
                      <input type={showOld ? 'text' : 'password'} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Enter current password" className="w-full px-4 py-2.5 rounded-lg border border-[#D1D1D1] bg-[#FAFAFA] text-[#00092C] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F00] focus:border-transparent pr-10" />
                      <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#00092C]">{showOld ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#00092C] mb-1.5">New Password <span className="text-[#B20600]">*</span></label>
                    <div className="relative">
                      <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className="w-full px-4 py-2.5 rounded-lg border border-[#D1D1D1] bg-[#FAFAFA] text-[#00092C] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F00] focus:border-transparent pr-10" />
                      <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#00092C]">{showNew ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#00092C] mb-1.5">Confirm Password <span className="text-[#B20600]">*</span></label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className={`w-full px-4 py-2.5 rounded-lg border bg-[#FAFAFA] text-[#00092C] text-sm focus:outline-none focus:ring-2 focus:border-transparent ${confirmPassword && confirmPassword !== newPassword ? 'border-[#B20600] focus:ring-[#B20600]' : 'border-[#D1D1D1] focus:ring-[#FF5F00]'}`} />
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-xs text-[#B20600] mt-1 flex items-center gap-1"><AlertCircle size={12} />Passwords do not match</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button onClick={handleChangePassword} disabled={savingPassword} className="flex items-center gap-2 px-5 py-2.5 bg-[#FF5F00] text-white rounded-lg text-sm font-medium hover:bg-[#CC4D00] transition-colors disabled:opacity-60">
                    <Lock size={16} />
                    {savingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ═══ Shop Details ═══ */}
            {activeTab === 'shop' && (
              <motion.div key="shop" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-[#00092C] mb-1">Shop Details</h3>
                  <p className="text-sm text-[#888888]">Manage your shop name, GST number, address and contact.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#00092C] mb-1.5">Shop Name</label>
                    <input value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="Enter shop name" className="w-full px-4 py-2.5 rounded-lg border border-[#D1D1D1] bg-[#FAFAFA] text-[#00092C] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F00] focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#00092C] mb-1.5">GST Number</label>
                    <input value={gstNo} onChange={(e) => setGstNo(e.target.value)} placeholder="Enter GST number" className="w-full px-4 py-2.5 rounded-lg border border-[#D1D1D1] bg-[#FAFAFA] text-[#00092C] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F00] focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#00092C] mb-1.5">Phone Number</label>
                    <input value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} placeholder="Enter shop phone" className="w-full px-4 py-2.5 rounded-lg border border-[#D1D1D1] bg-[#FAFAFA] text-[#00092C] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F00] focus:border-transparent" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[#00092C] mb-1.5">Address</label>
                    <textarea value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} placeholder="Enter shop address" rows={2} className="w-full px-4 py-2.5 rounded-lg border border-[#D1D1D1] bg-[#FAFAFA] text-[#00092C] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F00] focus:border-transparent resize-none" />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button onClick={handleSaveShop} disabled={savingShop} className="flex items-center gap-2 px-5 py-2.5 bg-[#FF5F00] text-white rounded-lg text-sm font-medium hover:bg-[#CC4D00] transition-colors disabled:opacity-60">
                    <Save size={16} />
                    {savingShop ? 'Saving...' : 'Save Shop Details'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ═══ Profile Photo ═══ */}
            {activeTab === 'photo' && (
              <motion.div key="photo" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-[#00092C] mb-1">Profile Photo</h3>
                  <p className="text-sm text-[#888888]">Upload JPG/PNG image, max 2MB. It will be saved as your profile picture.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Current Photo */}
                  <div className="text-center">
                    <p className="text-xs text-[#888888] mb-2 font-medium">Current</p>
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#FF5F00] to-[#CC4D00] flex items-center justify-center text-white text-3xl font-bold overflow-hidden border-4 border-white shadow-lg">
                      {currentPhotoUrl ? (
                        <img src={currentPhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        admin?.fullName?.charAt(0) || 'A'
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="hidden sm:block">
                    <div className="w-12 h-12 rounded-full bg-[#FAFAFA] border border-[#D1D1D1] flex items-center justify-center">
                      <span className="text-[#888888]">→</span>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="text-center">
                    <p className="text-xs text-[#888888] mb-2 font-medium">Preview</p>
                    <div className="w-28 h-28 rounded-full bg-[#EEEEEE] flex items-center justify-center text-[#888888] overflow-hidden border-4 border-dashed border-[#D1D1D1]">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <Camera size={24} className="mx-auto mb-1 opacity-40" />
                          <p className="text-xs">No file</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Upload Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png" onChange={handlePhotoSelect} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#D1D1D1] bg-white text-sm text-[#00092C] hover:bg-[#FAFAFA] transition-colors">
                    <Camera size={16} />
                    Choose Photo
                  </button>
                  {photoPreview && (
                    <>
                      <button onClick={handleUploadPhoto} disabled={uploadingPhoto} className="flex items-center gap-2 px-5 py-2.5 bg-[#FF5F00] text-white rounded-lg text-sm font-medium hover:bg-[#CC4D00] transition-colors disabled:opacity-60">
                        <Check size={16} />
                        {uploadingPhoto ? 'Uploading...' : 'Upload & Save'}
                      </button>
                      <button onClick={() => { setPhotoPreview(null); setPhotoFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#D1D1D1] bg-white text-sm text-[#B20600] hover:bg-[#FFF5F3] transition-colors">
                        <Trash2 size={16} />
                        Remove
                      </button>
                    </>
                  )}
                </div>

                {photoFile && (
                  <div className="text-xs text-[#555555] bg-[#F0FFF5] border border-[#0FA968]/20 rounded-lg px-4 py-2 flex items-center gap-2">
                    <Check size={14} className="text-[#0FA968]" />
                    {photoFile.name} — {(photoFile.size / 1024).toFixed(1)}KB
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
