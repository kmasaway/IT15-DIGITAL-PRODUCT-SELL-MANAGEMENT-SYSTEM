import { useState } from 'react';
import { X, LogIn, UserPlus, Loader2, AlertCircle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [fields, setFields] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'Customer' });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    const endpoint = isRegisterMode 
      ? 'http://localhost:5132/api/Auth/register' 
      : 'http://localhost:5132/api/Auth/login';

    // Formulating dual-casing properties to guarantee seamless ASP.NET DTO model binding
    const payload = isRegisterMode 
      ? { 
          FullName: `${fields.firstName} ${fields.lastName}`.trim(),
          fullName: `${fields.firstName} ${fields.lastName}`.trim(), 
          Email: fields.email,
          email: fields.email, 
          Password: fields.password,
          password: fields.password,
          Role: fields.role,
          role: fields.role
        }
      : { 
          Email: fields.email,
          email: fields.email, 
          Password: fields.password,
          password: fields.password 
        };

    console.log("Dispatching authentication API request payload:", payload);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log("Raw response stream from API Engine:", response.status, responseText);
      
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        // Safe string fallback capture if backend sends a raw message instead of JSON object
        if (!response.ok) {
          throw new Error(responseText || `HTTP status code thrown: ${response.status}`, { cause: parseError });
        }
      }

      if (!response.ok) {
        throw new Error(data.message || responseText || (isRegisterMode 
          ? 'Registration rejected. Please verify submission properties.' 
          : 'Identity validation failure. Verify credentials.'));
      }

      if (isRegisterMode) {
        setErrorMessage(data.message || 'Registration successful! Your account is ready. You can now sign in.');
        // Reset local credential input values safely
        setFields({ firstName: '', lastName: '', email: '', password: '', role: 'Customer' });
        setIsRegisterMode(false);
      } else {
        if (data.token) {
          localStorage.setItem('sys_auth_token', data.token);
          console.log("Token signature locked into persistent local cache storage.");
        }
        
        if (typeof onAuthSuccess === 'function') {
          onAuthSuccess(data.user);
        }
        onClose();
      }
    } catch (err) {
      console.error("Authentication Exception Trace:", err);
      setErrorMessage(err.message || 'Network interface connectivity interruption.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modalCard}>
        
        <div style={styles.header}>
          <h3 style={styles.title}>
            {isRegisterMode ? 'Create Account' : 'Login to CoreK'}
          </h3>
          <button style={styles.closeBtn} onClick={onClose} disabled={isLoading}>
            <X size={18} />
          </button>
        </div>

        {errorMessage && (
          <div 
            style={{
              ...styles.errorBanner, 
              backgroundColor: errorMessage.includes('successful') || errorMessage.includes('pushed') ? '#eef6f2' : '#fff5f5',
              borderColor: errorMessage.includes('successful') || errorMessage.includes('pushed') ? '#bfe0d3' : '#ffcccc',
              color: errorMessage.includes('successful') || errorMessage.includes('pushed') ? '#0f291e' : '#c92a2a'
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {isRegisterMode && (
            <>
              <div style={styles.row}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>First Name</label>
                  <input
                    type="text"
                    required
                    disabled={isLoading}
                    placeholder="John"
                    style={styles.input}
                    value={fields.firstName}
                    onChange={(e) => setFields({ ...fields, firstName: e.target.value })}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Last Name</label>
                  <input
                    type="text"
                    required
                    disabled={isLoading}
                    placeholder="Doe"
                    style={styles.input}
                    value={fields.lastName}
                    onChange={(e) => setFields({ ...fields, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Account Role</label>
                <select
                  required
                  disabled={isLoading}
                  style={styles.input}
                  value={fields.role}
                  onChange={(e) => setFields({ ...fields, role: e.target.value })}
                >
                  <option value="Customer">Customer</option>
                  <option value="Seller">Seller</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              required
              disabled={isLoading}
              placeholder="name@example.com"
              style={styles.input}
              value={fields.email}
              onChange={(e) => setFields({ ...fields, email: e.target.value })}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Security Phrase (Password)</label>
            <input
              type="password"
              required
              disabled={isLoading}
              placeholder="••••••••••••"
              style={styles.input}
              value={fields.password}
              onChange={(e) => setFields({ ...fields, password: e.target.value })}
            />
          </div>

          <button type="submit" style={styles.submitBtn} disabled={isLoading}>
            {isLoading ? (
              <>
                Processing Pipelines... 
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', marginLeft: '8px' }} />
              </>
            ) : isRegisterMode ? (
              <>
                Create Account <UserPlus size={16} />
              </>
            ) : (
              <>
                Login <LogIn size={16} />
              </>
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={styles.footerText}>
            {isRegisterMode ? 'Already have an account? ' : 'New to CoreK? '}
            <strong 
              style={styles.toggleLink} 
              onClick={() => {
                if(!isLoading) {
                  setIsRegisterMode(!isRegisterMode);
                  setErrorMessage('');
                }
              }}
            >
              {isRegisterMode ? 'Login' : 'Create Account'}
            </strong>
          </span>
        </div>

      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 41, 30, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalCard: { backgroundColor: '#ffffff', border: '1px solid #bfe0d3', borderRadius: '24px', width: '100%', maxWidth: '460px', padding: '2.5rem', boxShadow: '0 30px 70px rgba(0, 44, 28, 0.15)', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { fontSize: '1.35rem', fontWeight: '800', color: '#0f291e', margin: 0, letterSpacing: '-0.3px' },
  closeBtn: { border: 'none', backgroundColor: 'transparent', color: '#7ea191', cursor: 'pointer' },
  errorBanner: { display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #ffcccc', borderRadius: '12px', padding: '0.75rem 1rem', fontSize: '0.85rem', marginBottom: '1.25rem', fontWeight: '500', lineHeight: '1.4' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.2rem' },
  row: { display: 'flex', gap: '1rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 },
  label: { fontSize: '0.85rem', fontWeight: '600', color: '#2d4a3e' },
  input: { width: '100%', backgroundColor: '#f4faf7', border: '1px solid #bfe0d3', borderRadius: '12px', padding: '0.8rem 1.1rem', fontSize: '0.95rem', color: '#0f291e', outline: 'none', boxSizing: 'border-box' },
  submitBtn: { border: 'none', backgroundColor: '#0b241a', color: '#ffffff', padding: '1rem', fontSize: '1rem', fontWeight: '700', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '0.5rem', boxShadow: '0 4px 12px rgba(11,36,26,0.15)' },
  footer: { marginTop: '1.75rem', textAlign: 'center', borderTop: '1px solid #e2efe9', paddingTop: '1.25rem' },
  footerText: { fontSize: '0.9rem', color: '#5b7e6e', fontWeight: '500' },
  toggleLink: { color: '#00bfa5', cursor: 'pointer', textDecoration: 'underline', marginLeft: '4px' }
};
