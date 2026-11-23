import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native'; import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

type User = { id: string; name: string; email: string; roles: ('STANDARD'|'PROFESSIONAL'|'HONORARY')[]; isAdmin?: boolean; role?: string };
type Auth = {
  user: User | null;
  membership: any | null;
  effectiveStatus: string | null;
  ready: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const C = createContext<Auth>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [membership, setMembership] = useState<any | null>(null), [effectiveStatus,setEffectiveStatus]=useState<string|null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const response = await api.get('/me');
        if (mounted) { setUser(response.data.user); setMembership(response.data.membership); setEffectiveStatus(response.data.effectiveStatus||response.data.membership?.status||null); }
      } catch {
        await AsyncStorage.removeItem('token');
      } finally {
        if (mounted) setReady(true);
      }
    };

    void restoreSession();
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(()=>{const sub=AppState.addEventListener('change',state=>{if(state==='active'&&user) void refreshUser().catch(()=>undefined)});return()=>sub.remove()},[user]);

  const signIn = async (token: string, user: User) => {
    await AsyncStorage.setItem('token', token);
    try { const response=await api.get('/me'); setUser(response.data.user||user); setMembership(response.data.membership); setEffectiveStatus(response.data.effectiveStatus||response.data.membership?.status||null); }
    catch (error) { await AsyncStorage.removeItem('token'); throw error; }
  };
  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('token');
    } finally {
      // Never retain an in-memory authenticated session when storage cleanup fails.
      setUser(null); setMembership(null); setEffectiveStatus(null);
    }
  };
  const refreshUser=async()=>{const response=await api.get('/me');setUser(response.data.user);setMembership(response.data.membership);setEffectiveStatus(response.data.effectiveStatus||response.data.membership?.status||null)};

  return <C.Provider value={{ user, membership, effectiveStatus, ready, signIn, signOut, refreshUser }}>{children}</C.Provider>;
}

export const useAuth = () => useContext(C);
