import { useState } from 'react';
import {
  ArrowRight,
  UploadCloud,
  Zap,
  Coins,
  CheckCircle,
  ArrowUpRight,
  Cpu,
  ChevronDown,
  Mail,
  Eye,
} from 'lucide-react';

const marketplaceCategories = [
  {
    name: 'Software & Tech',
    examples: 'Coding scripts, plugins, automation workflows, and software tools.',
  },
  {
    name: 'Business & Finance',
    examples: 'Pitch decks, swipe files, financial models, and specialized marketing guides.',
  },
  {
    name: '3D Assets',
    examples: 'Models, environments, and character assets such as VRChat avatars and Blender assets.',
  },
  {
    name: 'Design Assets',
    examples: 'UI kits, icons, fonts, Procreate brushes, Lightroom presets, and textures.',
  },
  {
    name: 'Education & Courses',
    examples: 'Comprehensive video tutorials, webinars, and masterclasses.',
  },
  {
    name: 'Self-Help & Productivity',
    examples: 'Notion templates, printable planners, dashboards, and meditation audio.',
  },
  {
    name: 'Art & Entertainment',
    examples: 'Comic books, e-books, music sample packs, and digital stickers.',
  },
];

export default function LandingPage({ onOpenAuthModal }) {
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <main style={styles.main} className="landing-main animate-fade-up">
      {/* --- HERO SECTION --- */}
      <div style={styles.heroGrid}>
        <div style={styles.heroLeft}>
          <h1 style={styles.heroText}>
            Turn your code configs
            <br />
            into a <span style={styles.gradientText}>global storefront</span>.
          </h1>

          <p style={styles.subHero}>
            Stop dealing with complex billing infrastructures. Upload scripts, financial models,
            3D assets, design resources, courses, planners, art packs, or entertainment files and collect
            secure automated payments instantly.
          </p>

          <div style={styles.ctaGroup}>
            <button
              style={styles.ctaBtn}
              onClick={onOpenAuthModal}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 15px 30px rgba(15,41,30,0.25)';
                e.currentTarget.style.backgroundColor = '#00bfa5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(15,41,30,0.15)';
                e.currentTarget.style.backgroundColor = '#0f291e';
              }}
            >
              Create Your Creator Account <ArrowRight size={18} />
            </button>

            <div style={styles.trustRow}>
              <div style={styles.trustItem}>
                <CheckCircle size={14} color="#00bfa5" /> No monthly fee setup
              </div>
              <div style={styles.trustItem}>
                <CheckCircle size={14} color="#00bfa5" /> Instant edge delivery
              </div>
            </div>
          </div>
        </div>

        <div style={styles.heroRight}>
          <div
            style={styles.previewContainer}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
            }}
          >
            <div style={styles.previewHeader}>
              <div style={styles.previewDots}>
                <div style={{ ...styles.dot, backgroundColor: '#ff5f56' }}></div>
                <div style={{ ...styles.dot, backgroundColor: '#ffbd2e' }}></div>
                <div style={{ ...styles.dot, backgroundColor: '#27c93f' }}></div>
              </div>
              <span style={styles.previewUrl}>corek.dev/assets/workflow-pack</span>
            </div>

            <div style={styles.previewContent}>
              <div style={styles.previewMeta}>
                <span style={styles.previewTag}>Software & Tech</span>
                <span style={styles.previewPrice}>₱49</span>
              </div>

              <h4 style={styles.previewTitle}>automation-workflow-pack.zip</h4>
              <p style={styles.previewDesc}>
                Plug-and-play scripts, plugin presets, and workflow templates for faster creator operations.
              </p>

              <div style={styles.previewFileBox}>
                <Cpu size={18} color="#00bfa5" />
                <div style={styles.fileDetails}>
                  <span style={styles.fileName}>workflow_bundle_v2.zip</span>
                  <span style={styles.fileSize}>4.2 MB • Distributed globally</span>
                </div>
              </div>

              <button style={styles.previewBuyBtn} onClick={onOpenAuthModal}>
                Get asset files <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- FEATURE MODULE --- */}
      <div style={styles.sectionDivider}>
        <h2 style={styles.sectionHeading}>Engineered for Digital Sellers</h2>
      </div>

      <div style={styles.featuresGrid}>
        {[
          {
            icon: <UploadCloud size={24} color="#00bfa5" />,
            title: 'Instant Asset Hosting',
            desc: 'Drag and drop scripts, decks, models, UI kits, courses, planners, audio packs, or books up to 5GB.',
          },
          {
            icon: <Zap size={24} color="#00bfa5" />,
            title: 'Automated Delivery',
            desc: 'As soon as payment authorization verifies, secure encrypted temporary download pipelines deploy straight to buyers.',
          },
          {
            icon: <Coins size={24} color="#00bfa5" />,
            title: 'Industry Low Splits',
            desc: 'No heavy platform subscription fees. Keep your profits with a transparent percentage fee structural configuration.',
          },
        ].map((feat, idx) => (
          <div
            key={idx}
            style={styles.featureCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.borderColor = '#00bfa5';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,191,165,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = '#e2efe9';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,44,28,0.015)';
            }}
          >
            <div style={styles.featureIconContainer}>{feat.icon}</div>
            <h3 style={styles.featureTitle}>{feat.title}</h3>
            <p style={styles.featureDesc}>{feat.desc}</p>
          </div>
        ))}
      </div>

      {/* --- MARKETPLACE CATEGORIES --- */}
      <div style={styles.sectionDivider}>
        <h2 style={styles.sectionHeading}>Marketplace Categories</h2>
      </div>

      <div style={styles.categoryGrid}>
        {marketplaceCategories.map((category, idx) => (
          <div
            key={category.name}
            style={styles.categoryCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.borderColor = '#00bfa5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = '#e2efe9';
            }}
          >
            <span style={styles.categoryIndex}>{String(idx + 1).padStart(2, '0')}</span>
            <h3 style={styles.categoryName}>{category.name}</h3>
            <p style={styles.categoryExamples}>{category.examples}</p>
          </div>
        ))}
      </div>

      {/* --- MODULE 1: PRODUCT SHOWCASE GRID --- */}
      <div style={styles.sectionDivider}>
        <h2 style={styles.sectionHeading}>Trending Digital Discoveries</h2>
      </div>

      <div style={styles.productGrid}>
        {[
          {
            title: 'Automation Workflow Pack',
            creator: 'By FlowForge',
            price: '₱89',
            category: 'Software & Tech',
            rating: '4.9 (124 sales)',
          },
          {
            title: 'Investor Pitch Deck Vault',
            creator: 'By CapitalKit',
            price: '₱24',
            category: 'Business & Finance',
            rating: '4.8 (89 sales)',
          },
          {
            title: 'VRChat Avatar Creator Kit',
            creator: 'By MeshMint',
            price: '₱15',
            category: '3D Assets',
            rating: '5.0 (42 sales)',
          },
        ].map((prod, idx) => (
          <div
            key={idx}
            style={styles.productCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,44,28,0.06)';
              e.currentTarget.style.borderColor = '#00bfa5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,44,28,0.02)';
              e.currentTarget.style.borderColor = '#e2efe9';
            }}
          >
            <div style={styles.productCardBanner}>
              <span style={styles.productCategoryTag}>{prod.category}</span>
            </div>

            <div style={styles.productCardBody}>
              <div style={styles.productCardMeta}>
                <span style={styles.productCreator}>{prod.creator}</span>
                <span style={styles.productRating}>★ {prod.rating}</span>
              </div>

              <h4 style={styles.productCardTitle}>{prod.title}</h4>

              <div style={styles.productFooterRow}>
                <button style={styles.productViewBtn} onClick={onOpenAuthModal}>
                  View <Eye size={14} />
                </button>

                <span style={styles.productCardPrice}>{prod.price}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODULE 2: INTERACTIVE FAQ ACCORDION --- */}
      <div style={styles.sectionDivider}>
        <h2 style={styles.sectionHeading}>Frequently Asked Questions</h2>
      </div>

      <div style={styles.faqContainer}>
        {[
          {
            q: 'How do payouts work on CoreK?',
            a: 'Payouts are transferred directly to your account using secure payment rails as soon as safe verification cycles clear, keeping platform deductions down to a flat 5% split parameter.',
          },
          {
            q: 'What files can I host and market?',
            a: 'You can host scripts, plugins, decks, financial models, 3D files, design packs, courses, planners, audio, e-books, and other digital downloads up to 5GB per asset container.',
          },
          {
            q: 'Can I manage version updates for past buyers?',
            a: 'Absolutely. When you upload an upgraded blueprint bundle config, you can push notifications or system download keys to all prior validation customers instantly.',
          },
        ].map((item, idx) => (
          <div key={idx} style={styles.faqItem}>
            <div style={styles.faqHeader} onClick={() => toggleFaq(idx)}>
              <span style={styles.faqQuestion}>{item.q}</span>
              <ChevronDown
                size={18}
                style={{
                  transform: activeFaq === idx ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.3s ease',
                  color: '#0f291e',
                }}
              />
            </div>

            <div
              style={{
                ...styles.faqBody,
                maxHeight: activeFaq === idx ? '200px' : '0',
                opacity: activeFaq === idx ? 1 : 0,
              }}
            >
              <p style={styles.faqAnswer}>{item.a}</p>
            </div>
          </div>
        ))}
      </div>

      {/* --- TESTIMONIALS MODULE --- */}
      <div style={styles.sectionDivider}>
        <h2 style={styles.sectionHeading}>What digital creators say</h2>
      </div>

      <div style={styles.testimonialGrid}>
        {[
          {
            letter: 'A',
            name: 'Alex Rivers',
            role: 'DevOps Engineer',
            text: '"Moving my configuration assets over to CoreK stripped away my checkout friction instantly. Setup took less than three minutes."',
            bg: '#00bfa5',
            color: '#0f291e',
          },
          {
            letter: 'S',
            name: 'Sarah Chen',
            role: 'UI Systems Architect',
            text: '"The automated edge download links work beautifully. My users have never once complained about missing script binaries."',
            bg: '#0f291e',
            color: '#fff',
          },
        ].map((test, idx) => (
          <div
            key={idx}
            style={styles.testimonialCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,44,28,0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={styles.ratingRow}>{'★'.repeat(5)}</div>
            <p style={styles.testimonialText}>{test.text}</p>

            <div style={styles.testimonialUser}>
              <div style={{ ...styles.avatar, backgroundColor: test.bg, color: test.color }}>
                {test.letter}
              </div>

              <div>
                <h5 style={styles.userName}>{test.name}</h5>
                <p style={styles.userRole}>{test.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODULE 3: NEWSLETTER UPDATE BLOCK --- */}
      <div style={styles.newsletterCard}>
        <div style={styles.newsletterLeft}>
          <div style={styles.newsletterIcon}>
            <Mail size={22} color="#00bfa5" />
          </div>

          <div>
            <h3 style={styles.newsletterTitle}>Get fresh digital product drops sent to your inbox</h3>
            <p style={styles.newsletterDesc}>
              Join 12,000+ creators receiving new tools, templates, assets, courses, and art packs weekly.
            </p>
          </div>
        </div>

        <div style={styles.newsletterForm}>
          <input type="email" placeholder="Enter your email address" style={styles.newsletterInput} />
          <button style={styles.newsletterBtn}>Subscribe</button>
        </div>
      </div>

      {/* --- METRICS MODULE --- */}
      <div style={styles.metricsBanner}>
        <div style={styles.metricItem}>
          <span style={styles.metricValue}>₱4.2M+</span>
          <span style={styles.metricLabel}>Paid out to creators</span>
        </div>

        <div style={styles.metricItem}>
          <span style={styles.metricValue}>45k+</span>
          <span style={styles.metricLabel}>Successful product downloads</span>
        </div>

        <div style={styles.metricItem}>
          <span style={styles.metricValue}>0ms</span>
          <span style={styles.metricLabel}>Delivery downtime parameters</span>
        </div>
      </div>
    </main>
  );
}

const styles = {
  main: {
    padding: '3rem var(--app-page-x-padding) 6rem',
    maxWidth: 'none',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
    position: 'relative',
  },
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: '1.1fr 0.9fr',
    gap: '4rem',
    alignItems: 'center',
    marginBottom: '6rem',
  },
  heroLeft: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left',
  },
  heroText: {
    fontSize: '4.2rem',
    fontWeight: '800',
    lineHeight: 1.1,
    marginBottom: '1.5rem',
    letterSpacing: '-2px',
    color: '#0f291e',
  },
  gradientText: {
    background: 'linear-gradient(135deg, #0f291e 0%, #00bfa5 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    display: 'inline-block',
  },
  subHero: {
    fontSize: '1.25rem',
    color: '#4a6b5d',
    maxWidth: '640px',
    lineHeight: '1.6',
    margin: '0 0 2.5rem 0',
  },
  ctaGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    alignItems: 'flex-start',
  },
  ctaBtn: {
    border: 'none',
    backgroundColor: '#0f291e',
    color: '#ffffff',
    padding: '1.1rem 2.5rem',
    fontSize: '1.05rem',
    fontWeight: '600',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 10px 25px rgba(15,41,30,0.15)',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  trustRow: {
    display: 'flex',
    gap: '1.5rem',
    paddingLeft: '4px',
  },
  trustItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.85rem',
    color: '#5b7e6e',
    fontWeight: '500',
  },
  heroRight: {
    display: 'flex',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  previewContainer: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: '#ffffff',
    border: '1px solid #bfe0d3',
    borderRadius: '24px',
    boxShadow: '0 20px 40px rgba(0,44,28,0.06)',
    overflow: 'hidden',
    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  previewHeader: {
    backgroundColor: '#f4faf7',
    borderBottom: '1px solid #e2efe9',
    padding: '1rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  previewDots: {
    display: 'flex',
    gap: '6px',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  previewUrl: {
    fontSize: '0.8rem',
    color: '#7ea191',
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  previewContent: {
    padding: '2rem',
  },
  previewMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  previewTag: {
    backgroundColor: 'rgba(0,191,165,0.08)',
    color: '#00bfa5',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '0.3rem 0.75rem',
    borderRadius: '6px',
    textTransform: 'uppercase',
  },
  previewPrice: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#0f291e',
  },
  previewTitle: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#0f291e',
    margin: '0 0 0.75rem 0',
  },
  previewDesc: {
    fontSize: '0.95rem',
    color: '#5b7e6e',
    lineHeight: '1.5',
    margin: '0 0 1.5rem 0',
  },
  previewFileBox: {
    backgroundColor: '#f4faf7',
    border: '1px solid #e2efe9',
    borderRadius: '12px',
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '1.5rem',
  },
  fileDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  fileName: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#0f291e',
  },
  fileSize: {
    fontSize: '0.75rem',
    color: '#7ea191',
  },
  previewBuyBtn: {
    width: '100%',
    border: 'none',
    backgroundColor: '#0f291e',
    color: '#ffffff',
    padding: '1rem',
    fontSize: '1rem',
    fontWeight: '600',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  sectionDivider: {
    width: '100%',
    borderBottom: '1px solid #d8e8e1',
    marginBottom: '3rem',
    paddingBottom: '0.75rem',
    marginTop: '4rem',
  },
  sectionHeading: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#0f291e',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '2rem',
    marginBottom: '4rem',
  },
  featureCard: {
    backgroundColor: '#fff',
    border: '1px solid #e2efe9',
    borderRadius: '20px',
    padding: '2.5rem',
    boxShadow: '0 8px 30px rgba(0,44,28,0.015)',
    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  featureIconContainer: {
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    backgroundColor: 'rgba(0,191,165,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  featureTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#0f291e',
    margin: '0 0 0.75rem',
  },
  featureDesc: {
    color: '#5b7e6e',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    margin: 0,
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '1.25rem',
    marginBottom: '4rem',
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2efe9',
    borderRadius: '12px',
    padding: '1.5rem',
    minHeight: '178px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    boxShadow: '0 4px 20px rgba(0,44,28,0.02)',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  categoryIndex: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    backgroundColor: '#f4faf7',
    color: '#00bfa5',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.78rem',
    fontWeight: '800',
  },
  categoryName: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: '#0f291e',
    margin: 0,
  },
  categoryExamples: {
    color: '#5b7e6e',
    fontSize: '0.92rem',
    lineHeight: '1.55',
    margin: 0,
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '2rem',
    marginBottom: '4rem',
  },
  productCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2efe9',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,44,28,0.02)',
    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  productCardBanner: {
    height: '140px',
    backgroundColor: '#eef6f2',
    padding: '1.25rem',
    display: 'flex',
    alignItems: 'flex-start',
  },
  productCategoryTag: {
    backgroundColor: '#ffffff',
    border: '1px solid #d8e8e1',
    padding: '0.35rem 0.75rem',
    borderRadius: '30px',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#2d4a3e',
  },
  productCardBody: {
    padding: '1.5rem',
  },
  productCardMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    color: '#7ea191',
    marginBottom: '0.5rem',
    fontWeight: '500',
  },
  productCreator: {
    color: '#7ea191',
  },
  productRating: {
    color: '#7ea191',
  },
  productCardTitle: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#0f291e',
    margin: '0 0 1.25rem 0',
  },
  productFooterRow: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  productCardPrice: {
    fontSize: '1.3rem',
    fontWeight: '800',
    color: '#0f291e',
    marginLeft: 'auto',
    textAlign: 'right',
  },
  productViewBtn: {
    border: '1px solid #bfe0d3',
    backgroundColor: '#ffffff',
    color: '#0f291e',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '0.5rem 1rem',
    borderRadius: '10px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  faqContainer: {
    maxWidth: '840px',
    margin: '0 auto 4rem auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  faqItem: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2efe9',
    borderRadius: '16px',
    overflow: 'hidden',
  },
  faqHeader: {
    padding: '1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
  },
  faqQuestion: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#0f291e',
  },
  faqBody: {
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  faqAnswer: {
    padding: '0 1.5rem 1.5rem 1.5rem',
    margin: 0,
    color: '#5b7e6e',
    fontSize: '0.95rem',
    lineHeight: '1.6',
  },
  testimonialGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '2rem',
    marginBottom: '6rem',
  },
  testimonialCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2efe9',
    borderRadius: '24px',
    padding: '2.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  ratingRow: {
    color: '#00bfa5',
    letterSpacing: '2px',
    fontSize: '1.1rem',
  },
  testimonialText: {
    fontSize: '1.1rem',
    color: '#2d4a3e',
    lineHeight: '1.6',
    margin: 0,
    fontStyle: 'italic',
  },
  testimonialUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.95rem',
  },
  userName: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#0f291e',
    margin: 0,
  },
  userRole: {
    fontSize: '0.8rem',
    color: '#7ea191',
    margin: 0,
  },
  newsletterCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    border: '1px solid #bfe0d3',
    padding: '3rem',
    borderRadius: '24px',
    gap: '3rem',
    flexWrap: 'wrap',
    marginBottom: '6rem',
    boxShadow: '0 8px 40px rgba(0,44,28,0.02)',
  },
  newsletterLeft: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
    flex: '1 1 400px',
  },
  newsletterIcon: {
    width: '54px',
    height: '54px',
    backgroundColor: 'rgba(0,191,165,0.06)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  newsletterTitle: {
    fontSize: '1.35rem',
    fontWeight: '800',
    color: '#0f291e',
    margin: '0 0 0.25rem 0',
  },
  newsletterDesc: {
    fontSize: '0.95rem',
    color: '#5b7e6e',
    margin: 0,
  },
  newsletterForm: {
    display: 'flex',
    gap: '12px',
    flex: '1 1 360px',
    width: '100%',
  },
  newsletterInput: {
    flex: 1,
    padding: '1rem 1.25rem',
    borderRadius: '12px',
    border: '1px solid #bfe0d3',
    backgroundColor: '#f4faf7',
    fontSize: '0.95rem',
    outline: 'none',
    color: '#0f291e',
  },
  newsletterBtn: {
    border: 'none',
    backgroundColor: '#0f291e',
    color: '#ffffff',
    padding: '0 1.75rem',
    fontWeight: '600',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  metricsBanner: {
    display: 'flex',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: '3rem',
    backgroundColor: '#0f291e',
    padding: '3.5rem',
    borderRadius: '24px',
    color: '#fff',
    textAlign: 'center',
    boxShadow: '0 20px 50px rgba(15,41,30,0.12)',
  },
  metricItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  metricValue: {
    fontSize: '2.6rem',
    fontWeight: '800',
    color: '#00bfa5',
    letterSpacing: '-1px',
  },
  metricLabel: {
    fontSize: '0.85rem',
    color: '#7ea191',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
};
