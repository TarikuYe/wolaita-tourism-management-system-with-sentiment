import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  sendEmailVerification as firebaseSendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string, portal?: 'public' | 'admin') => Promise<void>;
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
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  // Ref to track if we're currently handling a deactivation to prevent duplicate toasts
  const isHandlingDeactivation = useRef(false);
  // Ref to track if registration is in progress so onAuthStateChanged doesn't race against immediate signOut
  const isRegistering = useRef(false);
  // Ref to track which portal is initiating login ('public' | 'admin') to prevent premature state updates & redirects
  const activeLoginPortal = useRef<'public' | 'admin' | null>(null);

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
    const sanitizedEmail = email.trim().toLowerCase();
    const resetRedirectUrl = `${window.location.origin}/login`;

    try {
      await firebaseSendPasswordResetEmail(auth, sanitizedEmail, {
        url: resetRedirectUrl,
        handleCodeInApp: false,
      });
    } catch (error) {
      console.error('sendPasswordResetEmail error:', error);
      throw error;
    }
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
    let userVerifiedListener: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user);
      setFirebaseUser(user);
      
      // Clean up previous listener if it exists
      if (userVerifiedListener) {
        userVerifiedListener();
        userVerifiedListener = null;
      }

      // If registration is currently in flight, skip loading Firestore doc as user will be immediately signed out
      if (isRegistering.current) {
        return;
      }
      
      if (user) {
        try {
          setLoading(true);
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Check if account is deactivated
            // Only show toast if we're not already handling a deactivation (prevents duplicate toasts)
            if (userData.verified === false) {
              // Account is deactivated - sign out the user
              console.log('User account is deactivated, signing out...');
              
              // Prevent duplicate toast if we're already handling this
              if (!isHandlingDeactivation.current) {
                isHandlingDeactivation.current = true;
                await signOut(auth);
                setCurrentUser(null);
                setLoading(false);
                setIsLoggingIn(false);
                // Reset flag after a delay to ensure onAuthStateChanged doesn't show duplicate
                setTimeout(() => {
                  isHandlingDeactivation.current = false;
                }, 2000);
              } else {
                // Just sign out silently if we're already handling it
                await signOut(auth);
                setCurrentUser(null);
                setLoading(false);
                setIsLoggingIn(false);
              }
              return;
            }
            
            // Reset deactivation flag if account is active
            isHandlingDeactivation.current = false;
            
            // If logging in through public portal but user is admin, block state update
            if (activeLoginPortal.current === 'public' && userData.role === 'admin') {
              console.log('Blocked admin user from setting public auth state');
              await signOut(auth);
              setCurrentUser(null);
              setLoading(false);
              setIsLoggingIn(false);
              return;
            }

            // If logging in through admin portal but user is NOT admin, block state update
            if (activeLoginPortal.current === 'admin' && userData.role !== 'admin') {
              console.log('Blocked non-admin user from setting admin auth state');
              await signOut(auth);
              setCurrentUser(null);
              setLoading(false);
              setIsLoggingIn(false);
              return;
            }

            const userWithRole = createUserData(user, userData);
            setCurrentUser(userWithRole);
            console.log('User loaded from Firestore:', userWithRole);
            
            // Set up real-time listener for verified status changes
            // This handles the case where an admin deactivates the account while user is logged in
            let previousVerifiedStatus = userData.verified;
            let isFirstSnapshot = true;
            
            userVerifiedListener = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
              // Skip the first snapshot as it's just the current state, not a change
              if (isFirstSnapshot) {
                isFirstSnapshot = false;
                return;
              }
              
              if (snapshot.exists()) {
                const updatedUserData = snapshot.data();
                const currentVerifiedStatus = updatedUserData.verified === true;
                
                // If account becomes deactivated while user is logged in
                if (updatedUserData.verified === false && previousVerifiedStatus !== false) {
                  console.log('User account was deactivated, signing out...');
                  previousVerifiedStatus = false;
                  
                  // Set flag to prevent duplicate toasts
                  if (!isHandlingDeactivation.current) {
                    isHandlingDeactivation.current = true;
                    signOut(auth).then(() => {
                      setCurrentUser(null);
                      setTimeout(() => {
                        isHandlingDeactivation.current = false;
                      }, 2000);
                    }).catch((error) => {
                      console.error('Error signing out deactivated user:', error);
                      isHandlingDeactivation.current = false;
                    });
                  }
                } else if (currentVerifiedStatus && previousVerifiedStatus === false) {
                  // Account was reactivated - reload user data
                  previousVerifiedStatus = true;
                  isHandlingDeactivation.current = false;
                  const reactivatedUser = createUserData(user, updatedUserData);
                  setCurrentUser(reactivatedUser);
                  toast.success('Your account has been reactivated!');
                } else {
                  // Update previous status
                  previousVerifiedStatus = currentVerifiedStatus;
                }
              }
            }, (error) => {
              if (error?.code === 'permission-denied' || error?.message?.includes('insufficient permissions')) {
                // Ignore gracefully when signing out or unauthenticated
                return;
              }
              console.error('Error listening to user verified status:', error);
            });
          } else {
            // This should not happen for email/password registration as we create the document in register function
            const newUser = createUserData(user);
            await setDoc(doc(db, 'users', user.uid), newUser);
            setCurrentUser(newUser);
            console.log('New user created in Firestore:', newUser);
          }
        } catch (error: any) {
          if (error?.code === 'permission-denied' || error?.message?.includes('insufficient permissions')) {
            console.log('User data fetch ignored (unauthenticated or transitioning state)');
            setCurrentUser(null);
            return;
          }
          console.error('Error handling user data:', error);
          // Only show error toast if not handling deactivation
          if (!isHandlingDeactivation.current) {
            toast.error('Error loading user data, using basic profile');
          }
          // Fallback to minimal user so navigation can proceed even if Firestore fails
          setCurrentUser(createUserData(user));
        } finally {
          setLoading(false);
          setIsLoggingIn(false);
        }
      } else {
        setCurrentUser(null);
        setLoading(false);
        setIsLoggingIn(false);
        // Reset deactivation flag when user logs out
        isHandlingDeactivation.current = false;
        console.log('User logged out');
      }
    });

    return () => {
      unsubscribe();
      if (userVerifiedListener) {
        userVerifiedListener();
      }
    };
  }, []);

  // Email/Password Login
  const login = async (email: string, password: string, portal: 'public' | 'admin' = 'public') => {
    try {
      setIsLoggingIn(true);
      activeLoginPortal.current = portal;
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if user account is activated and check portal access role
      try {
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // 1. Check if account is deactivated
          if (userData.verified === false) {
            isHandlingDeactivation.current = true;
            await signOut(auth);
            setCurrentUser(null);
            setIsLoggingIn(false);
            activeLoginPortal.current = null;
            const errorMessage = 'Your account has been deactivated. Please contact the administrator to reactivate your account.';
            toast.error(errorMessage);
            setTimeout(() => {
              isHandlingDeactivation.current = false;
            }, 2000);
            throw new Error(errorMessage);
          }

          // 2. Reject Admin accounts on the public login portal
          if (portal === 'public' && userData.role === 'admin') {
            isHandlingDeactivation.current = true;
            await signOut(auth);
            setCurrentUser(null);
            setIsLoggingIn(false);
            activeLoginPortal.current = null;
            const errorMessage = 'Invalid credentials.';
            toast.error(errorMessage, { duration: 4000 });
            setTimeout(() => {
              isHandlingDeactivation.current = false;
            }, 2000);
            throw new Error(errorMessage);
          }

          // 3. Reject non-admin accounts on the admin console
          if (portal === 'admin' && userData.role !== 'admin') {
            isHandlingDeactivation.current = true;
            await signOut(auth);
            setCurrentUser(null);
            setIsLoggingIn(false);
            activeLoginPortal.current = null;
            const errorMessage = 'Access Denied: Administrator privileges are required to access this console.';
            toast.error(errorMessage, { duration: 4000 });
            setTimeout(() => {
              isHandlingDeactivation.current = false;
            }, 2000);
            throw new Error(errorMessage);
          }
        } else {
          if (portal === 'admin') {
            await signOut(auth);
            setCurrentUser(null);
            setIsLoggingIn(false);
            activeLoginPortal.current = null;
            const errorMessage = 'Access Denied: Administrative profile not found.';
            toast.error(errorMessage);
            throw new Error(errorMessage);
          }
          console.warn('User document not found in Firestore for:', userCredential.user.uid);
        }
      } catch (checkError: any) {
        console.error('Error checking user activation/role status:', checkError);
        
        if (checkError.message && (
          checkError.message.includes('deactivated') ||
          checkError.message.includes('Invalid credentials') ||
          checkError.message.includes('Access Denied')
        )) {
          throw checkError;
        }
        
        // If check fails, sign out to be safe
        // Only show error if not already handling deactivation
        if (!isHandlingDeactivation.current) {
          await signOut(auth);
          setCurrentUser(null);
          setIsLoggingIn(false);
          activeLoginPortal.current = null;
          const errorMessage = 'Error verifying account status. Please try again or contact support.';
          toast.error(errorMessage);
          throw new Error(errorMessage);
        } else {
          setIsLoggingIn(false);
          activeLoginPortal.current = null;
          throw checkError;
        }
      }
      
      activeLoginPortal.current = null;
      toast.success('Successfully logged in!');
    } catch (error: any) {
      console.error('Login error:', error);
      setIsLoggingIn(false);
      activeLoginPortal.current = null;
      
      if (error.message && (
        error.message.includes('deactivated') || 
        error.message.includes('Invalid credentials') || 
        error.message.includes('Access Denied') ||
        error.message.includes('Error verifying account status')
      )) {
        throw error;
      }
      
      // Don't show error if it's a Firebase Auth error that we'll handle below
      if (error.code && error.code.startsWith('auth/')) {
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
      }
      
      throw error;
    }
    // Don't reset isLoggingIn here - let the onAuthStateChanged handle it
  };

  // Password validation helper
  const validatePasswordStrength = (password: string): { isValid: boolean; error: string } => {
    if (password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters long' };
    }
    
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one uppercase letter (A-Z)' };
    }
    
    if (!/[a-z]/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one lowercase letter (a-z)' };
    }
    
    if (!/[0-9]/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one number (0-9)' };
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one special character (!@#$%^&*...)' };
    }
    
    return { isValid: true, error: '' };
  };

  // Email/Password Registration - Redirects to login after success
  const register = async (email: string, password: string, userData: Partial<User>) => {
    try {
      isRegistering.current = true;
      setLoading(true);

      // Password strength validation
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.error);
      }

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

      // Send Firebase Email Verification
      try {
        await firebaseSendEmailVerification(user, {
          url: `${window.location.origin}/login?message=verified`,
          handleCodeInApp: false,
        });
        console.log('Verification email sent to:', email);
      } catch (verificationError) {
        console.warn('Failed to send verification email automatically:', verificationError);
      }

      // Force role to be 'tourist' for public registration
      const newUser: User = {
        id: user.uid,
        email: email.toLowerCase().trim(),
        name: userData.name!.trim(),
        role: 'tourist',
        phone: userData.phone!.trim(),
        nationality: userData.nationality!.trim(),
        verified: true,
        createdAt: new Date(),
        ...userData,
      };

      await setDoc(doc(db, 'users', user.uid), newUser);
      
      // IMPORTANT: Sign out the user after registration to force login
      await signOut(auth);
      
      console.log('User registered successfully:', newUser);
      
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
          errorMessage = 'Password does not meet security requirements. Please ensure your password has at least 8 characters, including uppercase, lowercase, number, and special character.';
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
      isRegistering.current = false;
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      toast.success('Successfully logged out!');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Failed to log out.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    currentUser,
    firebaseUser,
    loading: loading || isLoggingIn, // Combine both loading states
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