import { useMemo, useState } from 'react';
import LandingPage from './pages/LandingPage';
import AuthModal from './components/AuthModal';
import Dashboard from './pages/Dashboard';

export default function App() {
  const savedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('corek_user') || 'null');
    } catch {
      return null;
    }
  }, []);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState(savedUser);
  const isAuthenticated = Boolean(sessionUser);

  // Smoothly invokes modal initialization pipelines
  const handleOpenAuthModal = () => {
    setIsAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Coordinates authentication data context ingestion dynamically
  const handleLoginSuccess = (user) => {
    const nextUser = user || { userId: 1, fullName: 'CoreK User', role: 'Customer' };
    setSessionUser(nextUser);
    localStorage.setItem('corek_user', JSON.stringify(nextUser));
    setIsAuthModalOpen(false);
  };

  // Safely destroys state token context parameters for session logout
  const handleLogout = () => {
    setSessionUser(null);
    localStorage.removeItem('corek_user');
    localStorage.removeItem('sys_auth_token');
  };

  return (
    <div style={styles.appContainer}>
      {/* Dynamic Header / Navigation Bar */}
      <header style={styles.navbar}>
        <div style={styles.logoGroup}>
          <div style={styles.logoIcon}></div>
          <span style={styles.logoText}>CoreK</span>
        </div>
        <nav style={styles.navLinks}>
          {!isAuthenticated ? (
            <button 
              style={styles.navItemLinkPrimary} 
              onClick={handleOpenAuthModal}
            >
              Login
            </button>
          ) : (
            <div style={styles.sessionGroup}>
              <span style={styles.sessionText}>{sessionUser?.fullName || 'CoreK User'}</span>
              <button 
                style={styles.navItemLinkPrimary} 
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </div>
          )}
        </nav>
      </header>

      {/* Main UI View Pipelines */}
      <div style={styles.viewWrapper}>
        {!isAuthenticated ? (
          <LandingPage onOpenAuthModal={handleOpenAuthModal} />
        ) : (
          <Dashboard user={sessionUser} onLogout={handleLogout} />
        )}
      </div>

      {/* Global Context Auth Portal Container Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={handleCloseAuthModal} 
        onAuthSuccess={handleLoginSuccess} 
      />
    </div>
  );
}

const styles = {
  appContainer: {
    minHeight: '100vh',
    backgroundColor: '#fbfdfc',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex',
    flexDirection: 'column'
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem 2.5rem',
    borderBottom: '1px solid #e2efe9',
    backgroundColor: 'rgba(251, 253, 252, 0.8)',
    backdropFilter: 'blur(12px)',
    position: 'sticky',
    top: 0,
    zIndex: 900
  },
  logoGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  logoIcon: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#00bfa5'
  },
  logoText: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: '#0f291e',
    letterSpacing: '-0.5px'
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem'
  },
  sessionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  sessionText: {
    color: '#2d4a3e',
    fontWeight: '700',
    fontSize: '0.9rem'
  },
  navItemLink: {
    border: 'none',
    background: 'none',
    color: '#5b7e6e',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'color 0.2s ease'
  },
  navItemLinkPrimary: {
    border: 'none',
    backgroundColor: '#0f291e',
    color: '#ffffff',
    padding: '0.5rem 1.25rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(15,41,30,0.08)',
    transition: 'all 0.2s ease'
  },
  viewWrapper: {
    flex: 1,
    position: 'relative',
    width: '100%'
  }
};
