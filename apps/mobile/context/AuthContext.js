import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        try {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};

          const user = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            phoneNumber: firebaseUser.phoneNumber,
            firstName: userData.firstName || firebaseUser.displayName?.split(' ')[0] || '',
            lastName: userData.lastName || firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
            ...userData
          };

          setUser(user);
          setIsGuest(false);
          await AsyncStorage.removeItem('guestMode');
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Still set basic user info even if Firestore fails
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName
          });
        }
      } else {
        // User is signed out, check for guest mode
        setUser(null);
        const guestMode = await AsyncStorage.getItem('guestMode');
        if (guestMode === 'true') {
          setIsGuest(true);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      let errorMessage = 'Login failed';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later';
          break;
        default:
          errorMessage = error.message;
      }
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      const { email, password, firstName, lastName, phone } = userData;

      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update display name
      await updateProfile(firebaseUser, {
        displayName: `${firstName} ${lastName}`
      });

      // Store additional user data in Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        firstName,
        lastName,
        email,
        phone,
        createdAt: new Date().toISOString(),
        role: 'customer'
      });

      return { success: true };
    } catch (error) {
      let errorMessage = 'Registration failed';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        default:
          errorMessage = error.message;
      }
      return { success: false, error: errorMessage };
    }
  };

  const loginWithPhone = async (phoneNumber) => {
    // Phone authentication requires additional setup with Firebase
    // For now, return an error indicating it's not implemented
    return {
      success: false,
      error: 'Phone authentication is not yet available. Please use email/password.'
    };
  };

  const verifyOTP = async (phoneNumber, otp) => {
    // Phone authentication requires additional setup
    return {
      success: false,
      error: 'Phone authentication is not yet available. Please use email/password.'
    };
  };

  const continueAsGuest = async () => {
    try {
      await AsyncStorage.setItem('guestMode', 'true');
      setIsGuest(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to continue as guest'
      };
    }
  };

  const convertGuestToUser = async (email, password) => {
    // Guest can register or login to convert to a full user
    try {
      const result = await login(email, password);
      if (result.success) {
        await AsyncStorage.removeItem('guestMode');
        setIsGuest(false);
      }
      return result;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to convert guest account'
      };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('guestMode');
      setUser(null);
      setIsGuest(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateUser = async (updates) => {
    try {
      if (!user?.uid) {
        return { success: false, error: 'No user logged in' };
      }

      // Update Firestore document
      await setDoc(doc(db, 'users', user.uid), updates, { merge: true });

      // Update local state
      setUser(prev => ({ ...prev, ...updates }));

      // Update display name if firstName or lastName changed
      if (updates.firstName || updates.lastName) {
        const newDisplayName = `${updates.firstName || user.firstName} ${updates.lastName || user.lastName}`;
        await updateProfile(auth.currentUser, { displayName: newDisplayName });
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Update failed'
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest,
        login,
        register,
        loginWithPhone,
        verifyOTP,
        continueAsGuest,
        convertGuestToUser,
        logout,
        updateUser,
        isAuthenticated: !!user || isGuest
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
