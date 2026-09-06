import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { CalendarDays, Mail, Phone, Globe, Camera, Save, X, User, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface UserData {
  name: string;
  email: string;
  phone: string;
  nationality: string;
  photoURL?: string;
  profileImage?: string;
  createdAt?: any;
  role?: string;
}

export const TouristProfile: React.FC = () => {
  const { currentUser, updatePassword, reauthenticate } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    nationality: '',
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Cloudinary configuration from environment variables
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  useEffect(() => {
    if (!currentUser) return;

    const fetchUserData = async () => {
      try {
        const docRef = doc(db, 'users', currentUser.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as UserData;
          setUserData(data);
          setProfileForm({
            name: data.name || '',
            phone: data.phone || '',
            nationality: data.nationality || '',
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setMessage({ type: 'error', text: 'Failed to load profile data' });
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, {
        name: profileForm.name,
        phone: profileForm.phone,
        nationality: profileForm.nationality,
        updatedAt: new Date(),
      });

      setUserData(prev => prev ? { 
        ...prev, 
        name: profileForm.name,
        phone: profileForm.phone,
        nationality: profileForm.nationality
      } : null);
      
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser || !e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file (JPEG, PNG, etc.)' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size should be less than 5MB' });
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'profile-images');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const data = await response.json();
      const publicId = data.public_id;
      const transformedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_500,h_500,c_fill/${publicId}`;

      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, {
        photoURL: transformedUrl,
        profileImage: transformedUrl,
        updatedAt: new Date(),
      });

      setUserData(prev => prev ? { 
        ...prev, 
        photoURL: transformedUrl,
        profileImage: transformedUrl
      } : null);

      setMessage({ type: 'success', text: 'Profile image updated successfully!' });
      e.target.value = '';

    } catch (error: any) {
      console.error('Error uploading image to Cloudinary:', error);
      let errorMessage = 'Failed to upload profile image';
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password should be at least 6 characters' });
      return;
    }

    setIsLoading(true);

    try {
      await reauthenticate(passwordForm.oldPassword);
      await updatePassword(passwordForm.newPassword);
      
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: 'Password updated successfully!' });
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password') {
        setMessage({ type: 'error', text: 'Current password is incorrect' });
      } else if (error.code === 'auth/requires-recent-login') {
        setMessage({ type: 'error', text: 'Please log in again to change your password' });
      } else {
        setMessage({ type: 'error', text: error.message || 'Failed to update password' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    if (userData) {
      setProfileForm({
        name: userData.name || '',
        phone: userData.phone || '',
        nationality: userData.nationality || '',
      });
    }
  };

  const getJoinedDate = () => {
    if (!userData?.createdAt) return 'N/A';
    try {
      if (userData.createdAt.toDate) {
        return userData.createdAt.toDate().toDateString();
      } else if (userData.createdAt instanceof Date) {
        return userData.createdAt.toDateString();
      } else if (typeof userData.createdAt === 'string') {
        return new Date(userData.createdAt).toDateString();
      }
      return 'N/A';
    } catch (error) {
      return 'N/A';
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 text-xs font-semibold tracking-wider uppercase mb-4 shadow-xs">
            <User className="w-3.5 h-3.5" />
            <span>Tourist Profile</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            My <span className="text-orange-500">Account Settings</span>
          </h1>
          <p className="mt-3 text-slate-600 text-sm md:text-base">
            Manage your personal profile, contact information, and security preferences.
          </p>
        </div>

        {/* Global Feedback Message */}
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl flex items-start space-x-3 border text-sm font-medium ${
              message.type === 'error' 
                ? 'bg-rose-50 text-rose-800 border-rose-200' 
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {message.type === 'error' ? (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div>{message.text}</div>
          </motion.div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8 sm:p-10 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Profile Avatar Column */}
            <div className="flex flex-col items-center text-center space-y-4 pt-2">
              <div className="relative group">
                <img
                  src={userData.profileImage || userData.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                  alt="Profile"
                  className="w-36 h-36 rounded-full object-cover border-4 border-orange-100 shadow-sm"
                />
                <label 
                  htmlFor="profile-image" 
                  className={`absolute bottom-1 right-1 p-3 rounded-full cursor-pointer transition-all shadow-md ${
                    isLoading 
                      ? 'bg-slate-400 cursor-not-allowed text-white' 
                      : 'bg-orange-500 hover:bg-orange-600 text-white hover:scale-105'
                  }`}
                  title="Update profile picture"
                >
                  <Camera size={18} />
                  <input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isLoading}
                  />
                </label>
                {isLoading && (
                  <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-xs">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-2"></div>
                      <p className="text-xs font-semibold">Uploading...</p>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{userData.name || 'Tourist Member'}</h3>
                <p className="text-xs text-slate-500 font-medium capitalize mt-0.5">{userData.role || 'Tourist'}</p>
                <p className="text-xs text-slate-400 mt-2">
                  Click camera icon to change photo
                </p>
              </div>
            </div>

            {/* Profile Information Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Personal Details</h2>
                  <p className="text-xs text-slate-500">Your profile details visible during tour bookings</p>
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-xs hover:shadow-md"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleProfileUpdate}
                      disabled={isLoading}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-xs hover:shadow-md flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Save size={14} />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={isLoading}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <X size={14} />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Email (Readonly) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      value={userData.email || ''}
                      disabled
                      className="block w-full pl-11 pr-4 py-3 bg-slate-100/80 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                        className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                        placeholder="Enter full name"
                      />
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-sm font-medium text-slate-800">
                      {userData.name || 'Not provided'}
                    </div>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                        placeholder="+251 9XX XXX XXX"
                      />
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-sm font-medium text-slate-800">
                      {userData.phone || 'Not provided'}
                    </div>
                  )}
                </div>

                {/* Nationality */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Nationality
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Globe className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={profileForm.nationality}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, nationality: e.target.value }))}
                        className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                        placeholder="e.g. Ethiopian, American, German"
                      />
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-sm font-medium text-slate-800">
                      {userData.nationality || 'Not provided'}
                    </div>
                  )}
                </div>

                {/* Joined Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Member Since
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-sm font-medium text-slate-600">
                    <CalendarDays className="h-4 w-4 text-orange-500" />
                    <span>{getJoinedDate()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-8 sm:p-10 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-orange-100/80 text-orange-600 flex items-center justify-center border border-orange-200/60">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Security & Password</h2>
              <p className="text-xs text-slate-500">Update your account password to maintain security</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                required
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                New Password
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                required
                minLength={6}
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                placeholder="Enter new password (min. 6 characters)"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                minLength={6}
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                placeholder="Confirm new password"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-3 px-6 rounded-xl transition-all shadow-xs hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default TouristProfile;