import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import styles from './ProtectedRoute.module.css';

/**
 * Wraps protected pages and redirects unauthenticated users to the login page,
 * preserving the original URL for post-login redirection.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Session restore: show a neutral full-page loader (no route flash).
  if (loading) {
    return (
      <div className={styles.protectedRoute__screen} role='status'>
        <div className={styles.protectedRoute__spinner} aria-hidden />
        <span>Checking your session…</span>
      </div>
    );
  }

  // Redirect to /auth if not authenticated, preserving the original URL
  if (!isAuthenticated) {
    return <Navigate to='/auth' state={{ from: location }} replace />;
  }

  // Render children if authenticated
  return children;
}
