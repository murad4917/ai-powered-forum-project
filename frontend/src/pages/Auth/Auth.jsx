/**
 * Auth: combined login + register form; switches mode without changing routes.
 */
import { useState } from 'react';

import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Code,
  ArrowRight,
  Eye,
  EyeOff,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Auth.module.css';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  // Registration form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Error and loading state
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Handle form submission for both login and registration
  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    const normalizedEmail = email.trim().toLowerCase();
    // regex for email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!normalizedEmail) {
      setError('Email is required.');
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password.trim()) {
      setError('Password is required.');
      return;
    }

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!isLogin) {
      if (!trimmedFirstName) {
        setError('First name is required.');
        return;
      }
      if (trimmedFirstName.length < 3) {
        setError('First name must be at least 3 characters long.');
        return;
      }
      if (!trimmedLastName) {
        setError('Last name is required.');
        return;
      }
      if (trimmedLastName.length < 3) {
        setError('Last name must be at least 3 characters long.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Login flow
        await login({ email: normalizedEmail, password });
        setSuccessMessage('Sign-in successful. Redirecting...');
        // Clear form fields
        setEmail('');
        setPassword('');
        setShowPassword(false);
        // Delay redirect to show successful message
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check location state for original URL after login
        // Redirect to original URL if present, otherwise dashboard
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
        navigate(from, { replace: true });
      } else {
        // Registration flow
        await register({
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          email: normalizedEmail,
          password,
        });
        setSuccessMessage('Registration successful! Please log in.');
        // Clear form fields
        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
        // Automatically switch to login form after 1.5 seconds
        setTimeout(() => {
          setIsLogin(true);
          setSuccessMessage(null);
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.auth}>
      {/* Left: Info Section */}
      <section className={styles.auth__info}>
        
        <div className={styles.auth__infoContent}>
          <header className={styles.auth__infoHeader}>
            <div
              className={styles.auth__infoBranding}
              onClick={() => navigate('/')}
              title='Go to Home'
              role='button'
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/');
                }
              }}
            >
              <div className={styles.auth__infoLogo} aria-hidden>
                <MessageSquare
                  className={styles.auth__infoLogoIcon}
                  size={22}
                />
              </div>
              <div className={styles.auth__infoBrandCopy}>
                <p className={styles.auth__infoTitle}>Evangadi Forum</p>
                <p className={styles.auth__infoTagline}>
                  Learn together. Ask with context.
                </p>
              </div>
            </div>
            <p className={styles.auth__infoDescription}>
              Sign in to post technical questions, follow threads, and search
              the forum with both keyword and AI similarity modes, built for
              Evangadi coursework and peer review.
            </p>
          </header>

          <div className={styles.auth__features}>
            <div className={styles.auth__feature}>
              <div className={styles.auth__featureIcon}>
                <Sparkles size={20} />
              </div>
              <div className={styles.auth__featureContent}>
                <h3 className={styles.auth__featureTitle}>Visible reasoning</h3>
                <p className={styles.auth__featureDescription}>
                  Threads stay readable: markdown, code blocks, and replies
                  build a mini knowledge base your cohort can revisit before
                  exams.
                </p>
              </div>
            </div>
            <div className={styles.auth__feature}>
              <div className={styles.auth__featureIcon}>
                <Code size={20} />
              </div>
              <div className={styles.auth__featureContent}>
                <h3 className={styles.auth__featureTitle}>
                  Low-friction workflow
                </h3>
                <p className={styles.auth__featureDescription}>
                  One layout for asking, answering, and scanning search results,
                  so you spend energy on the problem, not on hunting controls.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.auth__infoFooter}>
            <div className={styles.auth__infoFooterContent}>
              <div className={styles.auth__infoAvatars}>
                {[1, 2, 3].map(i => (
                  <img
                    key={i}
                    src={`https://picsum.photos/seed/${i + 50}/100/100`}
                    className={styles.auth__infoAvatar}
                    alt='u'
                    referrerPolicy='no-referrer'
                  />
                ))}
              </div>
              <span className={styles.auth__infoBadge}>
                Evangadi cohorts · weekly stand-ups · office-hour style help
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Right: Auth Forms */}
      <section className={styles.auth__formSection}>
        <div className={styles.auth__formContainer}>
          <AnimatePresence mode='wait'>
            <Motion.div
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.auth__formHeader}>
                <h2 className={styles.auth__formTitle}>
                  {isLogin ? 'Sign in to your account' : 'Create an account'}
                </h2>
                <p className={styles.auth__formSubtitle}>
                  {isLogin
                    ? 'Enter your email address and password to continue.'
                    : 'Complete the form below to create your account.'}
                </p>
              </div>

              <form className={styles.auth__form} onSubmit={handleSubmit}>
                {!isLogin && (
                  <>
                    <div className={styles.auth__inputGroup}>
                      <label htmlFor='firstName' className={styles.auth__label}>
                        First Name
                      </label>
                      <input
                        id='firstName'
                        type='text'
                        placeholder='First name'
                        className={styles.auth__input}
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                      />
                    </div>

                    <div className={styles.auth__inputGroup}>
                      <label htmlFor='lastName' className={styles.auth__label}>
                        Last Name
                      </label>
                      <input
                        id='lastName'
                        type='text'
                        placeholder='Last name'
                        className={styles.auth__input}
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className={styles.auth__inputGroup}>
                  <label htmlFor='email' className={styles.auth__label}>
                    Email Address
                  </label>
                  <input
                    id='email'
                    type='email'
                    placeholder='Enter your email address'
                    className={styles.auth__input}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                <div className={styles.auth__inputGroup}>
                  <div className={styles.auth__labelRow}>
                    <label htmlFor='password' className={styles.auth__label}>
                      Password
                    </label>
                  </div>
                  <div className={styles.auth__passwordWrap}>
                    <input
                      id='password'
                      type={showPassword ? 'text' : 'password'}
                      placeholder='••••••••'
                      className={`${styles.auth__input} ${styles.auth__inputPassword}`}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button
                      type='button'
                      className={styles.auth__passwordToggle}
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                      aria-pressed={showPassword}
                    >
                      {showPassword ? (
                        <EyeOff size={18} aria-hidden />
                      ) : (
                        <Eye size={18} aria-hidden />
                      )}
                    </button>
                  </div>
                </div>

                {successMessage && (
                  <div className={styles.auth__success}>{successMessage}</div>
                )}

                {error && <div className={styles.auth__error}>{error}</div>}

                <div className={styles.auth__buttonContainer}>
                  <button
                    type='submit'
                    className={`${styles.auth__button} ${styles['auth__button--primary']}`}
                    disabled={loading}
                  >
                    {loading
                      ? 'Processing...'
                      : isLogin
                      ? 'Sign In'
                      : 'Create Account'}
                    {!loading && (
                      <ArrowRight
                        size={16}
                        className={styles.auth__buttonIcon}
                      />
                    )}
                  </button>
                </div>

                <div className={styles.auth__divider}>
                  <div className={styles.auth__dividerLine}>
                    <div className={styles.auth__dividerBorder}></div>
                  </div>
                  <div className={styles.auth__dividerText}>
                    Additional options
                  </div>
                </div>
              </form>

              <footer className={styles.auth__formFooter}>
                <p className={styles.auth__formFooterText}>
                  {isLogin
                    ? "Don't have an account?"
                    : 'Already have an account?'}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className={styles.auth__formFooterLink}
                  >
                    {isLogin ? 'Create an account' : 'Back to sign in'}
                  </button>
                </p>
              </footer>
            </Motion.div>
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
