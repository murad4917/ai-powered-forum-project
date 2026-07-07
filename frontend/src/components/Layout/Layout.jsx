import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Navbar from "../Navbar/Navbar.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";
import ChatbotWidget from "../chatbot/ChatbotWidget.jsx";
import styles from "./Layout.module.css";

/**
 * Authenticated shell: fixed sidebar + scrollable main column + footer.
 * Add new `pathname` branches below when you introduce more protected routes.
 */
export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();

  /** Navbar title: keep in sync with routes in `App.jsx`. */
  const getTitle = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "Home";
    if (path === "/my-questions") return "Your topics";
    if (path === "/questions/ask") return "Ask a question";
    if (path.startsWith("/question/")) return "Discussion";
    if (path === "/rag-documents") return "Knowledge base";
    if (path === "/settings") return "Settings & Preferences";
    return "Forum";
  };

  /** One-line context under the title (helps students orient on each screen). */
  const getSubtitle = () => {
    const path = location.pathname;
    if (path === "/dashboard")
      return "Browse the feed, search by keyword, or run AI similarity search.";
    if (path === "/my-questions")
      return "Questions you have posted. Open any thread to read replies or edit context.";
    if (path === "/questions/ask")
      return "A clear title and reproducible steps get faster, more accurate answers.";
    if (path.startsWith("/question/"))
      return "Read the thread, review related topics, and reply with markdown if you can help.";
    if (path === "/rag-documents")
      return "Private PDF library: reader, semantic search, and AI answers with citations per document.";
    if (path === "/settings")
      return "Manage your account, preferences, and profile.";
    return "";
  };

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.layout__content}>
        <Navbar
          title={getTitle()}
          subtitle={getSubtitle()}
          user={user}
          onLogout={logout}
        />
        <main className={styles.layout__main}>
          <div className={styles.layout__mainInner}>
            <Outlet />
          </div>
        </main>

        <footer className={styles.layout__footer}>
          <div className={styles["layout__footer-content"]}>
            <div className={styles["layout__footer-branding"]}>
              <h4 className={styles["layout__footer-title"]}>Evangadi Forum</h4>
              <p className={styles["layout__footer-tagline"]}>
                A practice space for technical Q&A, peer feedback, and
                AI-assisted search, built for Evangadi learners and mentors.
              </p>
              <p className={styles["layout__footer-copyright"]}>
                © 2026 Evangadi Forum. For educational use.
              </p>
            </div>
            <nav className={styles["layout__footer-nav"]}>
              <a href="#" className={styles["layout__footer-link"]}>
                About
              </a>
              <a href="#" className={styles["layout__footer-link"]}>
                Privacy
              </a>
              <a href="#" className={styles["layout__footer-link"]}>
                Terms
              </a>
              <a href="#" className={styles["layout__footer-link"]}>
                Contact
              </a>
            </nav>
          </div>
        </footer>
      </div>
      <ChatbotWidget />
    </div>
  );
}
