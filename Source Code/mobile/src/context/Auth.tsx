import { AppState } from 'react-native'; import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { clearToken, getToken, saveToken } from '../lib/tokenStorage';

type User = { id: string; name: string; email: string; roles: ('STANDARD'|'PROFESSIONAL'|'HONORARY')[]; isAdmin?: boolean; role?: string };
type Auth = {
  user: User | null;
  membership: any | null;
  effectiveStatus: string | null;
  ready: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  membershipVersion: number;
};

const C = createContext<Auth>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [membership, setMembership] = useState<any | null>(null), [effectiveStatus,setEffectiveStatus]=useState<string|null>(null), [membershipVersion,setMembershipVersion]=useState(0);
  const [ready, setReady] = useState(false);
  const refreshInFlight = useRef<Promise<void> | null>(null);
  const applyIdentity = useCallback((data:any) => { setUser(data.user); setMembership(data.membership); setEffectiveStatus(data.effectiveStatus||data.membership?.status||null); setMembershipVersion(version=>version+1); }, []);

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const response = await api.get('/me');
        if (mounted) applyIdentity(response.data);
      } catch {
        await clearToken();
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

  const refreshUser=useCallback(async()=>{
    if (!refreshInFlight.current) refreshInFlight.current=api.get('/me').then(response=>applyIdentity(response.data)).finally(()=>{refreshInFlight.current=null;});
    return refreshInFlight.current;
  },[applyIdentity]);
  const signIn = async (token: string, user: User) => {
    await saveToken(token);
    try { const response=await api.get('/me'); applyIdentity({...response.data,user:response.data.user||user}); }
    catch (error) { await clearToken(); throw error; }
  };
  const signOut = async () => {
    try {
      await clearToken();
    } finally {
      // Never retain an in-memory authenticated session when storage cleanup fails.
      setUser(null); setMembership(null); setEffectiveStatus(null);
    }
  };
  return <C.Provider value={{ user, membership, effectiveStatus, membershipVersion, ready, signIn, signOut, refreshUser }}>{children}</C.Provider>;
}

export const useAuth = () => useContext(C);
