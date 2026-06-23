import { LayoutGrid, Star, ArrowUpRight } from 'lucide-react';

export default function HomePage({ products, onOpenCheckout }) {
  return (
    <main style={styles.container} className="animate-fade-up">
      {/* Dashboard Section Title */}
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.title}>Creator Marketplace</h2>
          <p style={styles.subtitle}>Explore premium configuration bundles, blueprints, and assets ready for instant distribution pipelines.</p>
        </div>
        <div style={styles.statsBadge}>
          <LayoutGrid size={16} color="#00bfa5" />
          <span>{products.length} Source Buffers Live</span>
        </div>
      </div>

      {/* Grid Collections */}
      <div style={styles.grid}>
        {products.map((prod) => (
          <div
            key={prod.productId}
            style={styles.card}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 16px 36px rgba(0, 44, 28, 0.06)';
              e.currentTarget.style.borderColor = '#00bfa5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 44, 28, 0.02)';
              e.currentTarget.style.borderColor = '#e2efe9';
            }}
          >
            {/* Asset Visual Banner */}
            <div style={styles.cardBanner}>
              <span style={styles.categoryTag}>{prod.category || 'Digital Asset'}</span>
            </div>

            {/* Asset Details */}
            <div style={styles.cardBody}>
              <div style={styles.metaRow}>
                <span style={styles.creatorTag}>System Node Verified</span>
                <span style={styles.rating}><Star size={12} fill="#00bfa5" color="#00bfa5" /> 5.0</span>
              </div>
              
              <h3 style={styles.cardTitle}>{prod.title}</h3>
              <p style={styles.cardDesc}>{prod.description}</p>
              
              <div style={styles.cardFooter}>
                <span style={styles.price}>${Number(prod.price).toFixed(2)}</span>
                <button
                  style={styles.buyBtn}
                  onClick={() => onOpenCheckout(prod)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#00bfa5';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#0f291e';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                >
                  Acquire Asset <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
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
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '1.5rem',
    marginBottom: '3rem',
    borderBottom: '1px solid #d8e8e1',
    paddingBottom: '1.5rem'
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#0f291e',
    margin: '0 0 0.5rem 0',
    letterSpacing: '-0.5px'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#5b7e6e',
    margin: 0
  },
  statsBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ffffff',
    border: '1px solid #d8e8e1',
    padding: '0.6rem 1.2rem',
    borderRadius: '30px',
    fontSize: '0.85rem',
    color: '#2d4a3e',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(0,44,28,0.02)'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '2.5rem'
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2efe9',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 44, 28, 0.02)',
    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
  },
  cardBanner: {
    height: '150px',
    backgroundColor: '#eef6f2',
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'flex-start',
    background: 'linear-gradient(135deg, #eef6f2 0%, #dcf0e7 100%)'
  },
  categoryTag: {
    backgroundColor: '#ffffff',
    border: '1px solid #bfe0d3',
    padding: '0.4rem 0.8rem',
    borderRadius: '30px',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#0f291e',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  cardBody: {
    padding: '1.75rem'
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem'
  },
  creatorTag: {
    fontSize: '0.8rem',
    color: '#7ea191',
    fontWeight: '500'
  },
  rating: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#0f291e'
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: '#0f291e',
    margin: '0 0 0.75rem 0',
    lineHeight: '1.3'
  },
  cardDesc: {
    fontSize: '0.95rem',
    color: '#5b7e6e',
    lineHeight: '1.5',
    margin: '0 0 1.75rem 0',
    minHeight: '44px'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #f4faf7',
    paddingTop: '1.25rem'
  },
  price: {
    fontSize: '1.4rem',
    fontWeight: '800',
    color: '#0f291e'
  },
  buyBtn: {
    border: 'none',
    backgroundColor: '#0f291e',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '0.75rem 1.25rem',
    borderRadius: '12px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
  }
};
