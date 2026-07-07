import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, MessageSquare, FileText } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./Sidebar.module.css";

/**
 * Primary navigation: paths must match `App.jsx` routes.
 * Add rows here when you ship new sections (e.g. Admin, Bookmarks).
 */
const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Home", path: "/dashboard" },
  { icon: MessageSquare, label: "Your Topics", path: "/my-questions" },
  { icon: FileText, label: "Knowledge Base", path: "/rag-documents" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebar__header}>
        <div
          className={styles.sidebar__branding}
          onClick={() => navigate("/")}
          title="Go to Home"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              navigate("/");
            }
          }}
        >
          <div className={styles.sidebar__logo} aria-hidden>
            <MessageSquare className={styles["sidebar__logo-icon"]} size={20} />
          </div>
          <div className={styles.sidebar__brandCopy}>
            <p className={styles.sidebar__title}>Evangadi Forum</p>
            <p className={styles.sidebar__tagline}>
              Learn together. Ask with context.
            </p>
          </div>
        </div>
      </div>

      <nav className={styles.sidebar__nav} aria-label="Main navigation">
        <p className={styles.sidebar__navLabel}>Navigate</p>
        {NAV_ITEMS.map((item) => (
          <div key={item.path} className={styles["sidebar__nav-item-wrapper"]}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `${styles.sidebar__link} ${
                  isActive
                    ? styles["sidebar__link--active"]
                    : styles["sidebar__link--inactive"]
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={18}
                    className={`${styles.sidebar__icon} ${
                      isActive
                        ? styles["sidebar__icon--active"]
                        : styles["sidebar__icon--inactive"]
                    }`}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          </div>
        ))}
      </nav>

      <div className={styles.sidebar__footer}>
        <button
          type="button"
          onClick={() => navigate("/questions/ask")}
          className={styles.sidebar__button}
        >
          New Question
        </button>

        <div className={styles.sidebar__user}>
          <div className={styles.sidebar__profile}>
            <div className={styles.sidebar__avatar}>
              <img
                src={
                  user?.avatar ||
                  `https://ui-avatars.com/api/?name=${
                    user?.firstName || "User"
                  }+${user?.lastName || ""}&background=random`
                }
                alt={`${user?.firstName} ${user?.lastName}`}
                className={styles["sidebar__avatar-image"]}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className={styles.sidebar__info}>
              <p className={styles.sidebar__name}>
                {user?.firstName} {user?.lastName}
              </p>
              <p className={styles.sidebar__role}>Learner</p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className={styles.sidebar__logout}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
