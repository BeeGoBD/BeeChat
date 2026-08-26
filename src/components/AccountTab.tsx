import React, { useState, useRef } from 'react';
import {
  User as UserIcon,
  Phone,
  Camera,
  Globe,
  LogOut,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  KeyRound,
  Shield,
  UploadCloud,
  Trash2,
  Edit2,
  Check,
} from 'lucide-react';
import { User } from '../types';
import { translations, Language } from '../utils/i18n';
import { safeFetchJson } from '../utils/api';
import { AdminModeSwitch } from './AdminModeSwitch';

interface AccountTabProps {
  currentUser: User;
  onUpdateUser: (updated: User) => void;
  onLogout: () => void;
  lang: Language;
  onSetLang: (lang: Language) => void;
  onOpenAdmin?: () => void;
  isAdminView?: boolean;
}

// Client-side image compressor & square cropper
async function compressAndSquareImage(file: File, maxDim = 480, quality = 0.88): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const minSide = Math.min(img.width, img.height);
        const startX = (img.width - minSide) / 2;
        const startY = (img.height - minSide) / 2;

        const targetDim = Math.min(maxDim, minSide);
        canvas.width = targetDim;
        canvas.height = targetDim;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(reader.result as string);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw cropped center square into canvas
        ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, targetDim, targetDim);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const AccountTab: React.FC<AccountTabProps> = ({
  currentUser,
  onUpdateUser,
  onLogout,
  lang,
  onSetLang,
  onOpenAdmin,
  isAdminView = false,
}) => {
  const t = translations[lang];

  // Photo & Profile States
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoAlert, setPhotoAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Edit Name States
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(currentUser.name);
  const [isSavingName, setIsSavingName] = useState(false);

  // Password States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Logout Modal
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload or Change Photo Handler
  const handleProcessAndUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setPhotoAlert({
        type: 'error',
        text: 'Please choose a valid image file (JPG, PNG, or WEBP).',
      });
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoAlert(null);

    try {
      // Compress and format to optimal square avatar
      const compressedBase64 = await compressAndSquareImage(file, 480, 0.88);

      const res = await safeFetchJson<{ user: User }>('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          avatarUrl: compressedBase64,
        }),
      });

      if (res.ok && res.data?.user) {
        onUpdateUser(res.data.user);
        setPhotoAlert({
          type: 'success',
          text: t.photoUpdatedSuccess,
        });
        setTimeout(() => setPhotoAlert(null), 4000);
      } else {
        setPhotoAlert({
          type: 'error',
          text: res.error || 'Failed to update profile photo.',
        });
      }
    } catch (err: any) {
      setPhotoAlert({
        type: 'error',
        text: err.message || 'Error processing image.',
      });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessAndUpload(file);
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessAndUpload(file);
    }
  };

  // Remove Photo / Reset to Initials
  const handleRemovePhoto = async () => {
    setIsUploadingPhoto(true);
    setPhotoAlert(null);

    try {
      const res = await safeFetchJson<{ user: User }>('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          avatarUrl: '', // empty resets to default initials avatar
        }),
      });

      if (res.ok && res.data?.user) {
        onUpdateUser(res.data.user);
        setPhotoAlert({
          type: 'success',
          text: t.photoRemovedSuccess,
        });
        setTimeout(() => setPhotoAlert(null), 4000);
      } else {
        setPhotoAlert({
          type: 'error',
          text: res.error || 'Failed to remove profile photo.',
        });
      }
    } catch (err: any) {
      setPhotoAlert({
        type: 'error',
        text: err.message || 'Error removing photo.',
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Save updated Name
  const handleSaveName = async () => {
    if (!editNameValue.trim()) return;
    setIsSavingName(true);

    try {
      const res = await safeFetchJson<{ user: User }>('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          name: editNameValue.trim(),
        }),
      });

      if (res.ok && res.data?.user) {
        onUpdateUser(res.data.user);
        setIsEditingName(false);
      }
    } catch (err) {
      console.error('Error saving name:', err);
    } finally {
      setIsSavingName(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ type: 'error', text: t.passwordsMismatch });
      return;
    }

    setIsUpdatingPassword(true);
    const res = await safeFetchJson('/api/auth/change-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        oldPassword,
        newPassword,
      }),
    });
    setIsUpdatingPassword(false);

    if (!res.ok) {
      setPasswordMsg({ type: 'error', text: res.error || t.wrongOldPassword });
    } else {
      setPasswordMsg({ type: 'success', text: t.passwordChanged });
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
  };

  const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    currentUser.name
  )}&backgroundColor=25D366`;

  return (
    <div className="space-y-5 pb-24 max-w-2xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
          {t.accountTitle}
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Manage your personal profile picture, identity, and security credentials
        </p>
      </div>

      {/* Admin Mode Switch for Administrators */}
      {currentUser.role === 'admin' && onOpenAdmin && (
        <AdminModeSwitch
          isAdminMode={isAdminView}
          onToggle={onOpenAdmin}
          lang={lang}
          variant="banner"
        />
      )}

      {/* Profile Photo & Identity Card */}
      <div
        id="account-profile-card"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-white rounded-3xl p-6 border transition-all relative overflow-hidden text-center shadow-xs ${
          isDragging
            ? 'border-blue-500 ring-4 ring-blue-100 bg-blue-50/20'
            : 'border-slate-200/80'
        }`}
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#25D366] via-[#00B2FE] to-[#006AFF]" />

        {/* Hidden File Input for Image Upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
          className="hidden"
        />

        {/* Avatar Presentation with Interactive Ring */}
        <div className="relative inline-block mx-auto mb-4 mt-2">
          <div className="relative group">
            <img
              src={currentUser.avatarUrl || defaultAvatar}
              alt={currentUser.name}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover ring-4 ring-emerald-100 shadow-lg mx-auto bg-slate-100 transition-transform group-hover:scale-102"
            />

            {/* Overlay button on hover / touch */}
            <button
              id="avatar-overlay-upload-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="absolute inset-0 rounded-3xl bg-slate-950/40 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
              title={t.uploadPhotoBtn}
            >
              <Camera className="w-6 h-6 mb-1 text-white" />
              <span className="text-[10px] font-bold tracking-wide">
                {isUploadingPhoto ? 'Uploading...' : 'Change'}
              </span>
            </button>

            {/* Floating Camera Button Badge */}
            <button
              id="change-photo-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 hover:opacity-95 text-white shadow-md transition-all cursor-pointer ring-3 ring-white hover:scale-105 active:scale-95"
              title={t.uploadPhotoBtn}
            >
              {isUploadingPhoto ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Name with Inline Edit */}
        <div className="space-y-1">
          {isEditingName ? (
            <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
              <input
                id="edit-profile-name-input"
                type="text"
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-blue-400 bg-blue-50/50 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-300 text-center w-full"
                autoFocus
              />
              <button
                id="save-profile-name-btn"
                type="button"
                onClick={handleSaveName}
                disabled={isSavingName}
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer shrink-0"
                title="Save Name"
              >
                {isSavingName ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingName(false);
                  setEditNameValue(currentUser.name);
                }}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer shrink-0 text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <h3 className="font-black text-slate-900 text-lg sm:text-xl">{currentUser.name}</h3>
              <button
                id="edit-name-trigger-btn"
                type="button"
                onClick={() => setIsEditingName(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                title="Edit Name"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 pt-0.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500/15 to-blue-500/15 text-blue-800 border border-blue-200">
              {currentUser.role === 'admin' ? 'Company Administrator' : 'Verified Member'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ID: {currentUser.id.slice(0, 8)}
            </span>
          </div>
        </div>

        {/* Action Buttons for Profile Picture */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-2.5">
          <button
            id="account-upload-photo-btn"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingPhoto}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-blue-600 hover:opacity-95 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            {isUploadingPhoto ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>{t.uploadPhotoBtn}</span>
              </>
            )}
          </button>

          {currentUser.avatarUrl && (
            <button
              id="account-remove-photo-btn"
              type="button"
              onClick={handleRemovePhoto}
              disabled={isUploadingPhoto}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title={t.removePhotoBtn}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.removePhotoBtn}</span>
            </button>
          )}
        </div>

        <p className="text-[11px] text-slate-400 mt-2.5">
          {t.photoUploadHint}
        </p>

        {/* Upload Alert Toast */}
        {photoAlert && (
          <div
            id="photo-upload-alert"
            className={`mt-4 p-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 animate-fadeIn ${
              photoAlert.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {photoAlert.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{photoAlert.text}</span>
          </div>
        )}
      </div>

      {/* Read-Only Verified Information */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{t.personalInfo}</span>
        </h4>

        <div className="grid sm:grid-cols-2 gap-3">
          {/* Registered Name */}
          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              {t.registeredName}
            </span>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800">
              <UserIcon className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{currentUser.name}</span>
            </div>
          </div>

          {/* Registered BD Phone */}
          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              {t.registeredPhone}
            </span>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-mono font-bold text-slate-800">
              <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{currentUser.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-blue-600" />
          <span>{t.changePasswordTitle}</span>
        </h4>

        {passwordMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              passwordMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {passwordMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{passwordMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.oldPasswordLabel}
            </label>
            <input
              id="account-old-password-input"
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.newPasswordLabel}
              </label>
              <input
                id="account-new-password-input"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.confirmPasswordLabel}
              </label>
              <input
                id="account-confirm-password-input"
                type="password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            id="account-update-password-btn"
            type="submit"
            disabled={isUpdatingPassword}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            {isUpdatingPassword ? 'Updating...' : t.updatePasswordBtn}
          </button>
        </form>
      </div>

      {/* Language Switcher Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-600" />
          <span>{t.languageSetting}</span>
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <button
            id="lang-en-btn"
            type="button"
            onClick={() => onSetLang('en')}
            className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
              lang === 'en'
                ? 'bg-blue-50 border-blue-500 text-blue-950 ring-2 ring-blue-300'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>English (US)</span>
            {lang === 'en' && <CheckCircle className="w-4 h-4 text-blue-600" />}
          </button>

          <button
            id="lang-bn-btn"
            type="button"
            onClick={() => onSetLang('bn')}
            className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
              lang === 'bn'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-300'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>বাংলা (Bengali)</span>
            {lang === 'bn' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
          </button>
        </div>
      </div>

      {/* Logout Action */}
      <div className="pt-2">
        <button
          id="account-logout-btn"
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full py-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{t.logout}</span>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 text-center animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-slate-900 text-base">{t.logout}</h3>
            <p className="text-xs text-slate-600">{t.logoutConfirm}</p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-logout-btn"
                onClick={onLogout}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
