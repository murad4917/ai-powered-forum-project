import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/auth/auth.service.js";

/**
 * Authentication Context providing user state and auth methods.
 */
const AuthContext = createContext(undefined);

/**
 * AuthProvider component that wraps the app to provide authentication context.
 */
export function AuthProvider({ children }) {
  // Authentication state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize user state from localStorage on mount
  useEffect(() => {
    const token = authService.getStoredToken();
    const storedUser = authService.getStoredUser();

    if (token && storedUser) {
      setUser(storedUser);
    }

    setLoading(false);
  }, []);

  /**
   * Registers a new user. Does not automatically log them in.
   * @param {Object} userData - { firstName, lastName, email, password }
   */
  const register = async (userData) => {
    setLoading(true);
    try {
      const { user } = await authService.register(userData);
      return { success: true, user };
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Authenticates a user and updates the session state.
   * @param {Object} credentials - { email, password }
   */
  const login = async (credentials) => {
    setLoading(true);
    try {
      const { user } = await authService.login(credentials);
      setUser(user);
      return { success: true };
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clears the user session and redirects to the login page.
   */
  const logout = () => {
    authService.logout();
    setUser(null);
    navigate("/auth");
  };

  // Context value with state and methods
  const value = {
    user,
    setUser,
    loading,
    register,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to access the authentication context.
 * @throws {Error} If used outside of AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
