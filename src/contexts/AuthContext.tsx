import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { auth as firebaseAuth, getUserDoc, loginUser, registerUser as firebaseRegister } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

type UserData = Record<string, any> | null;

interface AuthContextType {
  user: UserData;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  register: (params: { email: string; password: string; fullName?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If firebase isn't configured, skip subscribing.
    if (!firebaseAuth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (u) => {
      setLoading(true);
      try {
        if (u) {
          const doc = await getUserDoc(u.uid);
          setUser(doc ? { uid: u.uid, ...doc } : null);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to load user doc', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { user: u, userData } = await loginUser(email, password);
      setUser(userData ? { uid: (u as any).uid, ...userData } : null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (!firebaseAuth) return;
    try {
      await firebaseAuth.signOut();
      setUser(null);
    } catch (err) {
      console.error('Sign out failed', err);
    }
  };

  const register = async (params: { email: string; password: string; fullName?: string }) => {
    setLoading(true);
    try {
      await firebaseRegister(params);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
