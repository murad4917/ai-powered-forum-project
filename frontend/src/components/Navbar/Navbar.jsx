import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, LogOut, Sparkles, Moon, Sun, Settings } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import styles from "./Navbar.module.css";

/**
 * Top bar: page title, debounced text search → `/dashboard?q=…`, optional AI semantic search.
 * Search state is driven by the URL on the dashboard so bookmarks and refresh keep context.
 */
export default function Navbar({ title, subtitle, user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useTheme();

  // Initialize searchTerm from URL if we are already on the dashboard
  const [searchTerm, setSearchTerm] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get("q") || params.get("semantic") || "";
  });

  // Keep input in sync with URL if it changes externally
  useEffect(() => {
    if (location.pathname === "/dashboard") {
      const params = new URLSearchParams(location.search);
      setSearchTerm(params.get("q") || params.get("semantic") || "");
    } else {
      setSearchTerm("");
    }
  }, [location.search, location.pathname]);

  // Debounced keyword search: updates `?q=` on the dashboard (500ms quiet period).
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim() !== "") {
        navigate(`/dashboard?q=${encodeURIComponent(searchTerm)}`);
      } else if (
        location.pathname === "/dashboard" &&
        !new URLSearchParams(location.search).get("semantic")
      ) {
        navigate("/dashboard");
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, navigate, location.pathname]);

  const handleSemanticSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim().length >= 3) {
      navigate(`/dashboard?semantic=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/dashboard?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.navbar__titleBlock}>
        <h2 className={styles.navbar__pageTitle}>{title}</h2>
        {subtitle ? (
          <p className={styles.navbar__pageSubtitle}>{subtitle}</p>
        ) : null}
      </div>

      <form className={styles.navbar__search} onSubmit={handleSearchSubmit}>
        <div className={styles["navbar__search-icon"]}>
          <Search size={16} />
        </div>
        <input
          id="search"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search questions by keyword…"
          className={styles["navbar__search-input"]}
          aria-label="Search questions by keyword"
        />
        {searchTerm.length >= 3 && (
          <button
            type="button"
            onClick={handleSemanticSearch}
            className={styles["navbar__semantic-button"]}
            title="Use AI Semantic Search"
          >
            <Sparkles size={14} />
            <span className={styles["navbar__semantic-text"]}>AI Search</span>
          </button>
        )}
      </form>

      <div className={styles.navbar__actions}>
        <button
          type="button"
          className={styles.navbar__themeToggle}
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {user && (
          <button
            type="button"
            className={styles.navbar__settings}
            onClick={() => navigate("/settings")}
            aria-label="Settings"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        )}

        <div className={styles.navbar__user}>
          <span className={styles["navbar__user-name"]}>
            {user ? `${user.firstName} ${user.lastName}` : "Guest"}
          </span>
          <div className={styles["navbar__user-avatar"]}>
            <img
              src={
                user?.profilePictureUrl ||
                `https://ui-avatars.com/api/?name=${
                  user?.firstName || "User"
                }+${user?.lastName || ""}&background=random`
              }
              alt="avatar"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        {user && (
          <button
            type="button"
            className={styles.navbar__logout}
            onClick={onLogout}
            aria-label="Logout"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
    </header>
  );
}
