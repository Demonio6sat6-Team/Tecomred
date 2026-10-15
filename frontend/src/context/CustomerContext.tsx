import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface CustomerUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role?: string;
}

interface CustomerContextType {
  user: CustomerUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: CustomerUser, token: string) => void;
  logout: () => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const TOKEN_KEY = 'customer_token';
const USER_KEY = 'customer_user';

function readStoredUser(): CustomerUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CustomerUser;
    if (!parsed || typeof parsed !== 'object' || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = readStoredUser();
    if (!storedToken || !storedUser) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }
    return storedUser;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  // Mantener sincronizado el estado entre pestañas / cambios externos de sesión.
  useEffect(() => {
    const sync = () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = readStoredUser();
      if (!storedToken || !storedUser) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        setToken(null);
        return;
      }
      setUser(storedUser);
      setToken(storedToken);
    };
    window.addEventListener('storage', sync);
    window.addEventListener('customer-auth-change', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('customer-auth-change', sync);
    };
  }, []);

  const login = (nextUser: CustomerUser, nextToken: string) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    setToken(nextToken);
    window.dispatchEvent(new Event('customer-auth-change'));
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setToken(null);
    window.dispatchEvent(new Event('customer-auth-change'));
  };

  return (
    <CustomerContext.Provider value={{ user, token, isAuthenticated: Boolean(user && token), login, logout }}>
      {children}
    </CustomerContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomer must be used within CustomerProvider');
  return ctx;
}
