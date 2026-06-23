import { X, ShieldCheck, CreditCard, CheckCircle2, ArrowRight } from 'lucide-react';

export default function CheckoutModal({
  selectedProduct,
  setIsCheckoutOpen,
  checkoutSuccess,
  handlePaymentSubmit,
  email,
  setEmail,
  fullName,
  setFullName
}) {
  return (
    <div style={styles.overlay} className="animate-overlay">
      <div style={styles.modalCard} className="animate-modal">
        
        {/* Modal Window Header */}
        <div style={styles.header}>
          <div style={styles.titleGroup}>
            <ShieldCheck size={20} color="#00bfa5" />
            <h3 style={styles.title}>Secure Procurement Node</h3>
          </div>
          <button style={styles.closeBtn} onClick={() => setIsCheckoutOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {!checkoutSuccess ? (
          <form onSubmit={handlePaymentSubmit} style={styles.form}>
            {/* Product Summary Context Block */}
            <div style={styles.summaryBox}>
              <div>
                <span style={styles.summaryCategory}>{selectedProduct.category}</span>
                <h4 style={styles.summaryTitle}>{selectedProduct.title}</h4>
              </div>
              <span style={styles.summaryPrice}>${Number(selectedProduct.price).toFixed(2)}</span>
            </div>

            {/* Form Inputs mapping to global App hooks */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Customer Name</label>
              <input
                type="text"
                required
                placeholder="Keanu Masaway"
                style={styles.input}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Distribution Email Deliverable Target</label>
              <input
                type="email"
                required
                placeholder="kean@example.com"
                style={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Dummy Mock Payment Credentials Card */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Encrypted Payment Account Context</label>
              <div style={styles.cardInputWrapper}>
                <CreditCard size={16} color="#7ea191" style={{ position: 'absolute', left: '14px' }} />
                <input
                  type="text"
                  disabled
                  placeholder="4242 •••• •••• 4242  (Demo Sandbox Active)"
                  style={{ ...styles.input, paddingLeft: '2.5rem', backgroundColor: '#eef6f2', borderColor: '#bfe0d3' }}
                />
              </div>
            </div>

            <button type="submit" style={styles.submitBtn}>
              Authorize Complete Settlement <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          /* Transaction Pipeline Validation Success Window */
          <div style={styles.successWrapper} className="animate-fade-up">
            <CheckCircle2 size={56} color="#00bfa5" style={{ marginBottom: '1.5rem' }} />
            <h4 style={styles.successTitle}>Transaction Authorized</h4>
            <p style={styles.successDesc}>
              Receipt and edge installation signatures deployed successfully straight to <strong>{email}</strong>.
            </p>
            <button style={styles.doneBtn} onClick={() => setIsCheckoutOpen(false)}>
              Return to Repository Console
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(15, 41, 30, 0.4)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
    boxSizing: 'border-box'
  },
  modalCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #bfe0d3',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 30px 70px rgba(0, 44, 28, 0.15)',
    padding: '2.5rem',
    boxSizing: 'border-box'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem'
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  title: {
    fontSize: '1.3rem',
    fontWeight: '800',
    color: '#0f291e',
    margin: 0
  },
  closeBtn: {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#7ea191',
    cursor: 'pointer',
    padding: '4px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem'
  },
  summaryBox: {
    backgroundColor: '#f4faf7',
    border: '1px solid #e2efe9',
    borderRadius: '16px',
    padding: '1.25rem 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem'
  },
  summaryCategory: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#00bfa5',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  summaryTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#0f291e',
    margin: '4px 0 0 0'
  },
  summaryPrice: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#0f291e'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#2d4a3e'
  },
  input: {
    width: '100%',
    backgroundColor: '#f4faf7',
    border: '1px solid #bfe0d3',
    borderRadius: '12px',
    padding: '0.85rem 1.25rem',
    fontSize: '0.95rem',
    color: '#0f291e',
    outline: 'none',
    boxSizing: 'border-box'
  },
  cardInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  submitBtn: {
    border: 'none',
    backgroundColor: '#0f291e',
    color: '#ffffff',
    padding: '1.1rem',
    fontSize: '1rem',
    fontWeight: '600',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    boxShadow: '0 10px 25px rgba(15,41,30,0.15)',
    marginTop: '0.5rem'
  },
  successWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '1.5rem 0'
  },
  successTitle: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#0f291e',
    margin: '0 0 0.5rem 0'
  },
  successDesc: {
    fontSize: '0.95rem',
    color: '#5b7e6e',
    lineHeight: '1.6',
    margin: '0 0 2rem 0',
    maxWidth: '360px'
  },
  doneBtn: {
    border: 'none',
    backgroundColor: '#0f291e',
    color: '#ffffff',
    padding: '1rem 2rem',
    fontSize: '0.95rem',
    fontWeight: '600',
    borderRadius: '12px',
    cursor: 'pointer'
  }
};
