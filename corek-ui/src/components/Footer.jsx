export default function Footer() {
  return (
    <footer style={styles.footerContainer}>
      <div style={styles.mainContentRow}>
        {/* Brand/Mission Block */}
        <div style={styles.brandColumn}>
          <div style={styles.brandHeader}>
            <span style={styles.logoText}>ᴄᴏʀᴇᴋ Systems</span>
          </div>
          <p style={styles.brandDesc}>
            Automating standard digital checkout environments and edge package distribution delivery models safely.
          </p>
        </div>

        {/* Links Navigation Matrix Columns */}
        <div style={styles.linksGrid}>
          <div style={styles.column}>
            <h5 style={styles.columnTitle}>Resource Repositories</h5>
            <span style={styles.linkItem}>Config Bundles</span>
            <span style={styles.linkItem}>Bash Scripts</span>
            <span style={styles.linkItem}>UI Manifests</span>
          </div>
          <div style={styles.column}>
            <h5 style={styles.columnTitle}>Platform Operations</h5>
            <span style={styles.linkItem}>Edge Network</span>
            <span style={styles.linkItem}>Deduction Splits</span>
            <span style={styles.linkItem}>Developer Core API</span>
          </div>
          <div style={styles.column}>
            <h5 style={styles.columnTitle}>Safety Controls</h5>
            <span style={styles.linkItem}>TLS Signatures</span>
            <span style={styles.linkItem}>Clearance Audits</span>
            <span style={styles.linkItem}>Encrypted Channels</span>
          </div>
        </div>
      </div>

      {/* Baseline Bottom Strip */}
      <div style={styles.bottomBar}>
        <p style={styles.copyright}>
          © 2026 CoreK.dev Repository Systems. Complete Multi-Brand Verification Active.
        </p>
        <div style={styles.legalLinks}>
          <span style={styles.bottomLink}>Terms of Use Parameter</span>
          <span style={styles.bottomLink}>Privacy Distribution</span>
        </div>
      </div>
    </footer>
  );
}

const styles = {
  footerContainer: {
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e2efe9',
    padding: '4rem 2.5rem 2rem 2.5rem',
    marginTop: 'auto',
    width: '100%',
    boxSizing: 'border-box'
  },
  mainContentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '3rem',
    marginBottom: '3.5rem',
    maxWidth: '1440px',
    margin: '0 auto 3.5rem auto'
  },
  brandColumn: {
    flex: '1 1 300px',
    maxWidth: '400px'
  },
  brandHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  logoText: {
    border: 'none',
    borderRadius: 0,
    background: 'transparent',
    boxShadow: 'none',
    fontFamily: '"Trebuchet MS", "Segoe UI", system-ui, sans-serif',
    fontSize: '1.65rem',
    fontWeight: '950',
    color: '#0f291e',
    padding: 0
  },
  brandDesc: {
    fontSize: '0.9rem',
    color: '#5b7e6e',
    lineHeight: '1.6',
    margin: 0
  },
  linksGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '3rem',
    flex: '2 1 400px',
    justifyContent: 'space-around'
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  columnTitle: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#0f291e',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: '0 0 0.5rem 0'
  },
  linkItem: {
    fontSize: '0.85rem',
    color: '#7ea191',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
    ':hover': { color: '#00bfa5' }
  },
  bottomBar: {
    borderTop: '1px solid #f4faf7',
    paddingTop: '1.75rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
    maxWidth: '1440px',
    margin: '0 auto'
  },
  copyright: {
    fontSize: '0.8rem',
    color: '#7ea191',
    margin: 0,
    fontWeight: '500'
  },
  legalLinks: {
    display: 'flex',
    gap: '1.5rem'
  },
  bottomLink: {
    fontSize: '0.8rem',
    color: '#5b7e6e',
    cursor: 'pointer',
    textDecoration: 'none'
  }
};
