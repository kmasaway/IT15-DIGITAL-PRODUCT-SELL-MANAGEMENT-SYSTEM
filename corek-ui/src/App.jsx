import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, LayoutDashboard, LifeBuoy, Package, UserCog } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import AuthModal from './components/AuthModal';
import Dashboard from './pages/Dashboard';
import corekMark from './assets/corek-mark.svg';

const CUSTOMER_NAV_ITEMS = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Marketplace', icon: Package },
  { id: 'payments', label: 'Library', icon: Download },
  { id: 'support', label: 'Support', icon: LifeBuoy },
  { id: 'profile', label: 'Profile', icon: UserCog },
];

export default function App() {
  const savedUser = useMemo(() => {
    try {
      const savedToken = localStorage.getItem('sys_auth_token');
      if (!savedToken) {
        localStorage.removeItem('corek_user');
        return null;
      }

      return JSON.parse(localStorage.getItem('corek_user') || 'null');
    } catch {
      return null;
    }
  }, []);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState(savedUser);
  const [activeCustomerModule, setActiveCustomerModule] = useState('overview');
  const isAuthenticated = Boolean(sessionUser);
  const sessionRole = sessionUser?.role || sessionUser?.Role || 'Customer';
  const isCustomerSession = isAuthenticated && sessionRole === 'Customer';

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
    setActiveCustomerModule('overview');
    localStorage.setItem('corek_user', JSON.stringify(nextUser));
    setIsAuthModalOpen(false);
  };

  // Safely destroys state token context parameters for session logout
  const handleLogout = useCallback(() => {
    setSessionUser(null);
    setActiveCustomerModule('overview');
    localStorage.removeItem('corek_user');
    localStorage.removeItem('sys_auth_token');
  }, []);

  useEffect(() => {
    window.addEventListener('corek:unauthorized', handleLogout);

    return () => {
      window.removeEventListener('corek:unauthorized', handleLogout);
    };
  }, [handleLogout]);

  return (
    <div style={{ ...styles.appContainer, ...(isAuthenticated ? styles.authenticatedAppContainer : {}) }}>
      {/* Dynamic Header / Navigation Bar */}
      <header style={styles.navbar}>
        <div style={styles.logoGroup}>
          <img src={corekMark} alt="CoreK logo" style={styles.logoMark} />
          <span style={styles.logoText}>ᴄᴏʀᴇᴋ</span>
        </div>
        {isCustomerSession ? (
          <nav className="customer-header-nav" style={styles.customerHeaderNav} aria-label="Customer navigation">
            {CUSTOMER_NAV_ITEMS.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  className={`customer-header-nav-button ${activeCustomerModule === item.id ? 'active' : ''}`}
                  type="button"
                  style={{
                    ...styles.customerHeaderNavItem,
                    ...(activeCustomerModule === item.id ? styles.customerHeaderNavItemActive : {})
                  }}
                  onClick={() => setActiveCustomerModule(item.id)}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        ) : (
          <div style={styles.headerCenterSpacer} />
        )}
        <nav style={styles.navLinks}>
          {!isAuthenticated ? (
            <button 
              style={styles.navItemLinkPrimary} 
              onClick={handleOpenAuthModal}
            >
              Login
            </button>
          ) : isCustomerSession ? (
            <div style={styles.sessionGroup}>
              <button 
                style={styles.navItemLinkPrimary} 
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div style={styles.sessionGroup} aria-hidden="true" />
          )}
        </nav>
      </header>

      {/* Main UI View Pipelines */}
      <div style={{ ...styles.viewWrapper, ...(isAuthenticated ? styles.authenticatedViewWrapper : {}) }}>
        {!isAuthenticated ? (
          <LandingPage onOpenAuthModal={handleOpenAuthModal} />
        ) : (
          <Dashboard
            user={sessionUser}
            onLogout={handleLogout}
            activeModule={isCustomerSession ? activeCustomerModule : undefined}
            onActiveModuleChange={isCustomerSession ? setActiveCustomerModule : undefined}
          />
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
    backgroundColor: '#f6f6f6',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex',
    flexDirection: 'column'
  },
  authenticatedAppContainer: {
    height: '100vh',
    overflow: 'hidden'
  },
  navbar: {
    display: 'grid',
    gridTemplateColumns: 'minmax(120px, 1fr) auto minmax(120px, 1fr)',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem var(--app-page-x-padding)',
    borderBottom: '1px solid #e2efe9',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(12px)',
    position: 'sticky',
    top: 0,
    zIndex: 900
  },
  logoGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    justifySelf: 'start',
    minHeight: '42px'
  },
  logoMark: {
    width: '46px',
    height: '46px',
    objectFit: 'contain',
    display: 'block',
    flexShrink: 0
  },
  logoText: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: '34px',
    border: 'none',
    borderRadius: 0,
    padding: 0,
    background: 'transparent',
    color: '#0f291e',
    fontFamily: '"Trebuchet MS", "Segoe UI", system-ui, sans-serif',
    fontSize: '2.05rem',
    fontWeight: '950',
    letterSpacing: '0',
    boxShadow: 'none'
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    justifySelf: 'end',
    gap: '1.5rem'
  },
  headerCenterSpacer: {
    minHeight: '42px'
  },
  customerHeaderNav: {
    minWidth: 0,
    maxWidth: 'min(680px, 52vw)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.35rem',
    padding: '0.35rem',
    border: '1px solid #e2efe9',
    borderRadius: '14px',
    backgroundColor: 'rgba(255,255,255,0.82)',
    boxShadow: '0 8px 22px rgba(15,41,30,0.05)',
    overflowX: 'auto',
    scrollbarWidth: 'none'
  },
  customerHeaderNavItem: {
    minHeight: '34px',
    border: '1px solid transparent',
    backgroundColor: 'transparent',
    color: '#2d4a3e',
    borderRadius: '10px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    padding: '0.45rem 0.7rem',
    fontSize: '0.84rem',
    fontWeight: '750',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    outline: 'none',
    boxShadow: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    transition: 'background-color 160ms ease, color 160ms ease'
  },
  customerHeaderNavItemActive: {
    borderColor: '#00bfa5',
    backgroundColor: '#00bfa5',
    color: '#ffffff'
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
  },
  authenticatedViewWrapper: {
    minHeight: 0,
    overflow: 'hidden'
  }
};
