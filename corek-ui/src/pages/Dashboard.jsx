import React from 'react';
import { LayoutDashboard, LogOut, Code, Download, Wallet, Layers, ShieldCheck } from 'lucide-react';

export default function Dashboard({ userSessionName, onLogout }) {
  return (
    <main style={styles.container} className="animate-fade-up">
      <div style={styles.welcomeBanner}>
        <div style={styles.welcomeLeft}>
          <div style={styles.statusDot}></div>
          <h2 style={styles.welcomeTitle}>Hi, {userSessionName || 'Kean'}</h2>
        </div>
        <p style={styles.welcomeSubtitle}>Welcome to your dashboard. You are successfully logged in.</p>
      </div>

      <div style={styles.metricsGrid}>
        <div style={styles.metricBox}>
          <div style={styles.boxHeader}>
            <span style={styles.boxTitle}>Total Balance Parameters</span>
            <Wallet size={18} color="#00bfa5" />
          </div>
          <span style={styles.boxValue}>$1,420.50</span>
        </div>
        
        <div style={styles.metricBox}>
          <div style={styles.boxHeader}>
            <span style={styles.boxTitle}>Distributed Downloads</span>
            <Download size={18} color="#00bfa5" />
          </div>
          <span style={styles.boxValue}>384</span>
        </div>

        <div style={styles.metricBox}>
          <div style={styles.boxHeader}>
            <span style={styles.boxTitle}>Active Source Buffers</span>
            <Code size={18} color="#00bfa5" />
          </div>
          <span style={styles.boxValue}>12</span>
        </div>
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.panelCard}>
          <h3 style={styles.panelTitle}>Active Storage Bundles</h3>
          <div style={styles.assetList}>
            {[
              { name: 'k8s-cluster-setup.sh', size: '4.2 MB', state: 'Active' },
              { name: 'nginx-reverse-proxy.conf', size: '12 KB', state: 'Active' },
              { name: 'redis-cluster-manifest.yaml', size: '85 KB', state: 'Staged' }
            ].map((asset, i) => (
              <div key={i} style={styles.assetRow}>
                <div style={styles.assetMeta}>
                  <Layers size={16} color="#7ea191" />
                  <div>
                    <div style={styles.assetName}>{asset.name}</div>
                    <div style={styles.assetSize}>{asset.size}</div>
                  </div>
                </div>
                <span style={{
                  ...styles.statusTag,
                  backgroundColor: asset.state === 'Active' ? 'rgba(0,191,165,0.08)' : '#f0f4f2',
                  color: asset.state === 'Active' ? '#00bfa5' : '#5b7e6e'
                }}>{asset.state}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.panelCard}>
          <h3 style={styles.panelTitle}>System Verification Parameter logs</h3>
          <div style={styles.logContainer}>
            <div style={styles.logRow}>
              <ShieldCheck size={14} color="#00bfa5" />
              <span>Token signature authorized securely via TLS node split.</span>
            </div>
            <div style={styles.logRow}>
              <ShieldCheck size={14} color="#00bfa5" />
              <span>Edge distribution key generated for file manifest_v2.</span>
            </div>
            <div style={styles.logRow}>
              <ShieldCheck size={14} color="#00bfa5" />
              <span>System dashboard environment context parsed completely.</span>
            </div>
          </div>

          <button 
            style={styles.logoutBtn}
            onClick={onLogout}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#611f1f'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7a2d2d'}
          >
            <LogOut size={16} /> Terminate Dashboard Session
          </button>
        </div>
      </div>
    </main>
  );
}

const styles = {
  container: {
    padding: '3rem 2rem 6rem 2rem',
    maxWidth: '1440px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box'
  },
  welcomeBanner: {
    backgroundColor: '#ffffff',
    border: '1px solid #bfe0d3',
    borderRadius: '20px',
    padding: '2rem 2.5rem',
    marginBottom: '2.5rem',
    boxShadow: '0 4px 20px rgba(0,44,28,0.02)'
  },
  welcomeLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '0.5rem'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#00bfa5',
    borderRadius: '50%',
    boxShadow: '0 0 0 4px rgba(0,191,165,0.15)'
  },
  welcomeTitle: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#0f291e',
    margin: 0
  },
  welcomeSubtitle: {
    fontSize: '1.05rem',
    color: '#5b7e6e',
    margin: 0
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '2rem',
    marginBottom: '2.5rem'
  },
  metricBox: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2efe9',
    borderRadius: '16px',
    padding: '1.75rem',
    boxShadow: '0 4px 15px rgba(0,44,28,0.01)'
  },
  boxHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  boxTitle: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#7ea191',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  boxValue: {
    fontSize: '2.2rem',
    fontWeight: '800',
    color: '#0f291e',
    letterSpacing: '-1px'
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 0.8fr',
    gap: '2rem',
    '@media(maxWidth: 968px)': {
      gridTemplateColumns: '1fr'
    }
  },
  panelCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2efe9',
    borderRadius: '20px',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column'
  },
  panelTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#0f291e',
    margin: '0 0 1.5rem 0'
  },
  assetList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  assetRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: '#f4faf7',
    border: '1px solid #e2efe9',
    borderRadius: '12px'
  },
  assetMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  assetName: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#0f291e'
  },
  assetSize: {
    fontSize: '0.75rem',
    color: '#7ea191'
  },
  statusTag: {
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '0.3rem 0.6rem',
    borderRadius: '6px',
    textTransform: 'uppercase'
  },
  logContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
    backgroundColor: '#0f291e',
    padding: '1.25rem',
    borderRadius: '12px',
    color: '#c5ded3',
    fontFamily: 'monospace',
    fontSize: '0.8rem',
    lineHeight: '1.5',
    marginBottom: '2rem',
    flex: 1
  },
  logRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start'
  },
  logoutBtn: {
    border: 'none',
    backgroundColor: '#7a2d2d',
    color: '#ffffff',
    padding: '1rem',
    fontSize: '0.95rem',
    fontWeight: '600',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'background-color 0.2s ease'
  }
};