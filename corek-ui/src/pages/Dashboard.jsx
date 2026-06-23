import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CreditCard,
  Download,
  LayoutDashboard,
  Layers,
  LifeBuoy,
  Package,
  Pencil,
  Plus,
  Save,
  Send,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tags,
  Trash2,
  UploadCloud,
  UserCog,
  Users,
} from 'lucide-react';
import { api } from '../services/api';
import './Dashboard.css';

const emptyProductForm = {
  productId: null,
  title: '',
  description: '',
  price: '',
  categoryId: '',
  isActive: true,
  file: null,
};

const emptyVersionForm = {
  productId: '',
  versionNumber: '1.0.1',
  changelog: '',
  file: null,
};

const emptyCategoryForm = {
  categoryName: '',
  description: '',
};

const emptyTicketForm = {
  productId: '',
  orderId: '',
  subject: '',
  priority: 'Normal',
  message: '',
};

const moduleRegistry = {
  overview: { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  products: { id: 'products', label: 'Products', icon: Package },
  categories: { id: 'categories', label: 'Categories', icon: Tags },
  payments: { id: 'payments', label: 'Payments', icon: CreditCard },
  reports: { id: 'reports', label: 'Reports', icon: BarChart3 },
  users: { id: 'users', label: 'Users', icon: Users },
  profile: { id: 'profile', label: 'Profile', icon: UserCog },
  support: { id: 'support', label: 'Support', icon: LifeBuoy },
};

const roleConfigs = {
  Admin: {
    className: 'role-admin',
    eyebrow: 'Marketplace Administration',
    title: 'CoreK Control Room',
    subtitle: 'Moderate marketplace health, categories, payments, product quality, and customer support from one command surface.',
    modules: ['overview', 'reports', 'users', 'products', 'categories', 'payments', 'support', 'profile'],
    moduleLabels: {},
    heroIcon: ShieldCheck,
  },
  Seller: {
    className: 'role-seller',
    eyebrow: 'Creator Studio',
    title: 'Add product. Start selling. Get paid.',
    subtitle: 'A Gumroad-inspired seller workspace for uploads, versions, analytics, payments, and buyer support.',
    modules: ['overview', 'products', 'reports', 'payments', 'support', 'profile'],
    moduleLabels: { products: 'Listings', payments: 'Payouts' },
    heroIcon: Store,
  },
  Customer: {
    className: 'role-customer',
    eyebrow: 'Customer Marketplace',
    title: 'Browse, buy, and keep your digital library close.',
    subtitle: 'A customer-first storefront and purchase library for secure downloads, payment records, and support tickets.',
    modules: ['overview', 'products', 'payments', 'support', 'profile'],
    moduleLabels: { products: 'Marketplace', payments: 'Library' },
    heroIcon: ShoppingBag,
  },
};

function formatMoney(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return 'Pending';
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function Dashboard({ user, userSessionName }) {
  const activeUser = user || {};
  const userId = activeUser.userId || activeUser.UserId || 1;
  const role = activeUser.role || activeUser.Role || 'Customer';
  const normalizedRole = roleConfigs[role] ? role : 'Customer';
  const roleConfig = roleConfigs[normalizedRole];
  const roleModules = roleConfig.modules.map((moduleId) => ({
    ...moduleRegistry[moduleId],
    label: roleConfig.moduleLabels[moduleId] || moduleRegistry[moduleId].label,
  }));
  const isAdmin = normalizedRole === 'Admin';
  const isSeller = normalizedRole === 'Seller';
  const isCustomer = normalizedRole === 'Customer';
  const displayName = activeUser.fullName || activeUser.FullName || userSessionName || 'CoreK User';

  const [activeModule, setActiveModule] = useState('overview');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reports, setReports] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [profile, setProfile] = useState({
    fullName: displayName,
    email: activeUser.email || activeUser.Email || '',
    phoneNumber: '',
    bio: '',
    payoutMethod: 'GCash',
    payoutAccountName: displayName,
    payoutAccountNumber: '',
    isTwoFactorEnabled: false,
  });
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [versionForm, setVersionForm] = useState(emptyVersionForm);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [ticketForm, setTicketForm] = useState(emptyTicketForm);
  const [checkoutForm, setCheckoutForm] = useState({
    productId: '',
    paymentMethod: 'GCash',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [, setIsLoading] = useState(false);

  const selectedCheckoutProduct = useMemo(
    () => products.find((product) => String(product.productId) === String(checkoutForm.productId)),
    [checkoutForm.productId, products]
  );

  const roleProducts = useMemo(() => {
    if (!isSeller) return products;
    return products.filter((product) => Number(product.sellerId) === Number(userId));
  }, [isSeller, products, userId]);

  const roleOrders = useMemo(() => {
    if (!isSeller) return orders;
    const sellerProductIds = new Set(roleProducts.map((product) => Number(product.productId)));
    return orders.filter((order) => sellerProductIds.has(Number(order.productId)));
  }, [isSeller, orders, roleProducts]);

  const roleTickets = useMemo(() => {
    if (!isSeller) return tickets;
    const sellerProductIds = new Set(roleProducts.map((product) => Number(product.productId)));
    return tickets.filter((ticket) => !ticket.productId || sellerProductIds.has(Number(ticket.productId)));
  }, [isSeller, roleProducts, tickets]);

  const activeRoleModule = roleConfig.modules.includes(activeModule) ? activeModule : roleConfig.modules[0];

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const [productData, categoryData, orderData, reportData, ticketData, profileData, userData] = await Promise.all([
        api.getProducts(searchTerm),
        api.getCategories(),
        api.getOrders(role === 'Customer' ? userId : undefined),
        api.getReports(),
        api.getTickets(role === 'Customer' ? userId : undefined),
        api.getProfile(userId),
        isAdmin ? api.getUsers() : Promise.resolve([]),
      ]);

      setProducts(productData || []);
      setCategories(categoryData || []);
      setOrders(orderData || []);
      setReports(reportData || null);
      setTickets(ticketData || []);
      setUsers(userData || []);
      setProfile({
        fullName: profileData.fullName || displayName,
        email: profileData.email || '',
        phoneNumber: profileData.phoneNumber || '',
        bio: profileData.bio || '',
        payoutMethod: profileData.payoutMethod || 'GCash',
        payoutAccountName: profileData.payoutAccountName || profileData.fullName || displayName,
        payoutAccountNumber: profileData.payoutAccountNumber || '',
        isTwoFactorEnabled: Boolean(profileData.isTwoFactorEnabled),
      });
    } catch (err) {
      setError(err.message || 'Unable to load module data.');
    } finally {
      setIsLoading(false);
    }
  }, [displayName, isAdmin, role, searchTerm, userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
  }, [loadDashboard]);

  const showNotice = (message) => {
    setNotice(message);
    setError('');
  };

  const showError = (message) => {
    setError(message);
    setNotice('');
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();

    try {
      if (productForm.productId) {
        await api.updateProduct(productForm.productId, {
          title: productForm.title,
          description: productForm.description,
          price: Number(productForm.price),
          categoryId: Number(productForm.categoryId),
          isActive: productForm.isActive,
        });
        showNotice('Product listing updated.');
      } else {
        if (!productForm.file) {
          showError('Attach a digital product file before saving.');
          return;
        }

        const formData = new FormData();
        formData.append('title', productForm.title);
        formData.append('description', productForm.description);
        formData.append('price', productForm.price);
        formData.append('categoryId', productForm.categoryId);
        formData.append('sellerId', userId);
        formData.append('file', productForm.file);

        await api.uploadProduct(formData);
        showNotice('Product uploaded with initial version.');
      }

      setProductForm(emptyProductForm);
      await loadDashboard();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleVersionSubmit = async (event) => {
    event.preventDefault();

    if (!versionForm.productId || !versionForm.file) {
      showError('Choose a product and attach the new version file.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('versionNumber', versionForm.versionNumber);
      formData.append('changelog', versionForm.changelog);
      formData.append('file', versionForm.file);

      await api.addProductVersion(versionForm.productId, formData);
      setVersionForm(emptyVersionForm);
      showNotice('Product version pushed.');
      await loadDashboard();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();

    try {
      await api.createCategory(categoryForm);
      setCategoryForm(emptyCategoryForm);
      showNotice('Category saved.');
      await loadDashboard();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleCheckout = async (event) => {
    event.preventDefault();

    if (!selectedCheckoutProduct) {
      showError('Select a product for checkout.');
      return;
    }

    try {
      const result = await api.checkout({
        productId: selectedCheckoutProduct.productId,
        customerId: userId,
        customerName: profile.fullName,
        customerEmail: profile.email,
        paymentMethod: checkoutForm.paymentMethod,
      });

      showNotice(`Payment completed. Reference ${result.referenceNumber}.`);
      setCheckoutForm({ productId: '', paymentMethod: 'GCash' });
      await loadDashboard();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    try {
      const result = await api.updateProfile(userId, profile);
      const nextUser = result.user || {};
      localStorage.setItem('corek_user', JSON.stringify(nextUser));
      showNotice('Profile saved.');
      await loadDashboard();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleTicketSubmit = async (event) => {
    event.preventDefault();

    try {
      await api.createTicket({
        customerId: userId,
        customerName: profile.fullName,
        customerEmail: profile.email,
        productId: ticketForm.productId ? Number(ticketForm.productId) : null,
        orderId: ticketForm.orderId ? Number(ticketForm.orderId) : null,
        subject: ticketForm.subject,
        priority: ticketForm.priority,
        message: ticketForm.message,
      });

      setTicketForm(emptyTicketForm);
      showNotice('Support ticket submitted.');
      await loadDashboard();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleTicketStatus = async (ticket, status) => {
    try {
      await api.updateTicket(ticket.supportTicketId, {
        status,
        priority: ticket.priority,
      });
      showNotice('Support ticket updated.');
      await loadDashboard();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleDeactivateProduct = async (productId) => {
    try {
      await api.deactivateProduct(productId);
      showNotice('Product listing deactivated.');
      await loadDashboard();
    } catch (err) {
      showError(err.message);
    }
  };

  const renderStatus = (status) => {
    const normalized = String(status || '').toLowerCase();
    const tone = normalized.includes('complete') || normalized.includes('active')
      ? 'good'
      : normalized.includes('pending') || normalized.includes('open')
        ? 'warn'
        : normalized.includes('closed') || normalized.includes('failed')
          ? 'bad'
          : '';

    return <span className={`status-pill ${tone}`}>{status}</span>;
  };

  const renderRoleSpotlight = () => {
    const HeroIcon = roleConfig.heroIcon;

    if (isSeller) {
      return (
        <section className="role-hero seller-roadmap">
          <div>
            <span className="role-eyebrow">{roleConfig.eyebrow}</span>
            <h1>{roleConfig.title}</h1>
            <p>{roleConfig.subtitle}</p>
          </div>
          <div className="roadmap-steps">
            {[
              ['01', 'Upload file'],
              ['02', 'Set price'],
              ['03', 'Push update'],
              ['04', 'Get paid'],
            ].map(([step, label]) => (
              <div className="roadmap-step" key={step}>
                <strong>{step}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (isCustomer) {
      return (
        <section className="role-hero customer-hero">
          <div>
            <span className="role-eyebrow">{roleConfig.eyebrow}</span>
            <h1>{roleConfig.title}</h1>
            <p>{roleConfig.subtitle}</p>
          </div>
          <div className="customer-quick-card">
            <HeroIcon size={30} />
            <strong>{roleOrders.length}</strong>
            <span>purchased assets</span>
          </div>
        </section>
      );
    }

    return (
      <section className="role-hero admin-hero">
        <div>
          <span className="role-eyebrow">{roleConfig.eyebrow}</span>
          <h1>{roleConfig.title}</h1>
          <p>{roleConfig.subtitle}</p>
        </div>
        <div className="admin-signal-grid">
          <div><Users size={18} /><span>{reports?.totalOrders || 0} orders</span></div>
          <div><Package size={18} /><span>{reports?.totalProducts || 0} products</span></div>
          <div><LifeBuoy size={18} /><span>{reports?.openTickets || 0} open tickets</span></div>
        </div>
      </section>
    );
  };

  const renderOverview = () => (
    <div className="module-stack">
      <div className="grid-4">
        <div className="panel metric revenue">
          <div>
            <span>{isCustomer ? 'Library Spend' : 'Total Sales'}</span>
            <strong>{formatMoney(isCustomer ? orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0) : reports?.totalSales)}</strong>
          </div>
          <CreditCard size={22} />
        </div>
        <div className="panel metric">
          <div>
            <span>{isCustomer ? 'Available Assets' : isSeller ? 'Your Listings' : 'Active Products'}</span>
            <strong>{isSeller ? roleProducts.length : reports?.activeProducts || products.length}</strong>
          </div>
          <Package size={22} />
        </div>
        <div className="panel metric orders">
          <div>
            <span>{isCustomer ? 'Purchases' : 'Completed Orders'}</span>
            <strong>{isSeller || isCustomer ? roleOrders.length : reports?.completedOrders || 0}</strong>
          </div>
          <Download size={22} />
        </div>
        <div className="panel metric support">
          <div>
            <span>Open Tickets</span>
            <strong>{isAdmin ? reports?.openTickets || 0 : roleTickets.filter((ticket) => ticket.status !== 'Closed').length}</strong>
          </div>
          <LifeBuoy size={22} />
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <h2>{isCustomer ? 'Recent Purchases' : 'Recent Orders'}</h2>
          <div className="mini-list">
            {(isAdmin ? reports?.recentOrders || [] : roleOrders.slice(0, 5)).length === 0 && <div className="empty-state">No orders recorded yet.</div>}
            {(isAdmin ? reports?.recentOrders || [] : roleOrders.slice(0, 5)).map((order) => (
              <div className="mini-row" key={order.orderId}>
                <div>
                  <strong>{order.productTitle || order.title}</strong>
                  <span>{order.customerName} · {formatDate(order.createdAt)}</span>
                </div>
                <strong>{formatMoney(order.totalAmount)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2>Top Categories</h2>
          <div className="mini-list">
            {(reports?.salesByCategory || []).length === 0 && <div className="empty-state">No category sales yet.</div>}
            {(reports?.salesByCategory || []).map((item) => (
              <div className="mini-row" key={item.category}>
                <div>
                  <strong>{item.category}</strong>
                  <span>{item.orders} orders</span>
                </div>
                <strong>{formatMoney(item.sales)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCustomerMarketplace = () => (
    <div className="module-stack">
      <div className="customer-market-grid">
        {products.map((product) => (
          <article className="market-product-card" key={product.productId}>
            <div className="market-product-art">
              <span>{product.category || product.categoryName || 'Digital Product'}</span>
            </div>
            <div className="market-product-body">
              <div className="market-product-meta">
                <span>Version {product.latestVersion || '1.0.0'}</span>
                {renderStatus(product.isActive ? 'Ready' : 'Inactive')}
              </div>
              <h2>{product.title}</h2>
              <p>{product.description}</p>
              <div className="market-product-footer">
                <strong>{formatMoney(product.price)}</strong>
                <button
                  className="button"
                  type="button"
                  onClick={() => {
                    setCheckoutForm({ ...checkoutForm, productId: String(product.productId) });
                    setActiveModule('payments');
                  }}
                >
                  <ShoppingBag size={16} />
                  Buy
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {products.length === 0 && <div className="empty-state">No marketplace products available yet.</div>}
    </div>
  );

  const renderProducts = () => {
    if (isCustomer) {
      return renderCustomerMarketplace();
    }

    return (
    <div className="module-stack">
      {!isAdmin && (
      <div className="grid-2">
        <form className="panel" onSubmit={handleProductSubmit}>
          <h2>{productForm.productId ? 'Edit Product' : 'Upload Product'}</h2>
          <div className="form-grid">
            <div className="field">
              <label>Title</label>
              <input required value={productForm.title} onChange={(e) => setProductForm({ ...productForm, title: e.target.value })} />
            </div>
            <div className="field">
              <label>Price</label>
              <input required type="number" min="1" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} />
            </div>
            <div className="field">
              <label>Category</label>
              <select required value={productForm.categoryId} onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}>
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Digital File</label>
              <input type="file" disabled={Boolean(productForm.productId)} onChange={(e) => setProductForm({ ...productForm, file: e.target.files?.[0] || null })} />
            </div>
            <div className="field checkbox-row">
              <input type="checkbox" checked={productForm.isActive} onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })} />
              <label>Active listing</label>
            </div>
            <div className="field full">
              <label>Description</label>
              <textarea required value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
            </div>
          </div>
          <div className="toolbar" style={{ marginTop: 14 }}>
            <button className="button" type="submit"><Save size={16} />Save Product</button>
            {productForm.productId && (
              <button className="button secondary" type="button" onClick={() => setProductForm(emptyProductForm)}>Cancel Edit</button>
            )}
          </div>
        </form>

        <form className="panel" onSubmit={handleVersionSubmit}>
          <h2>Product Versioning</h2>
          <div className="form-grid">
            <div className="field">
              <label>Product</label>
              <select required value={versionForm.productId} onChange={(e) => setVersionForm({ ...versionForm, productId: e.target.value })}>
                <option value="">Select product</option>
                {roleProducts.map((product) => (
                  <option key={product.productId} value={product.productId}>{product.title}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Version</label>
              <input required value={versionForm.versionNumber} onChange={(e) => setVersionForm({ ...versionForm, versionNumber: e.target.value })} />
            </div>
            <div className="field full">
              <label>Changelog</label>
              <textarea value={versionForm.changelog} onChange={(e) => setVersionForm({ ...versionForm, changelog: e.target.value })} />
            </div>
            <div className="field full">
              <label>Updated File</label>
              <input required type="file" onChange={(e) => setVersionForm({ ...versionForm, file: e.target.files?.[0] || null })} />
            </div>
          </div>
          <div className="toolbar" style={{ marginTop: 14 }}>
            <button className="button" type="submit"><UploadCloud size={16} />Push Version</button>
          </div>
        </form>
      </div>
      )}

      <div className="panel">
        <div className="module-header">
          <h2>Product Listings</h2>
          <input className="search-input" style={{ maxWidth: 320 }} placeholder="Search products" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Version</th>
                <th>Status</th>
                {!isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {roleProducts.map((product) => (
                <tr key={product.productId}>
                  <td><strong>{product.title}</strong></td>
                  <td>{product.category || product.categoryName}</td>
                  <td>{formatMoney(product.price)}</td>
                  <td>{product.latestVersion || '1.0.0'} · {product.versionCount || 0} files</td>
                  <td>{renderStatus(product.isActive ? 'Active' : 'Inactive')}</td>
                  {!isAdmin && (
                  <td className="actions">
                    <button className="button secondary" type="button" onClick={() => setProductForm({
                      productId: product.productId,
                      title: product.title,
                      description: product.description,
                      price: product.price,
                      categoryId: product.categoryId,
                      isActive: product.isActive,
                      file: null,
                    })}><Pencil size={14} />Edit</button>
                    <button className="button danger" type="button" onClick={() => handleDeactivateProduct(product.productId)}><Trash2 size={14} />Deactivate</button>
                  </td>
                  )}
                </tr>
              ))}
              {roleProducts.length === 0 && (
                <tr><td colSpan={isAdmin ? 5 : 6}><div className="empty-state">No products available.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    );
  };

  const renderCategories = () => (
    <div className={isAdmin ? 'module-stack' : 'grid-2'}>
      {!isAdmin && (
      <form className="panel" onSubmit={handleCategorySubmit}>
        <h2>Create Category</h2>
        <div className="form-grid">
          <div className="field full">
            <label>Category Name</label>
            <input required value={categoryForm.categoryName} onChange={(e) => setCategoryForm({ ...categoryForm, categoryName: e.target.value })} />
          </div>
          <div className="field full">
            <label>Description</label>
            <textarea value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} />
          </div>
        </div>
        <div className="toolbar" style={{ marginTop: 14 }}>
          <button className="button" type="submit"><Plus size={16} />Add Category</button>
        </div>
      </form>
      )}

      <div className="panel">
        <h2>Marketplace Categories</h2>
        <div className="mini-list">
          {categories.map((category) => (
            <div className="mini-row" key={category.categoryId}>
              <div>
                <strong>{category.categoryName}</strong>
                <span>{category.description || 'No description'} · {category.productCount} products</span>
              </div>
              {!isAdmin && (
              <button className="button danger" type="button" onClick={async () => {
                try {
                  await api.deleteCategory(category.categoryId);
                  showNotice('Category deleted.');
                  await loadDashboard();
                } catch (err) {
                  showError(err.message);
                }
              }}><Trash2 size={14} /></button>
              )}
            </div>
          ))}
          {categories.length === 0 && <div className="empty-state">No categories yet.</div>}
        </div>
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="module-stack">
      <div className={isAdmin ? 'module-stack' : 'grid-2'}>
        {!isAdmin && (
        <form className="panel" onSubmit={handleCheckout}>
          <h2>{isCustomer ? 'Checkout' : 'Create Test Payment'}</h2>
          <div className="form-grid">
            <div className="field full">
              <label>Product</label>
              <select required value={checkoutForm.productId} onChange={(e) => setCheckoutForm({ ...checkoutForm, productId: e.target.value })}>
                <option value="">Select digital product</option>
                {products.map((product) => (
                  <option key={product.productId} value={product.productId}>{product.title} · {formatMoney(product.price)}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Payment Method</label>
              <select value={checkoutForm.paymentMethod} onChange={(e) => setCheckoutForm({ ...checkoutForm, paymentMethod: e.target.value })}>
                <option value="GCash">GCash</option>
                <option value="Card">Card</option>
                <option value="Maya">Maya</option>
              </select>
            </div>
            <div className="field">
              <label>Total</label>
              <input readOnly value={selectedCheckoutProduct ? formatMoney(selectedCheckoutProduct.price) : formatMoney(0)} />
            </div>
          </div>
          <div className="toolbar" style={{ marginTop: 14 }}>
            <button className="button" type="submit"><ShieldCheck size={16} />Record Payment</button>
          </div>
        </form>
        )}

        <div className="panel">
          <h2>{isCustomer ? 'My Digital Library' : isSeller ? 'Recent Buyer Access' : 'Digital Delivery'}</h2>
          <div className="mini-list">
            {roleOrders.slice(0, 4).map((order) => (
              <div className="mini-row" key={order.orderId}>
                <div>
                  <strong>{order.productTitle}</strong>
                  <span>{order.referenceNumber || 'No reference'} · {order.paymentMethod}</span>
                </div>
                {renderStatus(order.status)}
              </div>
            ))}
            {roleOrders.length === 0 && <div className="empty-state">No paid downloads yet.</div>}
          </div>
        </div>
      </div>

      <div className="panel">
        <h2>{isCustomer ? 'Purchase Records' : isSeller ? 'Payout Records' : 'Payment Records'}</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Total</th>
                <th>Status</th>
                <th>Download Token</th>
              </tr>
            </thead>
            <tbody>
              {roleOrders.map((order) => (
                <tr key={order.orderId}>
                  <td>{order.referenceNumber}</td>
                  <td>{order.customerName}</td>
                  <td>{order.productTitle}</td>
                  <td>{formatMoney(order.totalAmount)}</td>
                  <td>{renderStatus(order.status)}</td>
                  <td>{order.downloadToken || 'Pending'}</td>
                </tr>
              ))}
              {roleOrders.length === 0 && (
                <tr><td colSpan="6"><div className="empty-state">No payment records yet.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="module-stack">
      <div className="grid-3">
        <div className="panel metric revenue">
          <div><span>Revenue</span><strong>{formatMoney(reports?.totalSales)}</strong></div>
          <BarChart3 size={22} />
        </div>
        <div className="panel metric">
          <div><span>Products</span><strong>{reports?.totalProducts || 0}</strong></div>
          <Layers size={22} />
        </div>
        <div className="panel metric support">
          <div><span>Support Load</span><strong>{reports?.openTickets || 0}</strong></div>
          <LifeBuoy size={22} />
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <h2>Sales by Category</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Category</th><th>Orders</th><th>Sales</th></tr></thead>
              <tbody>
                {(reports?.salesByCategory || []).map((item) => (
                  <tr key={item.category}><td>{item.category}</td><td>{item.orders}</td><td>{formatMoney(item.sales)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h2>Top Products</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Product</th><th>Orders</th><th>Sales</th></tr></thead>
              <tbody>
                {(reports?.topProducts || []).map((item) => (
                  <tr key={item.productId}><td>{item.title}</td><td>{item.orders}</td><td>{formatMoney(item.sales)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="panel">
      <h2>Registered Users</h2>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Email</th>
              <th>2FA</th>
              <th>Products</th>
              <th>Orders</th>
              <th>Tickets</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((account) => {
              const accountId = account.userId || account.UserId;
              const fullName = account.fullName || account.FullName || 'Unnamed user';
              const email = account.email || account.Email || 'No email';
              const accountRole = account.role || account.Role || 'Customer';
              const isEmailVerified = account.isEmailVerified ?? account.IsEmailVerified;
              const isTwoFactorEnabled = account.isTwoFactorEnabled ?? account.IsTwoFactorEnabled;

              return (
                <tr key={accountId || email}>
                  <td><strong>{fullName}</strong></td>
                  <td>{email}</td>
                  <td>{accountRole}</td>
                  <td>{renderStatus(isEmailVerified ? 'Verified' : 'Unverified')}</td>
                  <td>{renderStatus(isTwoFactorEnabled ? 'Enabled' : 'Disabled')}</td>
                  <td>{account.productCount || account.ProductCount || 0}</td>
                  <td>{account.orderCount || account.OrderCount || 0}</td>
                  <td>{account.ticketCount || account.TicketCount || 0}</td>
                  <td>{formatDate(account.createdAt || account.CreatedAt)}</td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr><td colSpan="9"><div className="empty-state">No users found yet.</div></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProfile = () => {
    if (isAdmin) {
      return (
        <div className="panel">
          <h2>Admin Profile</h2>
          <div className="mini-list">
            <div className="mini-row">
              <div>
                <strong>Full Name</strong>
                <span>{profile.fullName || 'Not provided'}</span>
              </div>
            </div>
            <div className="mini-row">
              <div>
                <strong>Email</strong>
                <span>{profile.email || 'Not provided'}</span>
              </div>
              {renderStatus(profile.isTwoFactorEnabled ? '2FA Enabled' : '2FA Disabled')}
            </div>
            <div className="mini-row">
              <div>
                <strong>Phone</strong>
                <span>{profile.phoneNumber || 'Not provided'}</span>
              </div>
            </div>
            <div className="mini-row">
              <div>
                <strong>Payout Method</strong>
                <span>{profile.payoutMethod || 'Not provided'}</span>
              </div>
            </div>
            <div className="mini-row">
              <div>
                <strong>Payout Account</strong>
                <span>{profile.payoutAccountName || 'No account name'} {profile.payoutAccountNumber ? `- ${profile.payoutAccountNumber}` : ''}</span>
              </div>
            </div>
            <div className="mini-row">
              <div>
                <strong>Bio</strong>
                <span>{profile.bio || 'No bio yet.'}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
    <form className="panel" onSubmit={handleProfileSubmit}>
      <h2>Profile and Payout Details</h2>
      <div className="form-grid">
        <div className="field">
          <label>Full Name</label>
          <input required value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} />
        </div>
        <div className="field">
          <label>Email</label>
          <input required type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
        </div>
        <div className="field">
          <label>Phone</label>
          <input value={profile.phoneNumber} onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })} />
        </div>
        <div className="field">
          <label>Payout Method</label>
          <select value={profile.payoutMethod} onChange={(e) => setProfile({ ...profile, payoutMethod: e.target.value })}>
            <option value="GCash">GCash</option>
            <option value="Maya">Maya</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>
        <div className="field">
          <label>Payout Account Name</label>
          <input value={profile.payoutAccountName} onChange={(e) => setProfile({ ...profile, payoutAccountName: e.target.value })} />
        </div>
        <div className="field">
          <label>Payout Account Number</label>
          <input value={profile.payoutAccountNumber} onChange={(e) => setProfile({ ...profile, payoutAccountNumber: e.target.value })} />
        </div>
        <div className="field checkbox-row">
          <input type="checkbox" checked={profile.isTwoFactorEnabled} onChange={(e) => setProfile({ ...profile, isTwoFactorEnabled: e.target.checked })} />
          <label>Enable 2FA flag</label>
        </div>
        <div className="field full">
          <label>Bio</label>
          <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
        </div>
      </div>
      <div className="toolbar" style={{ marginTop: 14 }}>
        <button className="button" type="submit"><Save size={16} />Save Profile</button>
      </div>
    </form>
    );
  };

  const renderSupport = () => (
    <div className="module-stack">
      <div className={isAdmin ? 'module-stack' : 'grid-2'}>
        {!isAdmin && (
        <form className="panel" onSubmit={handleTicketSubmit}>
          <h2>Submit Ticket</h2>
          <div className="form-grid">
            <div className="field">
              <label>Product</label>
              <select value={ticketForm.productId} onChange={(e) => setTicketForm({ ...ticketForm, productId: e.target.value })}>
                <option value="">General inquiry</option>
                {(isCustomer ? products : roleProducts).map((product) => (
                  <option key={product.productId} value={product.productId}>{product.title}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Order</label>
              <select value={ticketForm.orderId} onChange={(e) => setTicketForm({ ...ticketForm, orderId: e.target.value })}>
                <option value="">No order selected</option>
                {roleOrders.map((order) => (
                  <option key={order.orderId} value={order.orderId}>{order.referenceNumber}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Priority</label>
              <select value={ticketForm.priority} onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}>
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="field">
              <label>Subject</label>
              <input required value={ticketForm.subject} onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })} />
            </div>
            <div className="field full">
              <label>Message</label>
              <textarea required value={ticketForm.message} onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })} />
            </div>
          </div>
          <div className="toolbar" style={{ marginTop: 14 }}>
            <button className="button" type="submit"><Send size={16} />Send Ticket</button>
          </div>
        </form>
        )}

        <div className="panel">
          <h2>{isAdmin ? 'Support Queue' : isSeller ? 'Buyer Support Queue' : 'My Tickets'}</h2>
          <div className="mini-list">
            {roleTickets.slice(0, 5).map((ticket) => (
              <div className="mini-row" key={ticket.supportTicketId}>
                <div>
                  <strong>{ticket.subject}</strong>
                  <span>{ticket.customerName} · {ticket.priority}</span>
                </div>
                {renderStatus(ticket.status)}
              </div>
            ))}
            {roleTickets.length === 0 && <div className="empty-state">No tickets submitted yet.</div>}
          </div>
        </div>
      </div>

      <div className="panel">
        <h2>Ticket Records</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {roleTickets.map((ticket) => (
                <tr key={ticket.supportTicketId}>
                  <td><strong>{ticket.subject}</strong></td>
                  <td>{ticket.customerName}</td>
                  <td>{ticket.productTitle || 'General'}</td>
                  <td>{ticket.priority}</td>
                  <td>
                    {isCustomer || isAdmin ? renderStatus(ticket.status) : (
                      <select value={ticket.status} onChange={(e) => handleTicketStatus(ticket, e.target.value)}>
                        <option value="Open">Open</option>
                        <option value="In Review">In Review</option>
                        <option value="Closed">Closed</option>
                      </select>
                    )}
                  </td>
                  <td>{formatDate(ticket.updatedAt)}</td>
                </tr>
              ))}
              {roleTickets.length === 0 && (
                <tr><td colSpan="6"><div className="empty-state">No support tickets yet.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const moduleCopy = {
    Admin: {
      overview: ['System Overview', 'Marketplace-wide status across products, payments, reports, and support records.'],
      products: ['Product Governance', 'View listings, versions, category placement, and product status across the marketplace.'],
      categories: ['Category Directory', 'View marketplace categories and product counts across software, templates, graphics, music, and 3D assets.'],
      payments: ['Payment Ledger', 'Audit sandbox GCash/Card payments and generated access tokens.'],
      reports: ['Reports and Analytics', 'Review sales analytics, category performance, top products, and support load.'],
      users: ['User Directory', 'View registered admins, sellers, and customers without changing their account records.'],
      profile: ['Admin Profile', 'View account details, payout settings, and the 2FA account flag.'],
      support: ['Helpdesk Monitor', 'View product and order-related support tickets across the marketplace.'],
    },
    Seller: {
      overview: ['Creator Overview', 'Track listings, buyer access, revenue, and open support issues for your store.'],
      products: ['Creator Listings', 'Upload products, set prices, and push version updates to buyers.'],
      payments: ['Payout Activity', 'Monitor buyer orders, delivery access, and checkout references.'],
      reports: ['Creator Analytics', 'See what sells, what needs updates, and where support needs attention.'],
      profile: ['Seller Profile', 'Maintain storefront details, payout account, and 2FA settings.'],
      support: ['Buyer Support', 'Respond to product and order issues connected to your listings.'],
    },
    Customer: {
      overview: ['Customer Home', 'Browse the marketplace, see your purchases, and keep support close.'],
      products: ['Marketplace', 'Discover digital products, review versions, and choose what to buy.'],
      payments: ['My Library', 'Checkout securely and access purchase references and download tokens.'],
      profile: ['Customer Profile', 'Maintain your buyer information and account protection settings.'],
      support: ['Support Tickets', 'Ask for help on orders, downloads, product files, or account concerns.'],
    },
  };
  const activeCopy = moduleCopy[normalizedRole]?.[activeRoleModule] || moduleCopy.Customer.overview;

  const renderActiveModule = () => {
    switch (activeRoleModule) {
      case 'products':
        return renderProducts();
      case 'categories':
        return renderCategories();
      case 'payments':
        return renderPayments();
      case 'reports':
        return renderReports();
      case 'profile':
        return renderProfile();
      case 'support':
        return renderSupport();
      default:
        return renderOverview();
    }
  };

  return (
    <div className={`dashboard-shell ${roleConfig.className}`}>
      <aside className="dashboard-sidebar">
        <div className="dashboard-user">
          <strong>{displayName}</strong>
          <span className="role-label-clean">{normalizedRole} - User #{userId}</span>
          <span className="role-label">{normalizedRole} · User #{userId}</span>
          <span>{role} · User #{userId}</span>
        </div>
        <nav className="dashboard-tabs">
          {roleModules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                className={`dashboard-tab ${activeRoleModule === module.id ? 'active' : ''}`}
                onClick={() => setActiveModule(module.id)}
                type="button"
              >
                <Icon size={17} />
                {module.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="dashboard-content">
        {renderRoleSpotlight()}

        <div className="module-header">
          <div>
            <h1>{activeCopy[0]}</h1>
            <p>{activeCopy[1]}</p>
          </div>
        </div>

        {notice && <div className="notice">{notice}</div>}
        {error && <div className="notice error">{error}</div>}

        <div style={{ marginTop: notice || error ? 16 : 0 }}>
          {renderActiveModule()}
        </div>
      </main>
    </div>
  );
}
