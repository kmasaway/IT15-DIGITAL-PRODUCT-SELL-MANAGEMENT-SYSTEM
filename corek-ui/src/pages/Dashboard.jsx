import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  Eye,
  LayoutDashboard,
  Layers,
  LifeBuoy,
  MessageCircle,
  Package,
  Pencil,
  Plus,
  Save,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Tags,
  Trash2,
  UploadCloud,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import './Dashboard.css';

const MARKETPLACE_PAGE_SIZE = 6;
const VALID_ID_STORAGE_PREFIX = 'corek_valid_id_';
const CHAT_STORAGE_PREFIX = 'corek_chat_';

const emptyProductForm = {
  productId: null,
  title: '',
  description: '',
  price: '',
  categoryId: '',
  isActive: true,
  iconFile: null,
  coverPhotoFile: null,
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

const emptyValidIdForm = {
  idType: 'National ID',
  idNumber: '',
  fileName: '',
  file: null,
};

const moduleRegistry = {
  overview: { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
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
    modules: ['overview', 'reports', 'users', 'products', 'categories', 'payments', 'support', 'profile'],
    moduleLabels: {},
  },
  Seller: {
    className: 'role-seller',
    modules: ['overview', 'products', 'reports', 'payments', 'support', 'profile'],
    moduleLabels: { products: 'Listings', payments: 'Payouts' },
  },
  Customer: {
    className: 'role-customer',
    modules: ['overview', 'products', 'payments', 'support', 'profile'],
    moduleLabels: { products: 'Marketplace', payments: 'Library' },
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

function getProductCategory(product) {
  return product.category || product.categoryName || 'Digital Product';
}

function getProductInitials(product) {
  const title = product.title || 'Digital Product';
  const words = title.split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]).join('');

  return initials.toUpperCase() || 'DP';
}

function getMarketplaceAccent(index) {
  const accents = ['#eaf7f2', '#edf4ff', '#f5f1ff', '#fff4e8', '#eef8f6', '#f7f2ec', '#f0f7ee'];
  return accents[index % accents.length];
}

function getProductApprovalStatus(product) {
  return product.isActive ? 'Approved' : 'Pending Review';
}

function isWithinDateRange(value, filters) {
  if (!filters.start && !filters.end) return true;
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  if (filters.start) {
    const startDate = new Date(`${filters.start}T00:00:00`);
    if (date < startDate) return false;
  }

  if (filters.end) {
    const endDate = new Date(`${filters.end}T23:59:59.999`);
    if (date > endDate) return false;
  }

  return true;
}

function formatDateRange(filters) {
  if (!filters.start && !filters.end) return 'All dates';
  if (filters.start && filters.end) return `${filters.start} to ${filters.end}`;
  if (filters.start) return `From ${filters.start}`;
  return `Until ${filters.end}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function DashboardModal({ title, subtitle, children, onClose, size = 'regular' }) {
  return (
    <div className="dashboard-modal-backdrop" role="presentation">
      <section className={`dashboard-modal ${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="dashboard-modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>

          <button className="modal-close-button" type="button" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="dashboard-modal-body">{children}</div>
      </section>
    </div>
  );
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
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState('details');
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [isValidIdModalOpen, setIsValidIdModalOpen] = useState(false);
  const [validIdRecord, setValidIdRecord] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`${VALID_ID_STORAGE_PREFIX}${userId}`) || 'null');
    } catch {
      return null;
    }
  });
  const [validIdForm, setValidIdForm] = useState(emptyValidIdForm);
  const [isLibraryFilterOpen, setIsLibraryFilterOpen] = useState(false);
  const [libraryFilters, setLibraryFilters] = useState({
    status: 'all',
    category: 'all',
  });
  const [sellerDateFilters, setSellerDateFilters] = useState({
    start: '',
    end: '',
  });
  const [payoutRequest, setPayoutRequest] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatDraft, setChatDraft] = useState('');
  const [chatMessages, setChatMessages] = useState(() => {
    const storageKey = `${CHAT_STORAGE_PREFIX}${userId}_${normalizedRole}`;

    try {
      const savedMessages = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (Array.isArray(savedMessages) && savedMessages.length > 0) {
        return savedMessages;
      }
    } catch {
      // Keep the built-in starter messages if local storage is unavailable.
    }

    return [
      {
        id: 1,
        sender: normalizedRole === 'Seller' ? 'Customer Support' : 'CoreK Seller',
        text: normalizedRole === 'Seller'
          ? 'Hi seller, you can reply to buyer concerns here.'
          : 'Hi, send a question about a product or your order here.',
        createdAt: new Date().toISOString(),
      },
    ];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [marketplaceCategory, setMarketplaceCategory] = useState('all');
  const [marketplaceSort, setMarketplaceSort] = useState('featured');
  const [marketplacePage, setMarketplacePage] = useState(1);
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

  const dateFilteredRoleOrders = useMemo(() => {
    if (!isSeller) return roleOrders;
    return roleOrders.filter((order) => isWithinDateRange(order.createdAt, sellerDateFilters));
  }, [isSeller, roleOrders, sellerDateFilters]);

  const roleTickets = useMemo(() => {
    if (!isSeller) return tickets;

    const sellerProductIds = new Set(roleProducts.map((product) => Number(product.productId)));
    return tickets.filter((ticket) => !ticket.productId || sellerProductIds.has(Number(ticket.productId)));
  }, [isSeller, roleProducts, tickets]);

  const completedRoleOrders = useMemo(
    () => dateFilteredRoleOrders.filter((order) => String(order.status || '').toLowerCase() === 'completed'),
    [dateFilteredRoleOrders]
  );

  const sellerTopProducts = useMemo(() => {
    const sellerProductTitles = new Map(roleProducts.map((product) => [
      Number(product.productId),
      product.title,
    ]));
    const salesByProduct = new Map();

    completedRoleOrders.forEach((order) => {
      const productId = Number(order.productId);
      const existing = salesByProduct.get(productId) || {
        productId,
        title: order.productTitle || sellerProductTitles.get(productId) || 'Digital Product',
        orders: 0,
        sales: 0,
      };

      existing.orders += 1;
      existing.sales += Number(order.totalAmount || 0);
      salesByProduct.set(productId, existing);
    });

    return Array.from(salesByProduct.values())
      .sort((first, second) => second.orders - first.orders || second.sales - first.sales)
      .slice(0, 5);
  }, [completedRoleOrders, roleProducts]);

  const sellerSalesByCategory = useMemo(() => {
    const categorySales = new Map();

    completedRoleOrders.forEach((order) => {
      const category = order.category || 'Digital Product';
      const existing = categorySales.get(category) || {
        category,
        orders: 0,
        sales: 0,
      };

      existing.orders += 1;
      existing.sales += Number(order.totalAmount || 0);
      categorySales.set(category, existing);
    });

    return Array.from(categorySales.values()).sort((first, second) => second.sales - first.sales);
  }, [completedRoleOrders]);

  const sellerRevenue = useMemo(
    () => completedRoleOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
    [completedRoleOrders]
  );

  const libraryCategoryOptions = useMemo(() => {
    const orderCategories = Array.from(new Set(roleOrders.map((order) => order.category || 'Digital Product')));

    return [
      { value: 'all', label: 'All categories' },
      ...orderCategories.map((category) => ({ value: category, label: category })),
    ];
  }, [roleOrders]);

  const filteredLibraryOrders = useMemo(() => {
    if (isSeller) return dateFilteredRoleOrders;
    if (!isCustomer) return roleOrders;

    return roleOrders.filter((order) => {
      const matchesStatus = libraryFilters.status === 'all' || order.status === libraryFilters.status;
      const matchesCategory = libraryFilters.category === 'all'
        || (order.category || 'Digital Product') === libraryFilters.category;

      return matchesStatus && matchesCategory;
    });
  }, [dateFilteredRoleOrders, isCustomer, isSeller, libraryFilters, roleOrders]);

  const marketplaceCategoryOptions = useMemo(() => {
    const categoryOptions = categories.length
      ? categories.map((category) => ({
        value: String(category.categoryId),
        label: category.categoryName,
        count: products.filter((product) => Number(product.categoryId) === Number(category.categoryId)).length,
      }))
      : Array.from(new Set(products.map((product) => getProductCategory(product)))).map((categoryName) => ({
        value: categoryName,
        label: categoryName,
        count: products.filter((product) => getProductCategory(product) === categoryName).length,
      }));

    return [
      {
        value: 'all',
        label: 'All',
        count: products.length,
      },
      ...categoryOptions,
    ];
  }, [categories, products]);

  const marketplaceProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const selectedCategory = marketplaceCategoryOptions.find((category) => category.value === marketplaceCategory);

    return products
      .filter((product) => {
        const matchesCategory = marketplaceCategory === 'all'
          || String(product.categoryId) === marketplaceCategory
          || getProductCategory(product) === selectedCategory?.label;

        const searchableText = [
          product.title,
          product.description,
          getProductCategory(product),
        ].join(' ').toLowerCase();

        return matchesCategory && (!normalizedSearch || searchableText.includes(normalizedSearch));
      })
      .sort((firstProduct, secondProduct) => {
        if (marketplaceSort === 'price-low') {
          return Number(firstProduct.price || 0) - Number(secondProduct.price || 0);
        }

        if (marketplaceSort === 'price-high') {
          return Number(secondProduct.price || 0) - Number(firstProduct.price || 0);
        }

        if (marketplaceSort === 'newest') {
          return new Date(secondProduct.createdAt || 0) - new Date(firstProduct.createdAt || 0);
        }

        return Number(secondProduct.isActive) - Number(firstProduct.isActive);
      });
  }, [marketplaceCategory, marketplaceCategoryOptions, marketplaceSort, products, searchTerm]);

  const marketplaceTotalPages = Math.max(1, Math.ceil(marketplaceProducts.length / MARKETPLACE_PAGE_SIZE));
  const marketplaceCurrentPage = Math.min(marketplacePage, marketplaceTotalPages);
  const marketplacePageStart = (marketplaceCurrentPage - 1) * MARKETPLACE_PAGE_SIZE;
  const paginatedMarketplaceProducts = marketplaceProducts.slice(
    marketplacePageStart,
    marketplacePageStart + MARKETPLACE_PAGE_SIZE
  );
  const marketplaceStartItem = marketplaceProducts.length === 0 ? 0 : marketplacePageStart + 1;
  const marketplaceEndItem = Math.min(marketplacePageStart + MARKETPLACE_PAGE_SIZE, marketplaceProducts.length);

  const activeRoleModule = roleConfig.modules.includes(activeModule) ? activeModule : roleConfig.modules[0];

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const [productData, categoryData, orderData, reportData, ticketData, profileData, userData] =
        await Promise.all([
          isSeller ? api.getSellerProducts(userId) : api.getProducts(searchTerm),
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
  }, [displayName, isAdmin, isSeller, role, searchTerm, userId]);

  useEffect(() => {
    const dashboardLoadTimer = window.setTimeout(() => {
      loadDashboard();
    }, 0);

    return () => window.clearTimeout(dashboardLoadTimer);
  }, [loadDashboard]);

  useEffect(() => {
    if (!isSeller && !isCustomer) return;

    localStorage.setItem(
      `${CHAT_STORAGE_PREFIX}${userId}_${normalizedRole}`,
      JSON.stringify(chatMessages)
    );
  }, [chatMessages, isCustomer, isSeller, normalizedRole, userId]);

  const showNotice = (message) => {
    setNotice(message);
    setError('');
  };

  const showError = (message) => {
    setError(message);
    setNotice('');
  };

  const resetSellerDateFilters = () => {
    setSellerDateFilters({ start: '', end: '' });
  };

  const handleRequestPayout = () => {
    if (!profile.payoutAccountName || !profile.payoutAccountNumber) {
      showError('Complete your payout account details before requesting a payout.');
      return;
    }

    if (sellerRevenue <= 0) {
      showError('No completed sales are available for payout in the selected date range.');
      return;
    }

    const nextRequest = {
      requestedAt: new Date().toISOString(),
      amount: sellerRevenue,
      method: profile.payoutMethod || 'GCash',
      accountName: profile.payoutAccountName,
      accountNumber: profile.payoutAccountNumber,
      range: formatDateRange(sellerDateFilters),
      status: 'Pending Review',
    };

    setPayoutRequest(nextRequest);
    showNotice('Payout request submitted for admin processing.');
  };

  const handleSendChatMessage = (event) => {
    event.preventDefault();

    const message = chatDraft.trim();
    if (!message) return;

    setChatMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now(),
        sender: displayName,
        text: message,
        createdAt: new Date().toISOString(),
      },
    ]);
    setChatDraft('');
  };

  const handleApproveProduct = async (product) => {
    try {
      await api.updateProduct(product.productId, {
        title: product.title,
        description: product.description,
        price: Number(product.price),
        categoryId: Number(product.categoryId),
        isActive: true,
      });
      showNotice('Product listing approved for the marketplace.');
      await loadDashboard();
    } catch (err) {
      showError(err.message);
    }
  };

  const openProductDetailsModal = (product = null) => {
    if (product) {
      setProductForm({
        productId: product.productId,
        title: product.title,
        description: product.description,
        price: product.price,
        categoryId: product.categoryId,
        isActive: product.isActive,
        iconFile: null,
        coverPhotoFile: null,
      });
    } else {
      setProductForm(emptyProductForm);
    }

    setProductModalMode('details');
    setIsProductModalOpen(true);
  };

  const openVersionModal = (productId = '') => {
    setVersionForm({ ...emptyVersionForm, productId: productId ? String(productId) : '' });
    setProductModalMode('version');
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setProductModalMode('details');
    setProductForm(emptyProductForm);
    setVersionForm(emptyVersionForm);
  };

  const openValidIdModal = () => {
    setValidIdForm(validIdRecord ? { ...emptyValidIdForm, ...validIdRecord } : emptyValidIdForm);
    setIsValidIdModalOpen(true);
  };

  const handleValidIdSubmit = (event) => {
    event.preventDefault();

    const nextRecord = {
      idType: validIdForm.idType,
      idNumber: validIdForm.idNumber.trim(),
      fileName: validIdForm.file?.name || validIdForm.fileName,
      status: 'Pending Review',
      submittedAt: new Date().toISOString(),
    };

    if (!nextRecord.idNumber || !nextRecord.fileName) {
      showError('Valid ID number and file attachment are required.');
      return;
    }

    localStorage.setItem(`${VALID_ID_STORAGE_PREFIX}${userId}`, JSON.stringify(nextRecord));
    setValidIdRecord(nextRecord);
    setValidIdForm({ ...emptyValidIdForm, ...nextRecord });
    setIsValidIdModalOpen(false);
    showNotice('Valid ID submitted for review.');
  };

  const renderHorizontalChart = (items, valueKey, labelKey, formatValue = (value) => value) => {
    const maxValue = Math.max(...items.map((item) => Number(item[valueKey] || 0)), 1);

    if (items.length === 0) {
      return <div className="empty-state">No sales data available yet.</div>;
    }

    return (
      <div className="horizontal-chart">
        {items.map((item, index) => {
          const value = Number(item[valueKey] || 0);
          const width = Math.max(8, Math.round((value / maxValue) * 100));

          return (
            <div className="chart-row" key={`${item[labelKey]}-${index}`}>
              <div className="chart-row-label">
                <strong>{item[labelKey]}</strong>
                <span>{item.orders || 0} orders</span>
              </div>

              <div className="chart-track" aria-hidden="true">
                <span style={{ width: `${width}%` }} />
              </div>

              <strong className="chart-value">{formatValue(value)}</strong>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSellerDateFilter = (title = 'Date Filter') => {
    if (!isSeller) return null;

    return (
      <div className="panel seller-date-filter">
        <div>
          <h2>{title}</h2>
          <p>{formatDateRange(sellerDateFilters)}</p>
        </div>

        <div className="date-filter-controls">
          <label>
            <span>Start</span>
            <input
              type="date"
              value={sellerDateFilters.start}
              onChange={(e) => setSellerDateFilters({ ...sellerDateFilters, start: e.target.value })}
            />
          </label>

          <label>
            <span>End</span>
            <input
              type="date"
              value={sellerDateFilters.end}
              onChange={(e) => setSellerDateFilters({ ...sellerDateFilters, end: e.target.value })}
            />
          </label>

          <button className="button secondary" type="button" onClick={resetSellerDateFilters}>
            Reset
            <CalendarDays size={16} />
          </button>
        </div>
      </div>
    );
  };

  const handleExportReportsPdf = () => {
    const topProducts = (isSeller ? sellerTopProducts : reports?.topProducts || []).slice(0, 5);
    const categoryRows = isSeller ? sellerSalesByCategory : reports?.salesByCategory || [];
    const reportRevenue = isSeller ? sellerRevenue : reports?.totalSales || 0;
    const reportProductCount = isSeller ? roleProducts.length : reports?.totalProducts || 0;
    const reportOrderCount = isSeller ? completedRoleOrders.length : reports?.completedOrders || 0;
    const generatedAt = new Date().toLocaleString('en-PH');

    const printWindow = window.open('', '_blank', 'width=960,height=720');
    if (!printWindow) {
      showError('Allow pop-ups to export the report PDF.');
      return;
    }

    const productRows = topProducts.map((item) => `
      <tr>
        <td>${escapeHtml(item.title)}</td>
        <td class="number">${escapeHtml(item.orders)}</td>
        <td class="number">${escapeHtml(formatMoney(item.sales))}</td>
      </tr>
    `).join('');

    const categoryTableRows = categoryRows.map((item) => `
      <tr>
        <td>${escapeHtml(item.category)}</td>
        <td class="number">${escapeHtml(item.orders)}</td>
        <td class="number">${escapeHtml(formatMoney(item.sales))}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>CoreK Reports</title>
          <style>
            body { color: #0f291e; font-family: Arial, sans-serif; margin: 32px; }
            h1 { margin: 0 0 4px; font-size: 28px; }
            h2 { border-bottom: 1px solid #dce9e3; font-size: 16px; margin-top: 28px; padding-bottom: 8px; }
            p { color: #5b7e6e; margin: 0; }
            .metrics { display: grid; gap: 12px; grid-template-columns: repeat(3, 1fr); margin: 24px 0; }
            .metric { border: 1px solid #dce9e3; border-radius: 12px; padding: 14px; }
            .metric span { color: #5b7e6e; display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; }
            .metric strong { display: block; font-size: 20px; margin-top: 10px; text-align: right; }
            table { border-collapse: collapse; margin-top: 12px; width: 100%; }
            th, td { border-bottom: 1px solid #dce9e3; padding: 10px; text-align: left; }
            th { background: #f4faf7; color: #5b7e6e; font-size: 12px; text-transform: uppercase; }
            .number { text-align: right; }
            @media print { button { display: none; } body { margin: 22px; } }
          </style>
        </head>
        <body>
          <h1>CoreK ${escapeHtml(normalizedRole)} Reports</h1>
          <p>Generated ${escapeHtml(generatedAt)} for ${escapeHtml(displayName)}</p>
          <p>Date range: ${escapeHtml(isSeller ? formatDateRange(sellerDateFilters) : 'All dates')}</p>

          <section class="metrics">
            <div class="metric"><span>Revenue</span><strong>${escapeHtml(formatMoney(reportRevenue))}</strong></div>
            <div class="metric"><span>Products</span><strong>${escapeHtml(reportProductCount)}</strong></div>
            <div class="metric"><span>Completed Orders</span><strong>${escapeHtml(reportOrderCount)}</strong></div>
          </section>

          <h2>Top 5 Best Selling Products</h2>
          <table>
            <thead><tr><th>Product</th><th class="number">Orders</th><th class="number">Sales</th></tr></thead>
            <tbody>${productRows || '<tr><td colspan="3">No product sales yet.</td></tr>'}</tbody>
          </table>

          <h2>Sales by Category</h2>
          <table>
            <thead><tr><th>Category</th><th class="number">Orders</th><th class="number">Sales</th></tr></thead>
            <tbody>${categoryTableRows || '<tr><td colspan="3">No category sales yet.</td></tr>'}</tbody>
          </table>

          <script>
            window.addEventListener('load', () => {
              window.focus();
              window.print();
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
        if (!productForm.iconFile || !productForm.coverPhotoFile) {
          showError('Attach both an icon and cover photo before saving.');
          return;
        }

        const formData = new FormData();
        formData.append('title', productForm.title);
        formData.append('description', productForm.description);
        formData.append('price', productForm.price);
        formData.append('categoryId', productForm.categoryId);
        formData.append('sellerId', userId);
        formData.append('file', productForm.coverPhotoFile);
        formData.append('icon', productForm.iconFile);
        formData.append('coverPhoto', productForm.coverPhotoFile);

        await api.uploadProduct(formData);
        showNotice(isSeller
          ? 'Product submitted for admin validation.'
          : 'Product uploaded with initial version.');
      }

      setProductForm(emptyProductForm);
      setIsProductModalOpen(false);
      setProductModalMode('details');
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
      setIsProductModalOpen(false);
      setProductModalMode('details');
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

    if (!isAdmin && !validIdRecord) {
      showError('Submit a valid ID before saving your profile.');
      setIsValidIdModalOpen(true);
      return;
    }

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
      setIsTicketModalOpen(false);
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

  const renderStatus = (status) => {
    const normalized = String(status || '').toLowerCase();
    const tone = normalized.includes('complete')
      || normalized.includes('active')
      || normalized.includes('approved')
      || normalized.includes('ready')
      ? 'good'
      : normalized.includes('pending') || normalized.includes('open') || normalized.includes('review')
        ? 'warn'
        : normalized.includes('closed') || normalized.includes('failed') || normalized.includes('missing')
          ? 'bad'
          : '';

    return <span className={`status-pill ${tone}`}>{status}</span>;
  };

  const renderOverview = () => (
    <div className="module-stack">
      <div className="grid-4">
        <div className="panel metric revenue">
          <div>
            <span>{isCustomer ? 'Library Spend' : 'Total Sales'}</span>
            <strong className="money-value">
              {formatMoney(
                isCustomer
                  ? orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)
                  : isSeller
                    ? sellerRevenue
                  : reports?.totalSales
              )}
            </strong>
          </div>
          <CreditCard className="right-side-icon" size={22} />
        </div>

        <div className="panel metric">
          <div>
            <span>{isCustomer ? 'Available Assets' : isSeller ? 'Your Listings' : 'Active Products'}</span>
            <strong className="number-value">
              {isSeller ? roleProducts.length : reports?.activeProducts || products.length}
            </strong>
          </div>
          <Package className="right-side-icon" size={22} />
        </div>

        <div className="panel metric orders">
          <div>
            <span>{isCustomer ? 'Purchases' : 'Completed Orders'}</span>
            <strong className="number-value">
              {isSeller ? completedRoleOrders.length : isCustomer ? roleOrders.length : reports?.completedOrders || 0}
            </strong>
          </div>
          <Download className="right-side-icon" size={22} />
        </div>

        <div className="panel metric support">
          <div>
            <span>Open Tickets</span>
            <strong className="number-value">
              {isAdmin
                ? reports?.openTickets || 0
                : roleTickets.filter((ticket) => ticket.status !== 'Closed').length}
            </strong>
          </div>
          <LifeBuoy className="right-side-icon" size={22} />
        </div>
      </div>

      {isSeller && (
        <>
          {renderSellerDateFilter('Dashboard Date Filter')}

          <div className="grid-2 seller-analytics-grid">
            <div className="panel chart-panel">
              <div className="panel-title-row">
                <div>
                  <h2>Top 5 Best Sell</h2>
                  <p>Your highest-selling listings by completed orders.</p>
                </div>
                <BarChart3 size={20} />
              </div>

              {renderHorizontalChart(sellerTopProducts, 'sales', 'title', formatMoney)}
            </div>

            <div className="panel chart-panel">
              <div className="panel-title-row">
                <div>
                  <h2>Category Sales</h2>
                  <p>Revenue grouped by digital product category.</p>
                </div>
                <Layers size={20} />
              </div>

              {renderHorizontalChart(sellerSalesByCategory, 'sales', 'category', formatMoney)}
            </div>
          </div>
        </>
      )}

      <div className="grid-2">
        <div className="panel">
          <h2>{isCustomer ? 'Recent Purchases' : 'Recent Orders'}</h2>

          <div className="mini-list">
            {(isAdmin ? reports?.recentOrders || [] : dateFilteredRoleOrders.slice(0, 5)).length === 0 && (
              <div className="empty-state">No orders recorded yet.</div>
            )}

            {(isAdmin ? reports?.recentOrders || [] : dateFilteredRoleOrders.slice(0, 5)).map((order) => (
              <div className="mini-row" key={order.orderId}>
                <div>
                  <strong>{order.productTitle || order.title}</strong>
                  <span>
                    {order.customerName} · {formatDate(order.createdAt)}
                  </span>
                </div>
                <strong className="money-value">{formatMoney(order.totalAmount)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2>Top Categories</h2>

          <div className="mini-list">
            {(isSeller ? sellerSalesByCategory : reports?.salesByCategory || []).length === 0 && (
              <div className="empty-state">No category sales yet.</div>
            )}

            {(isSeller ? sellerSalesByCategory : reports?.salesByCategory || []).map((item) => (
              <div className="mini-row" key={item.category}>
                <div>
                  <strong>{item.category}</strong>
                  <span>{item.orders} orders</span>
                </div>
                <strong className="money-value">{formatMoney(item.sales)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCustomerMarketplace = () => (
    <div className="discover-marketplace">
      <div className="discover-marketplace-toolbar">
        <label className="discover-search-box">
          <Search size={18} />
          <input
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setMarketplacePage(1);
            }}
            placeholder="Search marketplace"
          />
        </label>

        <label className="discover-sort-box">
          <SlidersHorizontal size={18} />
          <select
            value={marketplaceSort}
            onChange={(event) => {
              setMarketplaceSort(event.target.value);
              setMarketplacePage(1);
            }}
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
          </select>
        </label>
      </div>

      <div className="discover-category-rail" aria-label="Marketplace categories">
        {marketplaceCategoryOptions.map((category) => (
          <button
            key={category.value}
            className={marketplaceCategory === category.value ? 'active' : ''}
            type="button"
            onClick={() => {
              setMarketplaceCategory(category.value);
              setMarketplacePage(1);
            }}
          >
            <span>{category.label}</span>
            <strong>{category.count}</strong>
          </button>
        ))}
      </div>

      <div className="discover-product-grid">
        {paginatedMarketplaceProducts.map((product, index) => (
          <article
            className="discover-product-card"
            key={product.productId}
            style={{ '--discover-accent': getMarketplaceAccent(marketplacePageStart + index) }}
          >
            <div className="discover-product-art">
              <span>{getProductCategory(product)}</span>
              <strong>{getProductInitials(product)}</strong>
            </div>

            <div className="discover-product-body">
              <div className="discover-product-meta">
                <span>Creator #{product.sellerId || 'CoreK'}</span>
                {renderStatus(product.isActive ? 'Ready' : 'Inactive')}
              </div>

              <h3>{product.title}</h3>
              <p>{product.description}</p>

              <div className="discover-product-version">
                <span>Version {product.latestVersion || '1.0.0'}</span>
                <span>{product.versionCount || 0} files</span>
              </div>

              <div className="discover-product-footer">
                <strong className="money-value">{formatMoney(product.price)}</strong>

                <button
                  className="discover-buy-button"
                  type="button"
                  onClick={() => {
                    setCheckoutForm({ ...checkoutForm, productId: String(product.productId) });
                    setActiveModule('payments');
                  }}
                >
                  Buy
                  <ShoppingBag size={15} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {marketplaceProducts.length > 0 && (
        <div className="discover-pagination">
          <span>
            Showing {marketplaceStartItem}-{marketplaceEndItem} of {marketplaceProducts.length}
          </span>

          <div className="discover-pagination-actions">
            <button
              type="button"
              disabled={marketplaceCurrentPage === 1}
              onClick={() => setMarketplacePage(Math.max(1, marketplaceCurrentPage - 1))}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <strong>
              Page {marketplaceCurrentPage} of {marketplaceTotalPages}
            </strong>

            <button
              type="button"
              disabled={marketplaceCurrentPage === marketplaceTotalPages}
              onClick={() => setMarketplacePage(Math.min(marketplaceTotalPages, marketplaceCurrentPage + 1))}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {marketplaceProducts.length === 0 && (
        <div className="empty-state">No products match this marketplace view.</div>
      )}
    </div>
  );

  const renderProductListingModal = () => (
    <DashboardModal
      title={productModalMode === 'version' ? 'Product Version' : 'Product Listing'}
      subtitle={productModalMode === 'version'
        ? 'Push an updated product version for an existing listing.'
        : 'Create or edit listing details. New seller products stay pending until admin approval.'}
      onClose={closeProductModal}
      size="wide"
    >
      {productModalMode === 'details' ? (
        <form onSubmit={handleProductSubmit}>
          <div className="form-grid">
            <div className="field">
              <label>Title</label>
              <input
                required
                value={productForm.title}
                onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Price</label>
              <input
                className="number-input"
                required
                type="number"
                min="1"
                step="0.01"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Category</label>
              <select
                required
                value={productForm.categoryId}
                onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
            </div>

            <div className="field full">
              <label>Digital Content</label>
              <div className="content-upload-grid">
                <label>
                  <span>Icon</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={Boolean(productForm.productId)}
                    onChange={(e) => setProductForm({ ...productForm, iconFile: e.target.files?.[0] || null })}
                  />
                </label>

                <label>
                  <span>Cover Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={Boolean(productForm.productId)}
                    onChange={(e) => setProductForm({ ...productForm, coverPhotoFile: e.target.files?.[0] || null })}
                  />
                </label>
              </div>
              {productForm.productId && (
                <span className="field-note">Digital content media is locked while editing listing details.</span>
              )}
            </div>

            <div className="field full">
              <label>Description</label>
              <textarea
                required
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              />
            </div>
          </div>

          <div className="toolbar modal-actions">
            <button className="button" type="submit">
              Save Product
              <Save size={16} />
            </button>

            <button className="button secondary" type="button" onClick={closeProductModal}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVersionSubmit}>
          <div className="form-grid">
            <div className="field">
              <label>Product</label>
              <select
                required
                value={versionForm.productId}
                onChange={(e) => setVersionForm({ ...versionForm, productId: e.target.value })}
              >
                <option value="">Select product</option>
                {roleProducts.map((product) => (
                  <option key={product.productId} value={product.productId}>
                    {product.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Version</label>
              <input
                required
                value={versionForm.versionNumber}
                onChange={(e) => setVersionForm({ ...versionForm, versionNumber: e.target.value })}
              />
            </div>

            <div className="field full">
              <label>Changelog</label>
              <textarea
                value={versionForm.changelog}
                onChange={(e) => setVersionForm({ ...versionForm, changelog: e.target.value })}
              />
            </div>

            <div className="field full">
              <label>Updated File</label>
              <input
                required
                type="file"
                onChange={(e) => setVersionForm({ ...versionForm, file: e.target.files?.[0] || null })}
              />
            </div>
          </div>

          <div className="toolbar modal-actions">
            <button className="button" type="submit">
              Push Version
              <UploadCloud size={16} />
            </button>

            <button className="button secondary" type="button" onClick={closeProductModal}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </DashboardModal>
  );

  const renderProducts = () => {
    if (isCustomer) {
      return renderCustomerMarketplace();
    }

    return (
      <div className="module-stack">
        {!isAdmin && (
          <div className="panel listing-command-panel">
            <div>
              <h2>Listing Workspace</h2>
              <p>Create listings for admin validation, edit details, and push version updates separately.</p>
            </div>

            <div className="toolbar">
              <button className="button" type="button" onClick={() => openProductDetailsModal()}>
                New Listing
                <Plus size={16} />
              </button>

              <button className="button secondary" type="button" onClick={() => openVersionModal()}>
                Push Version
                <UploadCloud size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="panel">
          <div className="module-header">
            <h2>Product Listings</h2>
            <input
              className="search-input"
              style={{ maxWidth: 320 }}
              placeholder="Search products"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th className="money-cell">Price</th>
                  <th className="number-cell">Version</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {roleProducts.map((product) => (
                  <tr key={product.productId}>
                    <td>
                      <strong>{product.title}</strong>
                    </td>
                    <td>{product.category || product.categoryName}</td>
                    <td className="money-cell">{formatMoney(product.price)}</td>
                    <td className="number-cell">
                      {product.latestVersion || '1.0.0'} · {product.versionCount || 0} files
                    </td>
                    <td>{renderStatus(getProductApprovalStatus(product))}</td>

                    <td className="actions">
                      {isAdmin ? (
                        <button
                          className="button secondary"
                          type="button"
                          disabled={product.isActive}
                          onClick={() => handleApproveProduct(product)}
                        >
                          {product.isActive ? 'Approved' : 'Approve'}
                          <ShieldCheck size={14} />
                        </button>
                      ) : (
                        <>
                        <button
                          className="button secondary"
                          type="button"
                          onClick={() => openProductDetailsModal(product)}
                        >
                          Edit
                          <Pencil size={14} />
                        </button>

                        <button
                          className="button secondary icon-only-button"
                          type="button"
                          aria-label={`View versions for ${product.title}`}
                          title="View versions"
                          onClick={() => openVersionModal(product.productId)}
                        >
                          <Eye size={14} />
                        </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}

                {roleProducts.length === 0 && (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">No products available.</div>
                    </td>
                  </tr>
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
              <input
                required
                value={categoryForm.categoryName}
                onChange={(e) => setCategoryForm({ ...categoryForm, categoryName: e.target.value })}
              />
            </div>

            <div className="field full">
              <label>Description</label>
              <textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
            </div>
          </div>

          <div className="toolbar" style={{ marginTop: 14 }}>
            <button className="button" type="submit">
              Add Category
              <Plus size={16} />
            </button>
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
                <span>
                  {category.description || 'No description'} · {category.productCount} products
                </span>
              </div>

              {!isAdmin && (
                <button
                  className="button danger icon-only-button"
                  type="button"
                  onClick={async () => {
                    try {
                      await api.deleteCategory(category.categoryId);
                      showNotice('Category deleted.');
                      await loadDashboard();
                    } catch (err) {
                      showError(err.message);
                    }
                  }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}

          {categories.length === 0 && <div className="empty-state">No categories yet.</div>}
        </div>
      </div>
    </div>
  );

  const renderLibraryFilterModal = () => (
    <DashboardModal
      title="Filter Library"
      subtitle="Narrow purchased downloads by delivery status and category."
      onClose={() => setIsLibraryFilterOpen(false)}
    >
      <div className="form-grid">
        <div className="field">
          <label>Status</label>
          <select
            value={libraryFilters.status}
            onChange={(e) => setLibraryFilters({ ...libraryFilters, status: e.target.value })}
          >
            <option value="all">All statuses</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

        <div className="field">
          <label>Category</label>
          <select
            value={libraryFilters.category}
            onChange={(e) => setLibraryFilters({ ...libraryFilters, category: e.target.value })}
          >
            {libraryCategoryOptions.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="toolbar modal-actions">
        <button className="button" type="button" onClick={() => setIsLibraryFilterOpen(false)}>
          Apply Filters
          <SlidersHorizontal size={16} />
        </button>

        <button
          className="button secondary"
          type="button"
          onClick={() => setLibraryFilters({ status: 'all', category: 'all' })}
        >
          Reset
        </button>
      </div>
    </DashboardModal>
  );

  const renderPayments = () => {
    const paymentRows = isSeller ? dateFilteredRoleOrders : filteredLibraryOrders;

    return (
    <div className="module-stack">
      <div className={isAdmin ? 'module-stack' : 'grid-2'}>
        {!isAdmin && isCustomer && (
          <form className="panel" onSubmit={handleCheckout}>
            <h2>Checkout</h2>

            <div className="form-grid">
              <div className="field full">
                <label>Product</label>
                <select
                  required
                  value={checkoutForm.productId}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, productId: e.target.value })}
                >
                  <option value="">Select digital product</option>
                  {products.map((product) => (
                    <option key={product.productId} value={product.productId}>
                      {product.title} · {formatMoney(product.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Payment Method</label>
                <select
                  value={checkoutForm.paymentMethod}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, paymentMethod: e.target.value })}
                >
                  <option value="GCash">GCash</option>
                  <option value="Card">Card</option>
                  <option value="Maya">Maya</option>
                </select>
              </div>

              <div className="field">
                <label>Total</label>
                <input
                  className="number-input"
                  readOnly
                  value={selectedCheckoutProduct ? formatMoney(selectedCheckoutProduct.price) : formatMoney(0)}
                />
              </div>
            </div>

            <div className="toolbar" style={{ marginTop: 14 }}>
              <button className="button" type="submit">
                Record Payment
                <ShieldCheck size={16} />
              </button>
            </div>
          </form>
        )}

        {isSeller && (
          <div className="panel payout-process-panel">
            <div>
              <h2>Payout Process</h2>
              <p>Request payout after completed sales are filtered and reviewed.</p>
            </div>

            <div className="mini-list payout-summary-list">
              <div className="mini-row">
                <div>
                  <strong>Available Payout</strong>
                  <span>{formatDateRange(sellerDateFilters)}</span>
                </div>
                <strong className="money-value">{formatMoney(sellerRevenue)}</strong>
              </div>

              <div className="mini-row">
                <div>
                  <strong>Destination</strong>
                  <span>
                    {profile.payoutMethod || 'GCash'} - {profile.payoutAccountName || 'No account name'}
                  </span>
                </div>
                {renderStatus(profile.payoutAccountNumber ? 'Ready' : 'Missing')}
              </div>

              {payoutRequest && (
                <div className="mini-row">
                  <div>
                    <strong>Latest Request</strong>
                    <span>{formatDate(payoutRequest.requestedAt)}</span>
                  </div>
                  {renderStatus(payoutRequest.status)}
                </div>
              )}
            </div>

            <button className="button" type="button" onClick={handleRequestPayout}>
              Request Payout
              <CreditCard size={16} />
            </button>
          </div>
        )}

        <div className="panel">
          <div className="panel-title-row">
            <div>
              <h2>{isCustomer ? 'My Digital Library' : isSeller ? 'Recent Buyer Access' : 'Digital Delivery'}</h2>
              {isCustomer && <p>{filteredLibraryOrders.length} records in the current view.</p>}
            </div>

            {isCustomer && (
              <button className="button secondary" type="button" onClick={() => setIsLibraryFilterOpen(true)}>
                Filters
                <SlidersHorizontal size={16} />
              </button>
            )}
          </div>

          <div className="mini-list">
            {paymentRows.slice(0, 4).map((order) => (
              <div className="mini-row" key={order.orderId}>
                <div>
                  <strong>{order.productTitle}</strong>
                  <span>
                    {order.referenceNumber || 'No reference'} · {order.paymentMethod}
                  </span>
                </div>
                {renderStatus(order.status)}
              </div>
            ))}

            {paymentRows.length === 0 && <div className="empty-state">No paid downloads match this view.</div>}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title-row">
          <div>
            <h2>{isCustomer ? 'Purchase Records' : isSeller ? 'Payout Records' : 'Payment Records'}</h2>
            {isCustomer && (
              <p>
                Status: {libraryFilters.status === 'all' ? 'All' : libraryFilters.status} | Category:{' '}
                {libraryFilters.category === 'all' ? 'All' : libraryFilters.category}
              </p>
            )}
            {isSeller && <p>Date range: {formatDateRange(sellerDateFilters)}</p>}
          </div>

          {isCustomer && (
            <button className="button secondary" type="button" onClick={() => setIsLibraryFilterOpen(true)}>
              Filter Library
              <SlidersHorizontal size={16} />
            </button>
          )}
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th className="number-cell">Reference</th>
                <th>Customer</th>
                <th>Product</th>
                <th className="money-cell">Total</th>
                <th>Status</th>
                <th className="number-cell">{isSeller ? 'Payout Status' : 'Download Token'}</th>
              </tr>
            </thead>

            <tbody>
              {paymentRows.map((order) => (
                <tr key={order.orderId}>
                  <td className="number-cell">{order.referenceNumber}</td>
                  <td>{order.customerName}</td>
                  <td>{order.productTitle}</td>
                  <td className="money-cell">{formatMoney(order.totalAmount)}</td>
                  <td>{renderStatus(order.status)}</td>
                  <td className="number-cell">
                    {isSeller
                      ? renderStatus(order.status === 'Completed' ? 'Ready for Payout' : 'Pending')
                      : order.downloadToken || 'Pending'}
                  </td>
                </tr>
              ))}

              {paymentRows.length === 0 && (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">No payment records match this view.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    );
  };

  const renderReports = () => {
    const reportRevenue = isSeller ? sellerRevenue : reports?.totalSales || 0;
    const reportProducts = isSeller ? roleProducts.length : reports?.totalProducts || 0;
    const reportSupportLoad = isSeller
      ? roleTickets.filter((ticket) => ticket.status !== 'Closed').length
      : reports?.openTickets || 0;
    const reportCategories = isSeller ? sellerSalesByCategory : reports?.salesByCategory || [];
    const reportTopProducts = isSeller ? sellerTopProducts : reports?.topProducts || [];

    return (
      <div className="module-stack">
        <div className="panel report-export-panel">
          <div>
            <h2>Reports Export</h2>
            <p>Export the current analytics view as a browser-generated PDF.</p>
          </div>

          <button className="button" type="button" onClick={handleExportReportsPdf}>
            Export PDF
            <Download size={16} />
          </button>
        </div>

        {renderSellerDateFilter('Reports Date Filter')}

        <div className="grid-3">
          <div className="panel metric revenue">
            <div>
              <span>Revenue</span>
              <strong className="money-value">{formatMoney(reportRevenue)}</strong>
            </div>
            <BarChart3 className="right-side-icon" size={22} />
          </div>

          <div className="panel metric">
            <div>
              <span>Products</span>
              <strong className="number-value">{reportProducts}</strong>
            </div>
            <Layers className="right-side-icon" size={22} />
          </div>

          <div className="panel metric support">
            <div>
              <span>Support Load</span>
              <strong className="number-value">{reportSupportLoad}</strong>
            </div>
            <LifeBuoy className="right-side-icon" size={22} />
          </div>
        </div>

        <div className="grid-2">
          <div className="panel chart-panel">
            <div className="panel-title-row">
              <div>
                <h2>Sales by Category</h2>
                <p>Graph view of category revenue.</p>
              </div>
              <Layers size={20} />
            </div>

            {renderHorizontalChart(reportCategories, 'sales', 'category', formatMoney)}
          </div>

          <div className="panel chart-panel">
            <div className="panel-title-row">
              <div>
                <h2>Top 5 Best Sell</h2>
                <p>Best-selling products by completed sales.</p>
              </div>
              <BarChart3 size={20} />
            </div>

            {renderHorizontalChart(reportTopProducts.slice(0, 5), 'sales', 'title', formatMoney)}
          </div>
        </div>

        <div className="grid-2">
          <div className="panel">
            <h2>Sales by Category</h2>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className="number-cell">Orders</th>
                    <th className="money-cell">Sales</th>
                  </tr>
                </thead>

                <tbody>
                  {reportCategories.map((item) => (
                    <tr key={item.category}>
                      <td>{item.category}</td>
                      <td className="number-cell">{item.orders}</td>
                      <td className="money-cell">{formatMoney(item.sales)}</td>
                    </tr>
                  ))}

                  {reportCategories.length === 0 && (
                    <tr>
                      <td colSpan="3">
                        <div className="empty-state">No category sales yet.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel">
            <h2>Top Products</h2>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="number-cell">Orders</th>
                    <th className="money-cell">Sales</th>
                  </tr>
                </thead>

                <tbody>
                  {reportTopProducts.slice(0, 5).map((item) => (
                    <tr key={item.productId}>
                      <td>{item.title}</td>
                      <td className="number-cell">{item.orders}</td>
                      <td className="money-cell">{formatMoney(item.sales)}</td>
                    </tr>
                  ))}

                  {reportTopProducts.length === 0 && (
                    <tr>
                      <td colSpan="3">
                        <div className="empty-state">No product sales yet.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
              <th className="number-cell">Products</th>
              <th className="number-cell">Orders</th>
              <th className="number-cell">Tickets</th>
              <th className="number-cell">Joined</th>
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
                  <td>
                    <strong>{fullName}</strong>
                  </td>
                  <td>{email}</td>
                  <td>{accountRole}</td>
                  <td>{renderStatus(isEmailVerified ? 'Verified' : 'Unverified')}</td>
                  <td>{renderStatus(isTwoFactorEnabled ? 'Enabled' : 'Disabled')}</td>
                  <td className="number-cell">{account.productCount || account.ProductCount || 0}</td>
                  <td className="number-cell">{account.orderCount || account.OrderCount || 0}</td>
                  <td className="number-cell">{account.ticketCount || account.TicketCount || 0}</td>
                  <td className="number-cell">{formatDate(account.createdAt || account.CreatedAt)}</td>
                </tr>
              );
            })}

            {users.length === 0 && (
              <tr>
                <td colSpan="9">
                  <div className="empty-state">No users found yet.</div>
                </td>
              </tr>
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
                <strong>Valid ID</strong>
                <span>
                  {validIdRecord
                    ? `${validIdRecord.idType} - ${validIdRecord.fileName}`
                    : 'No valid ID submitted'}
                </span>
              </div>
              {renderStatus(validIdRecord?.status || 'Required')}
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
                <span>
                  {profile.payoutAccountName || 'No account name'}{' '}
                  {profile.payoutAccountNumber ? `- ${profile.payoutAccountNumber}` : ''}
                </span>
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
            <input
              required
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
            />
          </div>

          <div className="field">
            <label>Email</label>
            <input
              required
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
          </div>

          <div className="field">
            <label>Phone</label>
            <input
              value={profile.phoneNumber}
              onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
            />
          </div>

          <div className="field">
            <label>Payout Method</label>
            <select
              value={profile.payoutMethod}
              onChange={(e) => setProfile({ ...profile, payoutMethod: e.target.value })}
            >
              <option value="GCash">GCash</option>
              <option value="Maya">Maya</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>

          <div className="field">
            <label>Payout Account Name</label>
            <input
              value={profile.payoutAccountName}
              onChange={(e) => setProfile({ ...profile, payoutAccountName: e.target.value })}
            />
          </div>

          <div className="field">
            <label>Payout Account Number</label>
            <input
              className="number-input"
              value={profile.payoutAccountNumber}
              onChange={(e) => setProfile({ ...profile, payoutAccountNumber: e.target.value })}
            />
          </div>

          <div className="field checkbox-row">
            <input
              type="checkbox"
              checked={profile.isTwoFactorEnabled}
              onChange={(e) => setProfile({ ...profile, isTwoFactorEnabled: e.target.checked })}
            />
            <label>Enable 2FA flag</label>
          </div>

          <div className="field full">
            <div className="identity-card">
              <div>
                <strong>Valid ID</strong>
                <span>
                  {validIdRecord
                    ? `${validIdRecord.idType} submitted on ${formatDate(validIdRecord.submittedAt)}`
                    : 'Required before profile changes can be saved'}
                </span>
              </div>

              <div className="identity-card-actions">
                {renderStatus(validIdRecord?.status || 'Required')}
                <button className="button secondary" type="button" onClick={openValidIdModal}>
                  {validIdRecord ? 'Update ID' : 'Add Valid ID'}
                  <ShieldCheck size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="field full">
            <label>Bio</label>
            <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
          </div>
        </div>

        <div className="toolbar" style={{ marginTop: 14 }}>
          <button className="button" type="submit">
            Save Profile
            <Save size={16} />
          </button>
        </div>
      </form>
    );
  };

  const renderValidIdModal = () => (
    <DashboardModal
      title="Valid ID"
      subtitle="Submit a government or school ID for profile verification."
      onClose={() => setIsValidIdModalOpen(false)}
    >
      <form onSubmit={handleValidIdSubmit}>
        <div className="form-grid">
          <div className="field">
            <label>ID Type</label>
            <select
              value={validIdForm.idType}
              onChange={(e) => setValidIdForm({ ...validIdForm, idType: e.target.value })}
            >
              <option value="National ID">National ID</option>
              <option value="Driver's License">Driver's License</option>
              <option value="Passport">Passport</option>
              <option value="School ID">School ID</option>
              <option value="UMID">UMID</option>
            </select>
          </div>

          <div className="field">
            <label>ID Number</label>
            <input
              required
              value={validIdForm.idNumber}
              onChange={(e) => setValidIdForm({ ...validIdForm, idNumber: e.target.value })}
            />
          </div>

          <div className="field full">
            <label>ID File</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setValidIdForm({
                ...validIdForm,
                file: e.target.files?.[0] || null,
                fileName: e.target.files?.[0]?.name || validIdForm.fileName,
              })}
            />
            {validIdForm.fileName && <span className="field-note">Selected: {validIdForm.fileName}</span>}
          </div>
        </div>

        <div className="toolbar modal-actions">
          <button className="button" type="submit">
            Submit ID
            <ShieldCheck size={16} />
          </button>
          <button className="button secondary" type="button" onClick={() => setIsValidIdModalOpen(false)}>
            Cancel
          </button>
        </div>
      </form>
    </DashboardModal>
  );

  const renderSupportTicketModal = () => (
    <DashboardModal
      title="Submit Ticket"
      subtitle="Send a product, order, or account concern to support."
      onClose={() => setIsTicketModalOpen(false)}
      size="wide"
    >
      <form onSubmit={handleTicketSubmit}>
        <div className="form-grid">
          <div className="field">
            <label>Product</label>
            <select
              value={ticketForm.productId}
              onChange={(e) => setTicketForm({ ...ticketForm, productId: e.target.value })}
            >
              <option value="">General inquiry</option>
              {(isCustomer ? products : roleProducts).map((product) => (
                <option key={product.productId} value={product.productId}>
                  {product.title}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Order</label>
            <select
              value={ticketForm.orderId}
              onChange={(e) => setTicketForm({ ...ticketForm, orderId: e.target.value })}
            >
              <option value="">No order selected</option>
              {roleOrders.map((order) => (
                <option key={order.orderId} value={order.orderId}>
                  {order.referenceNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Priority</label>
            <select
              value={ticketForm.priority}
              onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
            >
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="field">
            <label>Subject</label>
            <input
              required
              value={ticketForm.subject}
              onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
            />
          </div>

          <div className="field full">
            <label>Message</label>
            <textarea
              required
              value={ticketForm.message}
              onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
            />
          </div>
        </div>

        <div className="toolbar modal-actions">
          <button className="button" type="submit">
            Send Ticket
            <Send size={16} />
          </button>

          <button className="button secondary" type="button" onClick={() => setIsTicketModalOpen(false)}>
            Cancel
          </button>
        </div>
      </form>
    </DashboardModal>
  );

  const renderTicketDetailsModal = () => (
    <DashboardModal
      title="Ticket Details"
      subtitle={activeTicket?.subject}
      onClose={() => setActiveTicket(null)}
    >
      <div className="ticket-detail-stack">
        <div className="mini-row">
          <div>
            <strong>Customer</strong>
            <span>{activeTicket?.customerName || 'Unknown customer'}</span>
          </div>
          {renderStatus(activeTicket?.status)}
        </div>

        <div className="mini-row">
          <div>
            <strong>Product</strong>
            <span>{activeTicket?.productTitle || 'General inquiry'}</span>
          </div>
          <span className="status-pill">{activeTicket?.priority || 'Normal'}</span>
        </div>

        <div className="mini-row">
          <div>
            <strong>Reference</strong>
            <span>{activeTicket?.referenceNumber || 'No order linked'}</span>
          </div>
          <span>{formatDate(activeTicket?.updatedAt)}</span>
        </div>

        <div className="ticket-message-box">
          <strong>Message</strong>
          <p>{activeTicket?.message || 'No message provided.'}</p>
        </div>

        {isSeller && (
          <div className="toolbar modal-actions">
            {['Open', 'In Review', 'Closed'].map((status) => (
              <button
                className={activeTicket?.status === status ? 'button' : 'button secondary'}
                key={status}
                type="button"
                onClick={async () => {
                  await handleTicketStatus(activeTicket, status);
                  setActiveTicket({ ...activeTicket, status, updatedAt: new Date().toISOString() });
                }}
              >
                {status}
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardModal>
  );

  const renderChatboxMessenger = () => (
    <aside className={`chatbox-shell ${isChatOpen ? 'open' : ''}`} aria-label="CoreK Messenger">
      {isChatOpen && (
        <div className="chatbox-panel">
          <div className="chatbox-header">
            <div>
              <strong>{isSeller ? 'Buyer Messenger' : 'Seller Messenger'}</strong>
              <span>{isSeller ? 'Customer questions' : 'Product and order chat'}</span>
            </div>

            <button className="modal-close-button" type="button" onClick={() => setIsChatOpen(false)}>
              <X size={16} />
            </button>
          </div>

          <div className="chatbox-messages">
            {chatMessages.map((message) => (
              <div
                className={`chat-message ${message.sender === displayName ? 'mine' : ''}`}
                key={message.id}
              >
                <span>{message.sender}</span>
                <p>{message.text}</p>
                <small>{formatDate(message.createdAt)}</small>
              </div>
            ))}
          </div>

          <form className="chatbox-form" onSubmit={handleSendChatMessage}>
            <input
              value={chatDraft}
              onChange={(event) => setChatDraft(event.target.value)}
              placeholder="Write a message"
            />
            <button className="button icon-only-button" type="submit" aria-label="Send message">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <button className="chatbox-toggle" type="button" onClick={() => setIsChatOpen((value) => !value)}>
        <MessageCircle size={20} />
        <span>Chat</span>
      </button>
    </aside>
  );

  const renderSupport = () => (
    <div className="module-stack">
      <div className={isAdmin ? 'module-stack' : 'grid-2'}>
        {!isAdmin && (
          <div className="panel support-command-panel">
            <div>
              <h2>Support Center</h2>
              <p>Create a ticket and keep your queue visible while you work.</p>
            </div>

            <button className="button" type="button" onClick={() => setIsTicketModalOpen(true)}>
              New Ticket
              <Send size={16} />
            </button>
          </div>
        )}

        <div className="panel">
          <h2>{isAdmin ? 'Support Queue' : isSeller ? 'Buyer Support Queue' : 'My Tickets'}</h2>

          <div className="mini-list">
            {roleTickets.slice(0, 5).map((ticket) => (
              <div className="mini-row" key={ticket.supportTicketId}>
                <div>
                  <strong>{ticket.subject}</strong>
                  <span>
                    {ticket.customerName} · {ticket.priority}
                  </span>
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
                <th className="number-cell">Updated</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {roleTickets.map((ticket) => (
                <tr key={ticket.supportTicketId}>
                  <td>
                    <strong>{ticket.subject}</strong>
                  </td>
                  <td>{ticket.customerName}</td>
                  <td>{ticket.productTitle || 'General'}</td>
                  <td>{ticket.priority}</td>
                  <td>
                    {isCustomer || isAdmin ? (
                      renderStatus(ticket.status)
                    ) : (
                      <select value={ticket.status} onChange={(e) => handleTicketStatus(ticket, e.target.value)}>
                        <option value="Open">Open</option>
                        <option value="In Review">In Review</option>
                        <option value="Closed">Closed</option>
                      </select>
                  )}
                  </td>
                  <td className="number-cell">{formatDate(ticket.updatedAt)}</td>
                  <td className="actions">
                    <button className="button secondary" type="button" onClick={() => setActiveTicket(ticket)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}

              {roleTickets.length === 0 && (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">No support tickets yet.</div>
                  </td>
                </tr>
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
      categories: [
        'Category Directory',
        'View category counts across software and tech, business and finance, 3D assets, design assets, courses, productivity, and entertainment.',
      ],
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
      case 'users':
        return renderUsers();
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
          <span className="role-label-clean">
            {normalizedRole} - User #{userId}
          </span>
          <span className="role-label">
            {normalizedRole} · User #{userId}
          </span>
          <span>
            {role} · User #{userId}
          </span>
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
                <span className="dashboard-tab-label">{module.label}</span>
                <Icon className="dashboard-tab-icon" size={17} />
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="dashboard-content">
        <div className="module-header">
          <div>
            <h1>{activeCopy[0]}</h1>
            <p>{activeCopy[1]}</p>
          </div>
        </div>

        {notice && <div className="notice">{notice}</div>}
        {error && <div className="notice error">{error}</div>}

        <div style={{ marginTop: notice || error ? 16 : 0 }}>{renderActiveModule()}</div>
      </main>

      {isProductModalOpen && renderProductListingModal()}
      {isTicketModalOpen && renderSupportTicketModal()}
      {activeTicket && renderTicketDetailsModal()}
      {isValidIdModalOpen && renderValidIdModal()}
      {isLibraryFilterOpen && renderLibraryFilterModal()}
      {(isSeller || isCustomer) && renderChatboxMessenger()}
    </div>
  );
}
