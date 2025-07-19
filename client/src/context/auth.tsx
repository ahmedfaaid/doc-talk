import { AuthResponse, AuthState, CookiesValues } from '@/types';
import { invoke } from '@tauri-apps/api/core';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react';
import { useCookies } from 'react-cookie';

export const AuthContext = createContext<AuthState | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cookies, setCookie, removeCookie] = useCookies<
    'doc-talk-qid',
    CookiesValues
  >(['doc-talk-qid']);

  useEffect(() => {
    setLoading(true);

    const cookieData = cookies['doc-talk-qid'];

    if (!cookieData) {
      setUser(null);
      setToken(null);
      removeCookie('doc-talk-qid');
      setLoading(false);
      return;
    } else {
      setUser({
        email: cookieData.email as string,
        id: cookieData.userId as string
      });
      setToken(cookieData.token);
      setLoading(false);
      return;
    }
  }, [cookies, setCookie, removeCookie]);

  const login = useCallback(
    async (loginRequest: { email: string; password: string }) => {
      setLoading(true);

      try {
        const { email, password } = loginRequest;
        const res: AuthResponse = await invoke('login', {
          credentials: { email, password }
        });

        if (!res.token && !res.user) {
          setUser(null);
          setToken(null);
          setLoading(false);
          return {
            message: res.message,
            success: false
          };
        }

        setCookie('doc-talk-qid', {
          token: res.token,
          userId: res.user?.id,
          email: res.user?.email
        });
        setUser(res.user!);
        setToken(res.token!);
        setLoading(false);
        return {
          token: res.token,
          user: res.user,
          message: 'Login successful',
          success: true
        };
      } catch (error) {
        console.log({ error });
        setUser(null);
        setToken(null);
        setLoading(false);
        return {
          success: false,
          message: (error as Error).message,
          code: 500
        };
      }
    },
    []
  );

  return (
    <AuthContext.Provider value={{ loading, user, token, login }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth hook must be used within an Auth Provider');
  }

  return context;
};
