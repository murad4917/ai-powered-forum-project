import { createContext, useContext, useState, useEffect } from "react";

/**
 * Theme Context for managing dark mode state across the application.
 */
const ThemeContext = createContext(undefined);

/**
 * ThemeProvider component that wraps the app to provide theme context.
 */
export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize from localStorage, default to light mode (white theme)
    const stored = localStorage.getItem("darkMode");
    if (stored !== null) {
      return stored === "true";
    }
    // Default to light mode (false = white theme)
    return false;
  });

  // Apply theme to document root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to use the theme context.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
