import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import AuthModal from './components/AuthModal';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userSessionName, setUserSessionName] = useState('');

  // Smoothly invokes modal initialization pipelines
  const handleOpenAuthModal = () => {
    setIsAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Coordinates authentication data context ingestion dynamically
  const handleLoginSuccess = (name) => {
    setUserSessionName(name);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
  };

  // Safely destroys state token context parameters for session logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserSessionName('');
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
            <>
              <button 
                style={styles.navItemLink} 
                onClick={handleOpenAuthModal}
              >
                Register
              </button>
              <button 
                style={styles.navItemLinkPrimary} 
                onClick={handleOpenAuthModal}
              >
                Login
              </button>
            </>
          ) : (
            <button 
              style={styles.navItemLinkPrimary} 
              onClick={handleLogout}
            >
              Sign Out
            </button>
          )}
        </nav>
      </header>

      {/* Main UI View Pipelines */}
      <div style={styles.viewWrapper}>
        {!isAuthenticated ? (
          <LandingPage onOpenAuthModal={handleOpenAuthModal} />
        ) : (
          <Dashboard userSessionName={userSessionName} onLogout={handleLogout} />
        )}
      </div>

      {/* Global Context Auth Portal Container Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={handleCloseAuthModal} 
        onLoginSuccess={handleLoginSuccess} 
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