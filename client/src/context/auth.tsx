import { AuthResponse, AuthState, CookiesValues, User } from '@/types';
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
  const [user, setUser] = useState<Partial<User> | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cookies, setCookie, removeCookie] = useCookies<
    'doc-talk-qid',
    CookiesValues
  >(['doc-talk-qid']);

  useEffect(() => {
    const checkSignedInUser = async () => {
      setLoading(true);

      const cookieData = cookies['doc-talk-qid'];

      if (!cookieData) {
        setUser(null);
        setToken(null);
        removeCookie('doc-talk-qid');
        setLoading(false);
        return;
      }

      const meQuery: AuthResponse = await invoke('me', {
        token: cookieData.token
      });

      if (!meQuery.user) {
        setUser(null);
        setToken(null);
        removeCookie('doc-talk-qid');
        setLoading(false);
        return;
      }

      setUser(meQuery.user);
      setToken(cookieData.token);
      setLoading(false);
    };

    checkSignedInUser();
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

  const logout = useCallback(async (token: string) => {
    setLoading(true);

    try {
      const res: AuthResponse = await invoke('logout', { token });

      if (!res.success) {
        setLoading(false);
        return {
          message: 'Logout failed',
          success: false
        };
      }

      removeCookie('doc-talk-qid');
      setUser(null);
      setToken(null);
      setLoading(false);
      return {
        success: true,
        message: 'Logged out'
      };
    } catch (error) {
      setLoading(false);
      return {
        success: false,
        message: (error as Error).message,
        code: 500
      };
    }
  }, []);

  return (
    <AuthContext.Provider value={{ loading, user, token, login, logout }}>
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
