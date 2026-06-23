import { useState } from 'react';
import { Search, LogOut } from 'lucide-react';

export default function Header({ currentPage, setCurrentPage, isLoggedIn, onLogout, onOpenAuthModal, onSearchChange }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearchChange) onSearchChange(searchTerm);
  };

  return (
    <header style={styles.header}>
      {/* Brand Group */}
      <div style={styles.leftSection}>
        <div 
          style={styles.brand} 
          onClick={() => setCurrentPage(isLoggedIn ? 'home' : 'landing')}
        >
          <div style={styles.dot}></div>
          <span style={styles.logo}>CoreK</span>
        </div>

        {/* Global Catalog Search Form */}
        <form style={styles.searchForm} onSubmit={handleSearchSubmit}>
          <div style={styles.searchWrapper}>
            <Search size={16} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search code blueprints, config files..."
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (onSearchChange) onSearchChange(e.target.value);
              }}
            />
          </div>
        </form>
      </div>

      {/* Navigation Actions aligned with image_47ae27.png */}
      <nav style={styles.nav}>
        {isLoggedIn ? (
          <div style={styles.actionRow}>
            <span 
              style={{
                ...styles.navLink,
                color: currentPage === 'home' ? '#00bfa5' : '#0f291e',
                fontWeight: currentPage === 'home' ? '700' : '500'
              }} 
              onClick={() => setCurrentPage('home')}
            >
              Marketplace
            </span>
            <button 
              style={styles.btnSecondary} 
              onClick={onLogout}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#611f1f'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7a2d2d'}
            >
              <LogOut size={14} /> Exit System
            </button>
          </div>
        ) : (
          <div style={styles.actionRow}>
            {/* High-fidelity Register Text-Button */}
            <button 
              style={styles.btnRegister} 
              onClick={onOpenAuthModal}
              onMouseEnter={(e) => e.currentTarget.style.color = '#00bfa5'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#2d4a3e'}
            >
              Register
            </button>
            
            {/* Solid Dark Green Accent Login Button */}
            <button 
              style={styles.btnLogin} 
              onClick={onOpenAuthModal}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#00bfa5';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0b241a';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Login
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}

const styles = {
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '1.25rem 2.5rem', 
    borderBottom: '1px solid #e2efe9', 
    backgroundColor: '#ffffff', 
    position: 'sticky', 
    top: 0, 
    zIndex: 900, 
    boxSizing: 'border-box', 
    width: '100%' 
  },
  leftSection: { display: 'flex', alignItems: 'center', gap: '2.5rem', flex: 1, maxWidth: '800px' },
  brand: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  dot: { width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#00bfa5' },
  logo: { fontSize: '1.25rem', fontWeight: '800', color: '#0b241a', letterSpacing: '-0.5px' },
  searchForm: { flex: 1, display: 'flex', alignItems: 'center' },
  searchWrapper: { position: 'relative', width: '100%', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: '14px', color: '#7ea191', pointerEvents: 'none' },
  searchInput: { width: '100%', backgroundColor: '#f4faf7', border: '1px solid #bfe0d3', borderRadius: '12px', padding: '0.65rem 1rem 0.65rem 2.5rem', fontSize: '0.9rem', color: '#0f291e', outline: 'none', transition: 'all 0.2s ease', boxSizing: 'border-box' },
  nav: { display: 'flex', alignItems: 'center' },
  actionRow: { display: 'flex', alignItems: 'center', gap: '1.75rem' },
  navLink: { fontSize: '0.9rem', cursor: 'pointer', transition: 'color 0.2s ease' },
  
  // Custom button rules styled identically to image_47ae27.png
  btnRegister: {
    background: 'none',
    border: 'none',
    color: '#2d4a3e',
    fontSize: '0.95rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
    padding: '0.5rem'
  },
  btnLogin: {
    border: 'none',
    backgroundColor: '#0b241a', // Rich dark slate green from image
    color: '#ffffff',
    padding: '0.65rem 1.75rem',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(11,36,26,0.1)',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
  },
  btnSecondary: { border: 'none', backgroundColor: '#7a2d2d', color: '#ffffff', padding: '0.6rem 1.1rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background-color 0.2s ease' }
};
