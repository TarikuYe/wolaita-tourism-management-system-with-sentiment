import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { CalendarDays, Mail, Phone, Globe, Camera, Save, X } from 'lucide-react';
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

const TouristProfile = () => {
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

      // Update local state
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
    
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file (JPEG, PNG, etc.)' });
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size should be less than 5MB' });
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);
    setMessage({ type: '', text: '' });

    try {
      console.log('Starting Cloudinary upload...', file.name);
      console.log('Cloudinary Config:', { cloudName, uploadPreset });

      // Create form data for Cloudinary upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      
      // Only include allowed parameters for unsigned upload
      formData.append('folder', 'profile-images');
      // Remove transformation parameter as it's not allowed in unsigned uploads

      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cloudinary upload failed:', errorText);
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Cloudinary upload successful:', data);

      // Apply transformations to the URL after upload
      // This creates a new URL with transformations without re-uploading
      const originalUrl = data.secure_url;
      const publicId = data.public_id;
      
      // Create transformed URL - resize to 500x500 with face detection and fill crop
      const transformedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_500,h_500,c_fill/${publicId}`;

      // Update user document in Firestore with both original and transformed URLs
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, {
        photoURL: transformedUrl,
        profileImage: transformedUrl,
        updatedAt: new Date(),
      });

      // Update local state
      setUserData(prev => prev ? { 
        ...prev, 
        photoURL: transformedUrl,
        profileImage: transformedUrl
      } : null);

      setMessage({ type: 'success', text: 'Profile image updated successfully!' });
      
      // Reset the file input
      e.target.value = '';

    } catch (error: any) {
      console.error('Error uploading image to Cloudinary:', error);
      
      let errorMessage = 'Failed to upload profile image';
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('status: 400')) {
        errorMessage = 'Invalid image file. Please try another image.';
      } else if (error.message.includes('status: 401')) {
        errorMessage = 'Cloudinary authentication failed. Please check your configuration.';
      } else if (error.message.includes('status: 404')) {
        errorMessage = 'Cloudinary cloud name not found. Please check your configuration.';
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  // Alternative approach: Apply transformations on-the-fly when displaying images
  const getOptimizedImageUrl = (url: string) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    
    // If it's already a Cloudinary URL, you can apply transformations here
    // For now, we'll return the URL as is since we're applying transformations during upload
    return url;
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
      // Reauthenticate user with old password
      await reauthenticate(passwordForm.oldPassword);
      
      // Update password
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

  // Format joined date based on your timestamp structure
  const getJoinedDate = () => {
    if (!userData?.createdAt) return 'N/A';
    
    try {
      // Handle different timestamp formats
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
    return <div className="text-center mt-10">Loading profile...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto p-4 space-y-6"
    >
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>

      {message.text && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'error' 
              ? 'bg-red-100 text-red-700 border border-red-200' 
              : 'bg-green-100 text-green-700 border border-green-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6 space-y-6">
        {/* Profile Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Image */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <img
                src={getOptimizedImageUrl(userData.profileImage || userData.photoURL || '/avatar.png')}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
              />
              <label 
                htmlFor="profile-image" 
                className={`absolute bottom-2 right-2 p-2 rounded-full cursor-pointer transition-colors ${
                  isLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <Camera size={16} />
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
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-xs">Uploading...</p>
                    {uploadProgress > 0 && (
                      <p className="text-xs">{Math.round(uploadProgress)}%</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">
                {isLoading ? 'Uploading...' : 'Click camera icon to update profile image'}
              </p>
            </div>
          </div>

          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Profile Details</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="space-x-2">
                  <button
                    onClick={handleProfileUpdate}
                    disabled={isLoading}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    <Save size={16} className="inline mr-2" />
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={isLoading}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    <X size={16} className="inline mr-2" />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Email (non-editable) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail size={16} className="inline mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={userData.email || ''}
                  disabled
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>

              {/* Name (editable) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="p-3 border border-gray-300 rounded-lg bg-white">
                    {userData.name || 'Not provided'}
                  </div>
                )}
              </div>

              {/* Phone (editable) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone size={16} className="inline mr-2" />
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="p-3 border border-gray-300 rounded-lg bg-white">
                    {userData.phone || 'Not provided'}
                  </div>
                )}
              </div>

              {/* Nationality (editable) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Globe size={16} className="inline mr-2" />
                  Nationality
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileForm.nationality}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, nationality: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="p-3 border border-gray-300 rounded-lg bg-white">
                    {userData.nationality || 'Not provided'}
                  </div>
                )}
              </div>

              {/* Joined Date (non-editable) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CalendarDays size={16} className="inline mr-2" />
                  Joined Date
                </label>
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600">
                  {getJoinedDate()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Password Change Section */}
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your current password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                required
                minLength={6}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                minLength={6}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Updating Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default TouristProfile;