import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  setCurrentUser: (user: User | null) => void;
  updatePassword: (newPassword: string) => Promise<void>;
  reauthenticate: (password: string) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Password management functions
  const updatePassword = async (newPassword: string) => {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in');
    }
    await firebaseUpdatePassword(auth.currentUser, newPassword);
  };

  const reauthenticate = async (password: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('No user is currently signed in');
    }
    const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
    await reauthenticateWithCredential(auth.currentUser, credential);
  };

  const sendPasswordResetEmail = async (email: string) => {
    await firebaseSendPasswordResetEmail(auth, email);
  };

  // Helper function to create user data
  const createUserData = (user: FirebaseUser, userData?: any): User => {
    return {
      id: user.uid,
      email: user.email || '',
      name: userData?.name || user.displayName || '',
      role: (userData?.role as 'tourist' | 'agency' | 'cashier' | 'admin') || 'tourist',
      phone: userData?.phone || user.phoneNumber || '',
      nationality: userData?.nationality || '',
      verified: userData?.verified || false,
      createdAt: userData?.createdAt?.toDate() || new Date(),
      companyName: userData?.companyName || undefined,
      description: userData?.description || undefined,
      website: userData?.website || undefined,
      address: userData?.address || undefined,
      profileImage: userData?.profileImage || user.photoURL || undefined,
    };
  };

  // Authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user);
      setFirebaseUser(user);
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userWithRole = createUserData(user, userData);
            setCurrentUser(userWithRole);
            console.log('User loaded from Firestore:', userWithRole);
          } else {
            // This should not happen for email/password registration as we create the document in register function
            const newUser = createUserData(user);
            await setDoc(doc(db, 'users', user.uid), newUser);
            setCurrentUser(newUser);
            console.log('New user created in Firestore:', newUser);
          }
        } catch (error) {
          console.error('Error handling user data:', error);
          toast.error('Error loading user data');
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
        console.log('User logged out');
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Email/Password Login
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Successfully logged in!');
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Failed to log in. Please check your credentials.';

      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }

      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Email/Password Registration - Redirects to login after success
  const register = async (email: string, password: string, userData: Partial<User>) => {
    try {
      setLoading(true);

      // Validation
      if (!userData.name || userData.name.trim().length < 2) {
        throw new Error('Name must be at least 2 characters long');
      }

      if (!userData.phone || userData.phone.trim().length < 10) {
        throw new Error('Please provide a valid phone number');
      }

      if (!userData.nationality || userData.nationality.trim().length === 0) {
        throw new Error('Please select your nationality');
      }

      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // Force role to be 'tourist' for public registration
      const newUser: User = {
        id: user.uid,
        email: email.toLowerCase().trim(),
        name: userData.name!.trim(),
        role: 'tourist',
        phone: userData.phone!.trim(),
        nationality: userData.nationality!.trim(),
        verified: false,
        createdAt: new Date(),
        ...userData,
      };

      await setDoc(doc(db, 'users', user.uid), newUser);
      
      // IMPORTANT: Sign out the user after registration to force login
      await signOut(auth);
      
      console.log('User registered successfully:', newUser);
      toast.success('Account created successfully! Please log in to continue.');
      
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = 'Failed to create account. Please try again.';

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please use at least 6 characters.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        default:
          if (error.message && !error.code) {
            errorMessage = error.message;
          } else {
            errorMessage = error.message || errorMessage;
          }
      }

      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Successfully logged out!');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Failed to log out.');
      throw error;
    }
  };

  const value: AuthContextType = {
    currentUser,
    firebaseUser,
    loading,
    login,
    register,
    logout,
    setCurrentUser,
    updatePassword,
    reauthenticate,
    sendPasswordResetEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};