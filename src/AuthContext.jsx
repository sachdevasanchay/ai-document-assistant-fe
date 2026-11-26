import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch, clearToken, getToken, setToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  // On first load, check if a saved token is still valid
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }

    apiFetch("/api/auth/me")
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Auto logout when the API says the token is invalid
  useEffect(() => {
    window.addEventListener("documind:unauthorized", logout);
    return () => window.removeEventListener("documind:unauthorized", logout);
  }, [logout]);

  const handleAuthSuccess = (data) => {
    setToken(data.token);
    setUser(data.user);
  };

  const login = async (email, password) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    handleAuthSuccess(data);
  };

  const register = async (name, email, password) => {
    const data = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });
    handleAuthSuccess(data);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);