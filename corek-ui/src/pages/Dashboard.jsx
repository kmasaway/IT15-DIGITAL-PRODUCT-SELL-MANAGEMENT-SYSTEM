import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Archive,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  CreditCard,
  Download,
  Eye,
  KeyRound,
  LayoutDashboard,
  Layers,
  LifeBuoy,
  LogOut,
  MessageCircle,
  Package,
  Plus,
  QrCode,
  Save,
  Search,
  Send,
  SlidersHorizontal,
  Tags,
  UploadCloud,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { API_BASE_URL, api } from '../services/api';
import './Dashboard.css';

const MARKETPLACE_PAGE_SIZE = 20;
const API_ASSET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/i, '');
const PAYOUT_QR_SIZE = 21;

const emptyProductForm = {
  productId: null,
  title: '',
  description: '',
  price: '',
  quantity: '100',
  categoryId: '',
  isActive: true,
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
  filePreviewUrl: '',
  file: null,
};

const emptyPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const defaultSubscriptionSettings = {
  plan: 'Starter',
  billingCycle: 'Monthly',
  billingEmail: '',
  seats: '1',
  autoRenew: false,
};

const subscriptionPlanOptions = [
  {
    plan: 'Starter',
    price: 'Free',
    seats: 1,
    description: 'Default access for every new seller account.',
    features: ['List products', 'Receive customer tickets', 'Request payouts'],
  },
  {
    plan: 'Professional',
    price: 'PHP 499 / month',
    seats: 3,
    description: 'For sellers who need more workspace capacity.',
    features: ['More workspace seats', 'Auto-renew billing', 'Priority seller tools'],
  },
  {
    plan: 'Enterprise',
    price: 'PHP 1,499 / month',
    seats: 10,
    description: 'For larger seller teams managing many listings.',
    features: ['Expanded team access', 'Advanced seller controls', 'Premium support lane'],
  },
];

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
    moduleLabels: { profile: 'Account Settings' },
  },
  Seller: {
    className: 'role-seller',
    modules: ['overview', 'products', 'payments', 'reports', 'support', 'profile'],
    moduleLabels: { products: 'Listings', payments: 'Payouts', profile: 'Settings' },
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

function isCategoryArchived(category) {
  return Boolean(category?.isArchived ?? category?.IsArchived);
}

function getMarketplaceAccent(index) {
  const accents = ['#eaf7f2', '#edf4ff', '#f5f1ff', '#fff4e8', '#eef8f6', '#f7f2ec', '#f0f7ee'];
  return accents[index % accents.length];
}

function getProductApprovalStatus(product) {
  return product.approvalStatus
    || product.ApprovalStatus
    || (product.reviewRemarks || product.ReviewRemarks
      ? 'Rejected'
      : product.isActive
        ? 'Approved'
        : 'Pending Review');
}

function getProductReviewRemarks(product) {
  return product.reviewRemarks || product.ReviewRemarks || '';
}

function getProductQuantity(product) {
  return Number(product?.quantity ?? product?.Quantity ?? 0);
}

function getOrderQuantity(order) {
  return Number(order?.quantity ?? order?.Quantity ?? 1) || 1;
}

function formatFileCount(value) {
  return `${Number(value || 0)} file(s)`;
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

function isImageFile(file) {
  return Boolean(file?.type?.startsWith('image/'));
}

function normalizePriceInput(value) {
  const sanitizedValue = String(value ?? '').replace(/[^\d.]/g, '');
  const [wholePart, ...decimalParts] = sanitizedValue.split('.');
  const trimmedWholePart = wholePart.replace(/^0+(?=\d)/, '');
  const normalizedWholePart = sanitizedValue.startsWith('.') ? '0' : trimmedWholePart;
  const decimalPart = decimalParts.join('').slice(0, 2);

  return decimalParts.length > 0 ? `${normalizedWholePart}.${decimalPart}` : normalizedWholePart;
}

function normalizeWholeNumberInput(value, maxLength = 6) {
  return String(value ?? '').replace(/\D/g, '').slice(0, maxLength);
}

function normalizePhilippinePhoneInput(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, 11);
}

function buildDailySalesTrend(orderRows) {
  const salesByDate = new Map();

  orderRows.forEach((order) => {
    const orderDate = new Date(order.createdAt);
    if (Number.isNaN(orderDate.getTime())) return;

    const key = orderDate.toISOString().slice(0, 10);
    const existing = salesByDate.get(key) || {
      key,
      label: new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' }).format(orderDate),
      orders: 0,
      percentage: 0,
      sales: 0,
    };

    existing.orders += 1;
    existing.sales += Number(order.totalAmount || 0);
    salesByDate.set(key, existing);
  });

  const points = Array.from(salesByDate.values()).sort((first, second) => first.key.localeCompare(second.key));
  const totalSales = points.reduce((sum, point) => sum + point.sales, 0);

  return points.map((point) => ({
    ...point,
    percentage: totalSales > 0 ? (point.sales / totalSales) * 100 : 0,
  }));
}

function isPhilippinePhoneNumber(value) {
  const phoneNumber = String(value || '').trim();
  return !phoneNumber || /^09\d{9}$/.test(phoneNumber);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    if (!isImageFile(file)) {
      resolve('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function getValidPrice(value) {
  const price = Number(normalizePriceInput(value));
  return Number.isFinite(price) && price > 0 ? price : null;
}

function normalizeValidIdRecord(record) {
  if (!record) return null;

  const fileUrl = record.fileUrl || record.FileUrl || '';
  const assetUrl = getAssetUrl(fileUrl);
  const previewCandidate = record.filePreviewUrl || record.FilePreviewUrl || assetUrl;

  return {
    validIdSubmissionId: record.validIdSubmissionId || record.ValidIdSubmissionId,
    userId: record.userId || record.UserId,
    fullName: record.fullName || record.FullName || '',
    email: record.email || record.Email || '',
    idType: record.idType || record.IdType || '',
    idNumber: record.idNumber || record.IdNumber || '',
    fileName: record.fileName || record.FileName || '',
    fileUrl,
    filePreviewUrl: isImageSource(previewCandidate) ? previewCandidate : '',
    status: record.status || record.Status || 'Pending Review',
    remarks: record.remarks || record.Remarks || '',
    submittedAt: record.submittedAt || record.SubmittedAt,
    reviewedAt: record.reviewedAt || record.ReviewedAt,
  };
}

function normalizeSubscriptionSettings(record, fallbackEmail = '') {
  return {
    plan: record?.plan || record?.Plan || defaultSubscriptionSettings.plan,
    billingCycle: record?.billingCycle || record?.BillingCycle || defaultSubscriptionSettings.billingCycle,
    billingEmail: record?.billingEmail || record?.BillingEmail || fallbackEmail,
    seats: String(record?.seats || record?.Seats || defaultSubscriptionSettings.seats),
    autoRenew: record?.autoRenew ?? record?.AutoRenew ?? defaultSubscriptionSettings.autoRenew,
    updatedAt: record?.updatedAt || record?.UpdatedAt || '',
  };
}

function getAssetUrl(source) {
  if (!source) return '';

  const normalizedSource = String(source).trim().replaceAll('\\', '/');
  if (!normalizedSource) return '';
  if (/^(https?:|data:|blob:)/i.test(normalizedSource)) return normalizedSource;

  const uploadsIndex = normalizedSource.toLowerCase().lastIndexOf('/uploads/');
  if (uploadsIndex >= 0) {
    return `${API_ASSET_BASE_URL}${normalizedSource.slice(uploadsIndex)}`;
  }

  if (/^[a-z]:\//i.test(normalizedSource)) {
    const fileName = normalizedSource.split('/').pop();
    return fileName ? `${API_ASSET_BASE_URL}/uploads/${encodeURIComponent(fileName)}` : '';
  }

  return normalizedSource.startsWith('/')
    ? `${API_ASSET_BASE_URL}${normalizedSource}`
    : `${API_ASSET_BASE_URL}/${normalizedSource}`;
}

function isImageSource(source) {
  const value = String(source || '').trim();
  return /^data:image\//i.test(value)
    || /\.(apng|avif|bmp|gif|jpe?g|png|svg|webp)([#?].*)?$/i.test(value);
}

function getProductImageSource(product) {
  const directSource =
    product.thumbnailUrl
      || product.ThumbnailUrl
      || product.coverPhotoUrl
      || product.CoverPhotoUrl
      || product.imageUrl
      || product.ImageUrl;

  if (directSource && isImageSource(directSource)) {
    return getAssetUrl(directSource);
  }

  const topLevelFileSource = [
    product.fileUrl,
    product.FileUrl,
    product.secureFilePath,
    product.SecureFilePath,
    product.filePath,
    product.FilePath,
  ]
    .find(isImageSource);

  if (topLevelFileSource) {
    return getAssetUrl(topLevelFileSource);
  }

  const versions = product.versions || product.Versions || [];
  const versionFileSource = versions
    .map((version) => version.thumbnailUrl
      || version.ThumbnailUrl
      || version.coverPhotoUrl
      || version.CoverPhotoUrl
      || version.imageUrl
      || version.ImageUrl
      || version.fileUrl
      || version.FileUrl
      || version.secureFilePath
      || version.SecureFilePath
      || version.filePath
      || version.FilePath)
    .find(isImageSource);

  return getAssetUrl(versionFileSource);
}

function getProductSellerDetails(product) {
  const sellerName = product.sellerName || product.SellerName || '';
  const sellerPhoneNumber = product.sellerPhoneNumber || product.SellerPhoneNumber || '';
  const sellerProfileName = product.sellerProfileName || product.SellerProfileName || sellerName;

  return {
    contactNo: sellerPhoneNumber || '',
    profileName: sellerProfileName || 'CoreK Seller',
  };
}

function getOrderSellerName(order) {
  return order.sellerName
    || order.SellerName
    || order.sellerProfileName
    || order.SellerProfileName
    || 'CoreK Seller';
}

function getPayoutId(request) {
  return request.payoutRequestId || request.PayoutRequestId;
}

function getPayoutSellerName(request) {
  return request.sellerName
    || request.SellerName
    || 'CoreK Seller';
}

function getPayoutStatus(request) {
  return request.status || request.Status || 'Pending Review';
}

function getPayoutAmount(request) {
  return request.amount ?? request.Amount ?? 0;
}

function getPayoutRemarks(request) {
  return request.reviewRemarks || request.ReviewRemarks || '';
}

function getTicketId(ticket) {
  return ticket.supportTicketId || ticket.SupportTicketId;
}

function getTicketRequesterRole(ticket) {
  return ticket.requesterRole || ticket.RequesterRole || 'Customer';
}

function getTicketRemarks(ticket) {
  return ticket.reviewRemarks || ticket.ReviewRemarks || '';
}

function getPayoutDateRange(request) {
  const rangeStart = request.rangeStart || request.RangeStart;
  const rangeEnd = request.rangeEnd || request.RangeEnd;

  return formatDateRange({
    start: rangeStart ? String(rangeStart).slice(0, 10) : '',
    end: rangeEnd ? String(rangeEnd).slice(0, 10) : '',
  });
}

function getPayoutQrCells(value) {
  const seed = String(value || 'CoreK payout');
  const matrix = Array.from({ length: PAYOUT_QR_SIZE }, () => Array(PAYOUT_QR_SIZE).fill(false));
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  const drawFinder = (top, left) => {
    for (let row = 0; row < 7; row += 1) {
      for (let column = 0; column < 7; column += 1) {
        const isBorder = row === 0 || row === 6 || column === 0 || column === 6;
        const isCenter = row >= 2 && row <= 4 && column >= 2 && column <= 4;
        matrix[top + row][left + column] = isBorder || isCenter;
      }
    }
  };

  const isReserved = (row, column) => (
    (row <= 7 && column <= 7) ||
    (row <= 7 && column >= PAYOUT_QR_SIZE - 8) ||
    (row >= PAYOUT_QR_SIZE - 8 && column <= 7) ||
    row === 6 ||
    column === 6
  );

  drawFinder(0, 0);
  drawFinder(0, PAYOUT_QR_SIZE - 7);
  drawFinder(PAYOUT_QR_SIZE - 7, 0);

  for (let index = 8; index < PAYOUT_QR_SIZE - 8; index += 1) {
    matrix[6][index] = index % 2 === 0;
    matrix[index][6] = index % 2 === 0;
  }

  for (let row = 0; row < PAYOUT_QR_SIZE; row += 1) {
    for (let column = 0; column < PAYOUT_QR_SIZE; column += 1) {
      if (isReserved(row, column)) continue;

      hash = Math.imul(hash ^ ((row + 1) * 31 + column + 1), 1103515245) + 12345;
      matrix[row][column] = (hash & 3) !== 0;
    }
  }

  return matrix.flat();
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

export default function Dashboard({ user, userSessionName, activeModule: controlledActiveModule, onActiveModuleChange, onLogout }) {
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
  const firstName = displayName.split(/\s+/).filter(Boolean)[0] || displayName;

  const [internalActiveModule, setInternalActiveModule] = useState('overview');
  const activeModule = controlledActiveModule || internalActiveModule;
  const setActiveModule = useCallback((nextModule) => {
    if (onActiveModuleChange) {
      onActiveModuleChange(nextModule);
      return;
    }

    setInternalActiveModule(nextModule);
  }, [onActiveModuleChange]);
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
  });
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [versionForm, setVersionForm] = useState(emptyVersionForm);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [ticketForm, setTicketForm] = useState(emptyTicketForm);
  const [checkoutForm, setCheckoutForm] = useState({
    productId: '',
    quantity: '1',
    paymentMethod: 'GCash',
  });
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [activeProductView, setActiveProductView] = useState(null);
  const [productModalMode, setProductModalMode] = useState('details');
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [isValidIdModalOpen, setIsValidIdModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [validIdRecord, setValidIdRecord] = useState(null);
  const [validIdForm, setValidIdForm] = useState(emptyValidIdForm);
  const [validIdReviewRecords, setValidIdReviewRecords] = useState([]);
  const [activeValidIdDetails, setActiveValidIdDetails] = useState(null);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [subscriptionSettings, setSubscriptionSettings] = useState(() => ({
    ...defaultSubscriptionSettings,
    billingEmail: activeUser.email || activeUser.Email || '',
  }));
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [activeSubscriptionAccount, setActiveSubscriptionAccount] = useState(null);
  const [adminSubscriptionSettings, setAdminSubscriptionSettings] = useState(defaultSubscriptionSettings);
  const [isLibraryFilterOpen, setIsLibraryFilterOpen] = useState(false);
  const [libraryFilters, setLibraryFilters] = useState({
    start: '',
    end: '',
  });
  const [sellerDateFilters, setSellerDateFilters] = useState({
    start: '',
    end: '',
  });
  const [payoutDateFilters, setPayoutDateFilters] = useState({
    start: '',
    end: '',
  });
  const [paymentsTableTab, setPaymentsTableTab] = useState('records');
  const [profileSettingsTab, setProfileSettingsTab] = useState('account');
  const [sellerDashboardTab, setSellerDashboardTab] = useState('salesGraph');
  const [sellerAnalyticsTab, setSellerAnalyticsTab] = useState('topProducts');
  const [activeSalesTrendKey, setActiveSalesTrendKey] = useState('');
  const [activeAdminSalesTrendKey, setActiveAdminSalesTrendKey] = useState('');
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [isPayoutSubmitting, setIsPayoutSubmitting] = useState(false);
  const [isPayoutQrVisible, setIsPayoutQrVisible] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatDraft, setChatDraft] = useState('');
  const [chatThreads, setChatThreads] = useState([]);
  const [activeChatThreadId, setActiveChatThreadId] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [marketplaceCategory, setMarketplaceCategory] = useState('all');
  const [marketplaceSort, setMarketplaceSort] = useState('featured');
  const [marketplacePage, setMarketplacePage] = useState(1);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [notificationModal, setNotificationModal] = useState(null);
  const [confirmationRequest, setConfirmationRequest] = useState(null);
  const [reasonRequest, setReasonRequest] = useState(null);
  const [, setIsLoading] = useState(false);
  const productImagePreviewUrl = useMemo(
    () => (isImageFile(productForm.coverPhotoFile) ? URL.createObjectURL(productForm.coverPhotoFile) : ''),
    [productForm.coverPhotoFile]
  );
  const versionFilePreviewUrl = useMemo(
    () => (isImageFile(versionForm.file) ? URL.createObjectURL(versionForm.file) : ''),
    [versionForm.file]
  );

  const selectedCheckoutProduct = useMemo(
    () => products.find((product) => String(product.productId) === String(checkoutForm.productId)),
    [checkoutForm.productId, products]
  );

  const activeChatThread = useMemo(
    () => chatThreads.find((thread) => thread.threadId === activeChatThreadId) || null,
    [activeChatThreadId, chatThreads]
  );

  const roleProducts = useMemo(() => {
    if (!isSeller) return products;
    return products;
  }, [isSeller, products]);

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
    if (isAdmin) {
      return tickets.filter((ticket) => getTicketRequesterRole(ticket) === 'Seller');
    }

    if (!isSeller) return tickets;

    const sellerProductIds = new Set(roleProducts.map((product) => Number(product.productId)));
    return tickets.filter((ticket) => (
      Number(ticket.customerId || ticket.CustomerId) === Number(userId)
      || (ticket.productId && sellerProductIds.has(Number(ticket.productId)))
    ));
  }, [isAdmin, isSeller, roleProducts, tickets, userId]);

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

  const latestPayoutRequest = useMemo(
    () => payoutRequests[0] || null,
    [payoutRequests]
  );

  const filteredPayoutRequests = useMemo(
    () => payoutRequests.filter((request) => isWithinDateRange(request.requestedAt || request.RequestedAt, payoutDateFilters)),
    [payoutDateFilters, payoutRequests]
  );

  const sellerSalesTrend = useMemo(
    () => buildDailySalesTrend(completedRoleOrders),
    [completedRoleOrders]
  );

  const activeSalesTrendPoint = useMemo(
    () => sellerSalesTrend.find((point) => point.key === activeSalesTrendKey)
      || sellerSalesTrend.find((point) => point.sales > 0)
      || sellerSalesTrend[0]
      || null,
    [activeSalesTrendKey, sellerSalesTrend]
  );

  const adminSalesTrend = useMemo(
    () => buildDailySalesTrend(orders.filter((order) => String(order.status || '').toLowerCase() === 'completed')),
    [orders]
  );

  const activeAdminSalesTrendPoint = useMemo(
    () => adminSalesTrend.find((point) => point.key === activeAdminSalesTrendKey)
      || adminSalesTrend.find((point) => point.sales > 0)
      || adminSalesTrend[0]
      || null,
    [activeAdminSalesTrendKey, adminSalesTrend]
  );

  const filteredLibraryOrders = useMemo(() => {
    if (isSeller) return dateFilteredRoleOrders;
    if (!isCustomer) return roleOrders;

    return roleOrders.filter((order) => isWithinDateRange(order.createdAt, libraryFilters));
  }, [dateFilteredRoleOrders, isCustomer, isSeller, libraryFilters, roleOrders]);

  const marketplaceCategoryOptions = useMemo(() => {
    const activeCategories = categories.filter((category) => !isCategoryArchived(category));
    const categoryOptions = activeCategories.length
      ? activeCategories.map((category) => ({
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
      const dashboardRequests = [
        {
          key: 'products',
          fallback: [],
          request: () => (isSeller ? api.getSellerProducts(userId) : api.getProducts(searchTerm)),
        },
        { key: 'categories', fallback: [], request: () => api.getCategories() },
        { key: 'orders', fallback: [], request: () => api.getOrders(role === 'Customer' ? userId : undefined) },
        { key: 'reports', fallback: null, request: () => api.getReports() },
        { key: 'tickets', fallback: [], request: () => api.getTickets(role === 'Customer' ? userId : undefined) },
        {
          key: 'profile',
          fallback: {
            fullName: displayName,
            email: activeUser.email || activeUser.Email || '',
            phoneNumber: '',
            bio: '',
            payoutMethod: 'GCash',
            payoutAccountName: displayName,
            payoutAccountNumber: '',
          },
          request: () => api.getProfile(userId),
        },
        { key: 'users', fallback: [], request: () => (isAdmin ? api.getUsers() : Promise.resolve([])) },
        {
          key: 'payouts',
          fallback: [],
          request: () => (isAdmin || isSeller ? api.getPayoutRequests(isSeller ? userId : undefined) : Promise.resolve([])),
        },
        { key: 'validId', fallback: null, request: () => (!isAdmin ? api.getValidId(userId) : Promise.resolve(null)) },
        { key: 'validIdReview', fallback: [], request: () => (isAdmin ? api.getValidIds() : Promise.resolve([])) },
        { key: 'subscription', fallback: null, request: () => (isSeller ? api.getSubscription(userId) : Promise.resolve(null)) },
      ];

      const settledResults = await Promise.allSettled(
        dashboardRequests.map((item) => item.request())
      );
      const dashboardData = {};
      const failedRequests = [];

      settledResults.forEach((result, index) => {
        const request = dashboardRequests[index];

        if (result.status === 'fulfilled') {
          dashboardData[request.key] = result.value ?? request.fallback;
          return;
        }

        dashboardData[request.key] = request.fallback;
        failedRequests.push({
          key: request.key,
          message: result.reason?.message || 'Request failed',
        });
      });

      if (failedRequests.length > 0) {
        console.warn('Dashboard data loaded with partial failures:', failedRequests);
      }

      const productData = dashboardData.products;
      const categoryData = dashboardData.categories;
      const orderData = dashboardData.orders;
      const reportData = dashboardData.reports;
      const ticketData = dashboardData.tickets;
      const profileData = dashboardData.profile;
      const userData = dashboardData.users;
      const payoutData = dashboardData.payouts;
      const validIdData = dashboardData.validId;
      const validIdReviewData = dashboardData.validIdReview;
      const subscriptionData = dashboardData.subscription;

      setProducts(productData || []);
      setCategories(categoryData || []);
      setOrders(orderData || []);
      setReports(reportData || null);
      setTickets(ticketData || []);
      setUsers(userData || []);
      setPayoutRequests(payoutData || []);
      setValidIdRecord(normalizeValidIdRecord(validIdData));
      setValidIdReviewRecords((validIdReviewData || []).map(normalizeValidIdRecord).filter(Boolean));
      if (isSeller) {
        setSubscriptionSettings(normalizeSubscriptionSettings(subscriptionData, profileData.email || activeUser.email || activeUser.Email || ''));
      }
      setProfile({
        fullName: profileData.fullName || displayName,
        email: profileData.email || '',
        phoneNumber: profileData.phoneNumber || '',
        bio: profileData.bio || '',
        payoutMethod: profileData.payoutMethod || 'GCash',
        payoutAccountName: profileData.payoutAccountName || profileData.fullName || displayName,
        payoutAccountNumber: profileData.payoutAccountNumber || '',
      });
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }, [activeUser.Email, activeUser.email, displayName, isAdmin, isSeller, role, searchTerm, userId]);

  useEffect(() => {
    const dashboardLoadTimer = window.setTimeout(() => {
      loadDashboard();
    }, 0);

    return () => window.clearTimeout(dashboardLoadTimer);
  }, [loadDashboard]);

  useEffect(() => {
    if (!isSeller && !isCustomer) return;

    let isCancelled = false;

    api.getChatThreads()
      .then((threads) => {
        if (isCancelled) return;

        const nextThreads = threads || [];
        setChatThreads(nextThreads);
        setActiveChatThreadId((currentThreadId) => (
          nextThreads.some((thread) => thread.threadId === currentThreadId)
            ? currentThreadId
            : nextThreads[0]?.threadId || ''
        ));
      })
      .catch(() => {
        if (isCancelled) return;
        setChatThreads([]);
        setActiveChatThreadId('');
        setChatMessages([]);
      });

    return () => {
      isCancelled = true;
    };
  }, [isCustomer, isSeller, userId]);

  useEffect(() => {
    if (!activeChatThread) {
      let isCancelled = false;

      queueMicrotask(() => {
        if (!isCancelled) setChatMessages([]);
      });

      return () => {
        isCancelled = true;
      };
    }

    let isCancelled = false;

    queueMicrotask(() => {
      if (!isCancelled) setIsChatLoading(true);
    });

    api.getChatMessages(activeChatThread.sellerId, activeChatThread.customerId)
      .then((messages) => {
        if (isCancelled) return;
        setChatMessages(messages || []);
      })
      .catch(() => {
        if (isCancelled) return;
        setChatMessages([]);
      })
      .finally(() => {
        if (!isCancelled) setIsChatLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [activeChatThread]);

  useEffect(() => () => {
    if (productImagePreviewUrl) URL.revokeObjectURL(productImagePreviewUrl);
  }, [productImagePreviewUrl]);

  useEffect(() => () => {
    if (versionFilePreviewUrl) URL.revokeObjectURL(versionFilePreviewUrl);
  }, [versionFilePreviewUrl]);

  const refreshValidIdReviewRecords = useCallback(async () => {
    if (!isAdmin) return;

    const records = await api.getValidIds();
    setValidIdReviewRecords((records || []).map(normalizeValidIdRecord).filter(Boolean));
  }, [isAdmin]);

  const showNotice = (message, detail = '') => {
    setNotice('');
    setError('');
    setNotificationModal({
      tone: 'success',
      title: message,
      message: detail || message,
    });
  };

  const showError = (message) => {
    setError('');
    setNotice('');
    setNotificationModal({
      tone: 'error',
      title: 'Entry Error',
      message: message || 'Please check the form and try again.',
    });
  };

  const requestConfirmation = useCallback((options) => (
    new Promise((resolve) => {
      setConfirmationRequest({
        title: options.title || 'Confirm Action',
        message: options.message || 'Please confirm before continuing.',
        confirmLabel: options.confirmLabel || 'Confirm',
        cancelLabel: options.cancelLabel || 'Cancel',
        tone: options.tone || 'default',
        resolve,
      });
    })
  ), []);

  const requestReason = useCallback((options) => (
    new Promise((resolve) => {
      setReasonRequest({
        title: options.title || 'Add Remarks',
        message: options.message || 'Add a reason before continuing.',
        label: options.label || 'Remarks',
        confirmLabel: options.confirmLabel || 'Continue',
        tone: options.tone || 'default',
        value: '',
        resolve,
      });
    })
  ), []);

  const closeConfirmation = (confirmed) => {
    confirmationRequest?.resolve(confirmed);
    setConfirmationRequest(null);
  };

  const closeReason = (confirmed) => {
    const value = reasonRequest?.value?.trim() || '';
    reasonRequest?.resolve(confirmed ? value : null);
    setReasonRequest(null);
  };

  const resetSellerDateFilters = () => {
    setSellerDateFilters({ start: '', end: '' });
  };

  const resetPayoutDateFilters = () => {
    setPayoutDateFilters({ start: '', end: '' });
  };

  const handleRequestPayout = async () => {
    if (!profile.payoutAccountName || !profile.payoutAccountNumber) {
      showError('Complete your payout account details before requesting a payout.');
      return;
    }

    if (sellerRevenue <= 0) {
      showError('No completed sales are available for payout in the selected date range.');
      return;
    }

    setIsPayoutSubmitting(true);

    try {
      const result = await api.requestPayout({
        startDate: sellerDateFilters.start || null,
        endDate: sellerDateFilters.end || null,
      });
      const savedPayout = result.payout || result;

      setPayoutRequests((currentRequests) => [
        savedPayout,
        ...currentRequests.filter((request) => request.payoutRequestId !== savedPayout.payoutRequestId),
      ]);
      showNotice(result.message || 'Payout request submitted for admin processing.');
    } catch (err) {
      showError(err.message || 'Unable to request payout.');
    } finally {
      setIsPayoutSubmitting(false);
    }
  };

  const handlePayoutStatus = async (payoutRequest, status) => {
    const payoutRequestId = getPayoutId(payoutRequest);
    if (!payoutRequestId) {
      showError('Payout request details are incomplete.');
      return;
    }

    const currentStatus = getPayoutStatus(payoutRequest);
    if (['Approved', 'Rejected'].includes(currentStatus) && currentStatus !== status) {
      showError(`${currentStatus} payout requests cannot be changed.`);
      return;
    }

    let remarks = '';
    if (status === 'Rejected') {
      remarks = await requestReason({
        title: 'Reject Payout',
        message: 'Add the reason this payout request cannot be approved.',
        label: 'Rejection reason',
        confirmLabel: 'Continue',
        tone: 'danger',
      });
      if (remarks === null) return;
      if (!remarks) {
        showError('Rejection remarks are required.');
        return;
      }
    }

    const confirmed = await requestConfirmation({
      title: `${status} Payout?`,
      message: `Confirm that this payout request should be marked as ${status}.`,
      confirmLabel: status,
      tone: status === 'Rejected' ? 'danger' : 'default',
    });
    if (!confirmed) return;

    const finalConfirmed = await requestConfirmation({
      title: `Final ${status} Confirmation`,
      message: status === 'Rejected'
        ? 'This will notify the seller that the payout request was rejected.'
        : 'This will approve the payout request for admin processing.',
      confirmLabel: status,
      tone: status === 'Rejected' ? 'danger' : 'default',
    });
    if (!finalConfirmed) return;

    try {
      const result = await api.updatePayoutStatus(payoutRequestId, { status, remarks });
      const savedPayout = result.payout || result;

      setPayoutRequests((currentRequests) => currentRequests.map((request) => (
        String(getPayoutId(request)) === String(payoutRequestId)
          ? { ...request, ...savedPayout }
          : request
      )));
      showNotice(`Payout ${status}`, status === 'Rejected' ? remarks : result.message || 'Payout status updated.');
      await loadDashboard();
    } catch (err) {
      showError(err.message || 'Unable to update payout status.');
    }
  };

  const handleSendChatMessage = async (event) => {
    event.preventDefault();

    const message = chatDraft.trim();
    if (!message) return;
    if (!activeChatThread) {
      showError('No buyer or seller conversation is available yet.');
      return;
    }

    try {
      const savedMessage = await api.sendChatMessage({
        sellerId: activeChatThread.sellerId,
        customerId: activeChatThread.customerId,
        productId: activeChatThread.productId,
        message,
      });

      setChatMessages((currentMessages) => [...currentMessages, savedMessage]);
      setChatDraft('');
      setChatThreads((currentThreads) => currentThreads.map((thread) => (
        thread.threadId === activeChatThread.threadId
          ? { ...thread, lastMessage: savedMessage.text, lastMessageAt: savedMessage.createdAt }
          : thread
      )));
    } catch (err) {
      showError(err.message);
    }
  };

  const handleApproveProduct = async (product) => {
    if (getProductApprovalStatus(product) === 'Approved') return;

    const confirmed = await requestConfirmation({
      title: 'Approve Product?',
      message: 'Confirm that this listing is ready for marketplace buyers.',
      confirmLabel: 'Approve',
    });
    if (!confirmed) return;

    const finalConfirmed = await requestConfirmation({
      title: 'Final Approval',
      message: 'This product will become visible in the marketplace after approval.',
      confirmLabel: 'Approve Product',
    });
    if (!finalConfirmed) return;

    try {
      const result = await api.updateProduct(product.productId, {
        title: product.title,
        description: product.description,
        price: Number(product.price),
        quantity: getProductQuantity(product),
        categoryId: Number(product.categoryId),
        isActive: true,
        approvalStatus: 'Approved',
        reviewRemarks: '',
      });
      showNotice('Product Approved', result.message || 'Product listing approved for the marketplace.');
      await loadDashboard();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleRejectProduct = async (product) => {
    const remarks = await requestReason({
      title: 'Reject Product',
      message: 'Add the reason the seller should see before this product is rejected.',
      label: 'Rejection reason',
      confirmLabel: 'Continue',
      tone: 'danger',
    });
    if (remarks === null) return;

    if (!remarks) {
      showError('Rejection remarks are required.');
      return;
    }

    const confirmed = await requestConfirmation({
      title: 'Reject Product?',
      message: 'Confirm this rejection. The reason will be saved on the listing.',
      confirmLabel: 'Reject',
      tone: 'danger',
    });
    if (!confirmed) return;

    const finalConfirmed = await requestConfirmation({
      title: 'Final Rejection',
      message: 'This product will stay hidden until the seller submits an update.',
      confirmLabel: 'Reject Product',
      tone: 'danger',
    });
    if (!finalConfirmed) return;

    try {
      const result = await api.updateProduct(product.productId, {
        title: product.title,
        description: product.description,
        price: Number(product.price),
        quantity: getProductQuantity(product),
        categoryId: Number(product.categoryId),
        isActive: false,
        approvalStatus: 'Rejected',
        reviewRemarks: remarks,
      });
      showNotice('Product Rejected', result.message || remarks);
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
        quantity: String(getProductQuantity(product)),
        categoryId: product.categoryId,
        isActive: product.isActive,
        coverPhotoFile: null,
      });
    } else {
      setProductForm(emptyProductForm);
    }

    setProductModalMode('details');
    setIsProductModalOpen(true);
  };

  const openProductViewModal = async (product) => {
    if (!product?.productId) {
      setActiveProductView(product);
      return;
    }

    const fallbackVersions = product.versions || product.Versions || [];

    try {
      const productDetails = await api.getProduct(product.productId);
      const detailVersions = productDetails.versions || productDetails.Versions || [];

      setActiveProductView({
        ...product,
        ...productDetails,
        versionCount: productDetails.versionCount
          ?? product.versionCount
          ?? detailVersions.length
          ?? fallbackVersions.length
          ?? 0,
        latestVersion: productDetails.latestVersion
          || product.latestVersion
          || detailVersions[0]?.versionNumber
          || fallbackVersions[0]?.versionNumber
          || '1.0.0',
        thumbnailUrl: productDetails.thumbnailUrl || product.thumbnailUrl,
        coverPhotoUrl: productDetails.coverPhotoUrl || product.coverPhotoUrl,
        quantity: productDetails.quantity ?? productDetails.Quantity ?? product.quantity ?? product.Quantity ?? 0,
        Quantity: productDetails.Quantity ?? productDetails.quantity ?? product.Quantity ?? product.quantity ?? 0,
        sellerName: productDetails.sellerName || product.sellerName,
        SellerName: productDetails.SellerName || product.SellerName,
        sellerPhoneNumber: productDetails.sellerPhoneNumber || product.sellerPhoneNumber,
        SellerPhoneNumber: productDetails.SellerPhoneNumber || product.SellerPhoneNumber,
        sellerProfileName: productDetails.sellerProfileName || product.sellerProfileName,
        SellerProfileName: productDetails.SellerProfileName || product.SellerProfileName,
        versions: detailVersions.length > 0 ? detailVersions : fallbackVersions,
      });
    } catch {
      setActiveProductView(product);
    }
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
    setValidIdForm(validIdRecord ? { ...emptyValidIdForm, ...validIdRecord, file: null } : emptyValidIdForm);
    setIsValidIdModalOpen(true);
  };

  const handleValidIdFileChange = async (event) => {
    const file = event.target.files?.[0] || null;
    const filePreviewUrl = await readFileAsDataUrl(file);

    setValidIdForm({
      ...validIdForm,
      file,
      fileName: file?.name || '',
      filePreviewUrl,
    });
  };

  const clearValidIdFile = () => {
    setValidIdForm({
      ...validIdForm,
      file: null,
      fileName: '',
      filePreviewUrl: '',
    });
  };

  const handleValidIdSubmit = async (event) => {
    event.preventDefault();

    const nextRecord = {
      userId,
      fullName: profile.fullName || displayName,
      email: profile.email,
      idType: validIdForm.idType,
      idNumber: validIdForm.idNumber.trim(),
      fileName: validIdForm.file?.name || validIdForm.fileName,
      filePreviewUrl: validIdForm.filePreviewUrl || validIdRecord?.filePreviewUrl || '',
      status: 'Pending Review',
      submittedAt: new Date().toISOString(),
      remarks: '',
    };

    if (!nextRecord.idNumber || !nextRecord.fileName || !validIdForm.file) {
      showError('Valid ID number and file attachment are required.');
      return;
    }

    const confirmed = await requestConfirmation({
      title: 'Submit Valid ID?',
      message: 'Submit this ID for admin verification. You can still replace it later if needed.',
      confirmLabel: 'Submit ID',
    });
    if (!confirmed) return;

    try {
      const formData = new FormData();
      formData.append('idType', nextRecord.idType);
      formData.append('idNumber', nextRecord.idNumber);
      if (validIdForm.file) {
        formData.append('file', validIdForm.file);
      }

      const result = await api.submitValidId(userId, formData);
      const savedRecord = normalizeValidIdRecord(result.validId || result);
      setValidIdRecord(savedRecord);
      setValidIdForm({ ...emptyValidIdForm, ...savedRecord, file: null });
      await refreshValidIdReviewRecords();
      setIsValidIdModalOpen(false);
      showNotice('ID Submitted', result.message || 'ID Submitted waiting for verification then the admin will check.');
    } catch (err) {
      showError(err.message);
    }
  };

  const handleValidIdDecision = async (record, status) => {
    if (!record?.userId || !record?.validIdSubmissionId) {
      showError('Valid ID submission details are incomplete.');
      return;
    }

    let remarks = '';
    if (status === 'Rejected') {
      remarks = window.prompt('Add rejection remarks')?.trim() || '';
      if (!remarks) {
        showError('Remarks are required when rejecting a valid ID.');
        return;
      }
    }

    const confirmed = await requestConfirmation({
      title: status === 'Verified' ? 'Accept Valid ID?' : 'Reject Valid ID?',
      message: status === 'Verified'
        ? 'Confirm that this valid ID passed admin verification.'
        : 'Confirm this rejection. The remarks will be saved with the ID record.',
      confirmLabel: status === 'Verified' ? 'Accept ID' : 'Reject ID',
      tone: status === 'Rejected' ? 'danger' : 'default',
    });
    if (!confirmed) return;

    try {
      const result = await api.updateValidIdStatus(record.validIdSubmissionId, {
        status,
        remarks,
      });
      const nextRecord = normalizeValidIdRecord(result.validId || result);
      if (Number(nextRecord?.userId) === Number(userId)) {
        setValidIdRecord(nextRecord);
      }
      await refreshValidIdReviewRecords();
      showNotice(result.message || (status === 'Verified' ? 'Valid ID accepted.' : 'Valid ID rejected.'), status === 'Rejected' ? remarks : '');
    } catch (err) {
      showError(err.message);
    }
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

  const renderSellerDateFilter = (title = 'Date Filter', options = {}) => {
    if (!isSeller) return null;

    const className = [
      options.plain ? 'seller-date-filter seller-dashboard-section' : 'panel seller-date-filter',
      options.compact ? 'seller-date-filter-compact' : '',
      options.controlsOnly ? 'seller-date-filter-controls-only' : '',
    ].filter(Boolean).join(' ');

    return (
      <div className={className}>
        {!options.controlsOnly && (
          <div>
            <h2>{title}</h2>
            <p>{formatDateRange(sellerDateFilters)}</p>
          </div>
        )}

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

          {!options.controlsOnly && (
            <button className="button secondary" type="button" onClick={resetSellerDateFilters}>
              Reset
              <CalendarDays size={16} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderSalesTrendChart = (trendPoints, activeKey, setActiveKey, activePoint, emptyMessage) => {
    const hasSales = trendPoints.some((point) => point.sales > 0);
    const maxPercentage = Math.max(...trendPoints.map((point) => point.percentage), 1);
    const formatPercentage = (value) => {
      const roundedValue = Number(value || 0).toFixed(value >= 10 ? 1 : 1);
      return `${roundedValue.replace(/\.0$/, '')}%`;
    };

    if (!hasSales) {
      return <div className="empty-state">{emptyMessage}</div>;
    }

    return (
      <div
        className="sales-trend-chart"
        style={{ '--sales-point-count': Math.max(trendPoints.length, 1) }}
        aria-label="Daily sales graph from completed orders"
      >
        <div className="sales-trend-months" aria-hidden="true">
          {trendPoints.map((point) => <span key={point.key}>{point.label}</span>)}
        </div>

        <div className="sales-trend-plot" role="group" aria-label="Interactive daily sales percentages">
          <div className="sales-trend-grid" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

          {trendPoints.map((point) => {
            const height = point.percentage > 0
              ? Math.max(6, Math.round((point.percentage / maxPercentage) * 100))
              : 0;
            const isActive = activeKey === point.key;

            return (
              <button
                className={`sales-trend-column ${isActive ? 'active' : ''}`}
                key={point.key}
                type="button"
                style={{ '--sales-bar-height': `${height}%` }}
                onMouseEnter={() => setActiveKey(point.key)}
                onFocus={() => setActiveKey(point.key)}
                onClick={() => setActiveKey(point.key)}
                aria-label={`${point.label}: ${formatPercentage(point.percentage)}, ${formatMoney(point.sales)}, ${point.orders} orders`}
              >
                {point.percentage > 0 && <strong>{formatPercentage(point.percentage)}</strong>}
                <span className="sales-trend-bar" />
                <span className="sales-trend-tooltip">
                  <span>{point.label}</span>
                  <b>{formatMoney(point.sales)}</b>
                  <small>{point.orders} orders</small>
                </span>
              </button>
            );
          })}
        </div>

        {activePoint && (
          <div className="sales-trend-inspector" aria-live="polite">
            <span>{activePoint.label}</span>
            <strong>{formatPercentage(activePoint.percentage)}</strong>
            <small>{formatMoney(activePoint.sales)} / {activePoint.orders} orders</small>
          </div>
        )}
      </div>
    );
  };

  const renderSellerSalesTrendChart = () => renderSalesTrendChart(
    sellerSalesTrend,
    activeSalesTrendKey,
    setActiveSalesTrendKey,
    activeSalesTrendPoint,
    'No completed sales in this date range yet.'
  );

  const renderAdminSalesTrendChart = () => renderSalesTrendChart(
    adminSalesTrend,
    activeAdminSalesTrendKey,
    setActiveAdminSalesTrendKey,
    activeAdminSalesTrendPoint,
    'No completed marketplace sales yet.'
  );

  const renderSellerAnalyticsPanel = (options = {}) => (
    <section
      className={options.embedded ? 'seller-analytics-board' : 'panel seller-analytics-board'}
      aria-labelledby="seller-sales-graph-title"
    >
      <div className="seller-analytics-grid">
        <div className="seller-sales-graph">
          <div className="panel-title-row seller-sales-graph-header">
            <div>
              <h2 id="seller-sales-graph-title">Sales Graph</h2>
              <p>Completed Sales</p>
            </div>
            {renderSellerDateFilter('', { plain: true, compact: true, controlsOnly: true })}
          </div>

          {renderSellerSalesTrendChart()}
        </div>

        <div className="seller-analytics-side">
          <div className="seller-analytics-tabs" role="tablist" aria-label="Seller analytics">
            <button
              className={sellerAnalyticsTab === 'topProducts' ? 'active' : ''}
              type="button"
              role="tab"
              aria-selected={sellerAnalyticsTab === 'topProducts'}
              onClick={() => setSellerAnalyticsTab('topProducts')}
            >
              Top 5 Best Sell
            </button>

            <button
              className={sellerAnalyticsTab === 'categorySales' ? 'active' : ''}
              type="button"
              role="tab"
              aria-selected={sellerAnalyticsTab === 'categorySales'}
              onClick={() => setSellerAnalyticsTab('categorySales')}
            >
              Category Sales
            </button>
          </div>

          <div className="seller-analytics-block">
            <div className="panel-title-row">
              <div>
                <h2>{sellerAnalyticsTab === 'topProducts' ? 'Top 5 Best Sell' : 'Category Sales'}</h2>
                <p>
                  {sellerAnalyticsTab === 'topProducts'
                    ? 'Your highest-selling listings by completed orders.'
                    : 'Revenue grouped by digital product category.'}
                </p>
              </div>
              {sellerAnalyticsTab === 'topProducts' ? <BarChart3 size={20} /> : <Layers size={20} />}
            </div>

            {sellerAnalyticsTab === 'topProducts'
              ? renderHorizontalChart(sellerTopProducts, 'sales', 'title', formatMoney)
              : renderHorizontalChart(sellerSalesByCategory, 'sales', 'category', formatMoney)}
          </div>
        </div>
      </div>
    </section>
  );

  const renderSellerRecentOrdersTable = (options = {}) => {
    const recentOrders = dateFilteredRoleOrders.slice(0, 5);
    const className = options.panel
      ? 'panel seller-recent-orders'
      : 'seller-dashboard-section seller-recent-orders';

    return (
      <section className={className}>
        <div className="seller-recent-orders-header">
          <h2>Recent Orders</h2>
          {options.withDateFilter && renderSellerDateFilter('', {
            plain: true,
            compact: true,
            controlsOnly: true,
          })}
        </div>

        <div className="table-wrap">
          <table className="data-table seller-recent-orders-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Requester</th>
                <th>Date</th>
                <th>Status</th>
                <th className="number-cell">Amount</th>
              </tr>
            </thead>

            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.orderId}>
                  <td>
                    <strong>{order.productTitle || order.title}</strong>
                  </td>
                  <td>{order.customerName || 'Customer'}</td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>{renderStatus(order.status || 'Pending')}</td>
                  <td className="number-cell">{formatMoney(order.totalAmount)}</td>
                </tr>
              ))}

              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state">No orders recorded yet.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  const renderSellerDashboardTabs = () => (
    <section className="panel seller-dashboard-tab-shell">
      <div className="seller-dashboard-tabs" role="tablist" aria-label="Seller dashboard views">
        <button
          className={sellerDashboardTab === 'salesGraph' ? 'active' : ''}
          type="button"
          role="tab"
          aria-selected={sellerDashboardTab === 'salesGraph'}
          onClick={() => setSellerDashboardTab('salesGraph')}
        >
          Sales Graph
        </button>

        <button
          className={sellerDashboardTab === 'recentOrders' ? 'active' : ''}
          type="button"
          role="tab"
          aria-selected={sellerDashboardTab === 'recentOrders'}
          onClick={() => setSellerDashboardTab('recentOrders')}
        >
          Recent Orders
        </button>
      </div>

      {sellerDashboardTab === 'salesGraph'
        ? renderSellerAnalyticsPanel({ embedded: true })
        : renderSellerRecentOrdersTable({ withDateFilter: true })}
    </section>
  );

  const handleExportReportsPdf = () => {
    const topProducts = (isSeller ? sellerTopProducts : reports?.topProducts || []).slice(0, 5);
    const categoryRows = isSeller ? sellerSalesByCategory : [];
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
    const categorySection = isSeller
      ? `
          <h2>Sales by Category</h2>
          <table>
            <thead><tr><th>Category</th><th class="number">Orders</th><th class="number">Sales</th></tr></thead>
            <tbody>${categoryTableRows || '<tr><td colspan="3">No category sales yet.</td></tr>'}</tbody>
          </table>
        `
      : '';

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>CoreK Reports</title>
          <style>
            body { color: #0f291e; font-family: Arial, sans-serif; font-size: 17px; margin: 34px; }
            h1 { margin: 0 0 8px; font-size: 40px; }
            h2 { border-bottom: 2px solid #dce9e3; font-size: 24px; margin-top: 34px; padding-bottom: 10px; }
            p { color: #5b7e6e; font-size: 18px; margin: 0; }
            .metrics { display: grid; gap: 12px; grid-template-columns: repeat(3, 1fr); margin: 24px 0; }
            .metric { border: 1px solid #dce9e3; border-radius: 12px; padding: 18px; }
            .metric span { color: #5b7e6e; display: block; font-size: 15px; font-weight: 700; text-transform: uppercase; }
            .metric strong { display: block; font-size: 28px; margin-top: 12px; text-align: right; }
            table { border-collapse: collapse; margin-top: 12px; width: 100%; }
            th, td { border-bottom: 1px solid #dce9e3; font-size: 17px; padding: 13px 12px; text-align: left; }
            th { background: #f4faf7; color: #5b7e6e; font-size: 15px; text-transform: uppercase; }
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

          ${categorySection}

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

    const price = getValidPrice(productForm.price);
    if (price === null) {
      showError('Enter a valid price greater than zero.');
      return;
    }

    const quantity = Number(productForm.quantity || 0);
    if (!Number.isInteger(quantity) || quantity < 0) {
      showError('Enter a valid product quantity.');
      return;
    }

    if (productForm.productId) {
      const confirmed = await requestConfirmation({
        title: 'Save Product?',
        message: 'Confirm that you want to save the listing changes.',
        confirmLabel: 'Save Product',
      });
      if (!confirmed) return;
    }

    try {
      if (productForm.productId) {
        await api.updateProduct(productForm.productId, {
          title: productForm.title,
          description: productForm.description,
          price,
          quantity,
          categoryId: Number(productForm.categoryId),
          isActive: productForm.isActive,
        });
        showNotice('Product listing updated.');
      } else {
        if (!productForm.coverPhotoFile) {
          showError('Attach an image before sending the request.');
          return;
        }

        const formData = new FormData();
        formData.append('title', productForm.title);
        formData.append('description', productForm.description);
        formData.append('price', price.toFixed(2));
        formData.append('quantity', String(quantity));
        formData.append('categoryId', productForm.categoryId);
        formData.append('sellerId', userId);
        formData.append('file', productForm.coverPhotoFile);
        formData.append('coverPhoto', productForm.coverPhotoFile);

        const uploadResult = await api.uploadProduct(formData);
        if (isSeller) {
          const selectedCategory = categories.find((category) => (
            Number(category.categoryId) === Number(productForm.categoryId)
          ));
          const submittedProduct = uploadResult?.product || {
            productId: uploadResult?.productId || `submitted-${Date.now()}`,
            sellerId: Number(userId),
            categoryId: Number(productForm.categoryId),
            title: productForm.title,
            description: productForm.description,
            price,
            quantity,
            isActive: false,
            createdAt: new Date().toISOString(),
            category: selectedCategory?.categoryName || 'Digital Product',
            categoryName: selectedCategory?.categoryName || 'Digital Product',
            versionCount: 1,
            latestVersion: '1.0.0',
          };

          setProducts((currentProducts) => [
            submittedProduct,
            ...currentProducts.filter((product) => (
              String(product.productId) !== String(submittedProduct.productId)
            )),
          ]);
          showNotice('Requested to Sell', 'Your request is now shown in the Product Listings table for admin validation.');
        } else {
          showNotice('Product uploaded with initial version.');
        }
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

      const result = await api.addProductVersion(versionForm.productId, formData);
      setVersionForm(emptyVersionForm);
      setIsProductModalOpen(false);
      setProductModalMode('details');
      showNotice(isSeller ? 'Product version submitted for admin review.' : result.message || 'Product version pushed.');
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

  const submitCheckout = async (product, paymentMethod = 'GCash') => {
    if (!product) {
      showError('Select a product for checkout.');
      return;
    }

    const quantity = Number(checkoutForm.quantity || 1);
    const availableQuantity = getProductQuantity(product);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      showError('Enter a valid quantity.');
      return;
    }

    if (availableQuantity <= 0) {
      showError('This product is out of stock.');
      return;
    }

    if (quantity > availableQuantity) {
      showError(`Only ${availableQuantity} item(s) are available.`);
      return;
    }

    const confirmed = await requestConfirmation({
      title: 'Buy Product?',
      message: `Confirm purchase of ${quantity} ${quantity === 1 ? 'item' : 'items'} of ${product.title} for ${formatMoney(Number(product.price || 0) * quantity)}.`,
      confirmLabel: 'Continue',
    });
    if (!confirmed) return;

    const finalConfirmed = await requestConfirmation({
      title: 'Final Purchase Confirmation',
      message: 'This will record the payment and generate your access token.',
      confirmLabel: 'Buy Now',
    });
    if (!finalConfirmed) return;

    try {
      const result = await api.checkout({
        productId: product.productId,
        quantity,
        customerId: userId,
        customerName: profile.fullName,
        customerEmail: profile.email,
        paymentMethod,
      });

      showNotice(`Payment completed. Reference ${result.referenceNumber}.`);
      setCheckoutForm({ productId: '', quantity: '1', paymentMethod: 'GCash' });
      setActiveProductView(null);
      await loadDashboard();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleCheckout = async (event) => {
    event.preventDefault();
    await submitCheckout(selectedCheckoutProduct, checkoutForm.paymentMethod);
  };

  const handleBuyProduct = async (product) => {
    await submitCheckout(product, checkoutForm.paymentMethod || 'GCash');
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    if (!profile.fullName?.trim()) {
      showError('Full name is required.');
      return;
    }

    if (!profile.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      showError('Enter a valid email address.');
      return;
    }

    if (!isPhilippinePhoneNumber(profile.phoneNumber)) {
      showError('Phone must be numeric and follow the Philippine 09XXXXXXXXX format.');
      return;
    }

    if (isSeller && !validIdRecord) {
      showError('Submit a valid ID before saving your profile.');
      setIsValidIdModalOpen(true);
      return;
    }

    const confirmed = await requestConfirmation({
      title: 'Save Account Settings?',
      message: 'Please confirm that the account details are correct before saving.',
      confirmLabel: 'Save Settings',
    });
    if (!confirmed) return;

    try {
      const result = await api.updateProfile(userId, profile);
      const nextUser = result.user || {};
      localStorage.setItem('corek_user', JSON.stringify(nextUser));
      showNotice('Settings saved.');
      await loadDashboard();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleArchiveCategory = async (category) => {
    if (isCategoryArchived(category)) return;

    const confirmed = await requestConfirmation({
      title: 'Archive Category?',
      message: `${category.categoryName} will be hidden from new listings but existing product data will stay intact.`,
      confirmLabel: 'Archive',
      tone: 'danger',
    });
    if (!confirmed) return;

    const finalConfirmed = await requestConfirmation({
      title: 'Final Archive Confirmation',
      message: 'This keeps the database safe by archiving instead of deleting.',
      confirmLabel: 'Archive Category',
      tone: 'danger',
    });
    if (!finalConfirmed) return;

    try {
      const result = await api.deleteCategory(category.categoryId);
      showNotice('Category Archived', result.message || 'Category archived successfully.');
      await loadDashboard();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleChangePasswordSubmit = async (event) => {
    event.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showError('Complete all password fields.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showError('New password must be at least 6 characters long.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError('Password confirmation does not match.');
      return;
    }

    const confirmed = await requestConfirmation({
      title: 'Change Password?',
      message: 'You will use the new password the next time you sign in.',
      confirmLabel: 'Change Password',
    });
    if (!confirmed) return;

    try {
      await api.updatePassword(userId, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      setPasswordForm(emptyPasswordForm);
      setIsChangePasswordModalOpen(false);
      showNotice('Password changed.', 'Your account password has been updated.');
    } catch (err) {
      showError(err.message);
    }
  };

  const openSellerSubscriptionModal = async () => {
    setIsSubscriptionModalOpen(true);

    try {
      const subscription = await api.getSubscription(userId);
      setSubscriptionSettings(normalizeSubscriptionSettings(
        subscription,
        profile.email || activeUser.email || activeUser.Email || ''
      ));
    } catch (err) {
      showError(err.message || 'Unable to load subscription settings.');
    }
  };

  const handleSubscriptionPlanSelect = (planOption) => {
    setSubscriptionSettings((currentSettings) => ({
      ...currentSettings,
      plan: planOption.plan,
      seats: String(planOption.seats),
      autoRenew: planOption.plan === 'Starter' ? false : true,
    }));
  };

  const handleSubscriptionSubmit = async (event) => {
    event.preventDefault();

    const seats = Number(subscriptionSettings.seats);
    if (!Number.isInteger(seats) || seats < 1 || seats > 50) {
      showError('Subscription seats must be a whole number from 1 to 50.');
      return;
    }

    if (!subscriptionSettings.billingEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(subscriptionSettings.billingEmail)) {
      showError('Enter a valid billing email for the subscription.');
      return;
    }

    const confirmed = await requestConfirmation({
      title: 'Subscribe to Plan?',
      message: `Confirm the ${subscriptionSettings.plan} subscription for this seller account.`,
      confirmLabel: 'Subscribe',
    });
    if (!confirmed) return;

    try {
      const result = await api.updateSubscription(userId, {
        plan: subscriptionSettings.plan,
        billingCycle: subscriptionSettings.billingCycle,
        billingEmail: subscriptionSettings.billingEmail,
        seats,
        autoRenew: subscriptionSettings.autoRenew,
      });

      setSubscriptionSettings(normalizeSubscriptionSettings(result.subscription || result, subscriptionSettings.billingEmail));
      setIsSubscriptionModalOpen(false);
      showNotice('Subscription saved.', result.message || 'Seller subscription was updated.');
      await loadDashboard();
    } catch (err) {
      showError(err.message);
    }
  };

  const openAdminSubscriptionModal = async (account) => {
    const accountId = account.userId || account.UserId;
    const accountRole = account.role || account.Role || 'Customer';
    if (accountRole !== 'Seller') {
      showError('Subscriptions are only available for seller accounts.');
      return;
    }

    const fallbackEmail = account.email || account.Email || '';
    setActiveSubscriptionAccount(account);
    setAdminSubscriptionSettings(normalizeSubscriptionSettings({
      plan: account.subscriptionPlan || account.SubscriptionPlan,
      seats: account.subscriptionSeats || account.SubscriptionSeats,
      billingEmail: fallbackEmail,
    }, fallbackEmail));

    try {
      const subscription = await api.getSubscription(accountId);
      setAdminSubscriptionSettings(normalizeSubscriptionSettings(subscription, fallbackEmail));
    } catch (err) {
      showError(err.message || 'Unable to load subscription settings.');
    }
  };

  const handleAdminSubscriptionSubmit = async (event) => {
    event.preventDefault();

    if (!activeSubscriptionAccount) return;

    const accountId = activeSubscriptionAccount.userId || activeSubscriptionAccount.UserId;
    const seats = Number(adminSubscriptionSettings.seats);
    if (!Number.isInteger(seats) || seats < 1 || seats > 50) {
      showError('Subscription seats must be a whole number from 1 to 50.');
      return;
    }

    if (!adminSubscriptionSettings.billingEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminSubscriptionSettings.billingEmail)) {
      showError('Enter a valid billing email for the subscription.');
      return;
    }

    const confirmed = await requestConfirmation({
      title: 'Save Seller Subscription?',
      message: 'Confirm the subscription settings for this seller account.',
      confirmLabel: 'Save Subscription',
    });
    if (!confirmed) return;

    try {
      const result = await api.updateSubscription(accountId, {
        plan: adminSubscriptionSettings.plan,
        billingCycle: adminSubscriptionSettings.billingCycle,
        billingEmail: adminSubscriptionSettings.billingEmail,
        seats,
        autoRenew: adminSubscriptionSettings.autoRenew,
      });
      const savedSubscription = normalizeSubscriptionSettings(result.subscription || result, adminSubscriptionSettings.billingEmail);
      setAdminSubscriptionSettings(savedSubscription);
      setActiveSubscriptionAccount(null);
      showNotice('Subscription saved.', result.message || 'Seller subscription settings were updated.');
      await loadDashboard();
    } catch (err) {
      showError(err.message || 'Unable to save subscription.');
    }
  };

  const handleTicketSubmit = async (event) => {
    event.preventDefault();

    if (isCustomer && !ticketForm.orderId) {
      showError('Select an order for this support ticket.');
      return;
    }

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
    const currentStatus = ticket?.status || ticket?.Status || '';
    if (isAdmin && ['Approved', 'Rejected'].includes(currentStatus) && currentStatus !== status) {
      showError(`${currentStatus} support tickets cannot be changed.`);
      return;
    }

    let remarks = '';
    if (isAdmin && status === 'Rejected') {
      remarks = await requestReason({
        title: 'Reject Support Ticket',
        message: 'Add the reason this seller support request is rejected.',
        label: 'Rejection reason',
        confirmLabel: 'Continue',
        tone: 'danger',
      });
      if (remarks === null) return;
      if (!remarks) {
        showError('Rejection remarks are required.');
        return;
      }
    }

    if (isAdmin && ['Approved', 'Rejected'].includes(status)) {
      const confirmed = await requestConfirmation({
        title: `${status} Support Ticket?`,
        message: status === 'Rejected'
          ? 'Confirm that this seller support request should be rejected.'
          : 'Confirm that this seller support request should be approved.',
        confirmLabel: status,
        tone: status === 'Rejected' ? 'danger' : 'default',
      });
      if (!confirmed) return;

      const finalConfirmed = await requestConfirmation({
        title: `Final ${status} Confirmation`,
        message: 'This status will be saved and shown in the support queue.',
        confirmLabel: status,
        tone: status === 'Rejected' ? 'danger' : 'default',
      });
      if (!finalConfirmed) return;
    }

    try {
      await api.updateTicket(getTicketId(ticket), {
        status,
        priority: ticket.priority,
        remarks,
      });
      showNotice(`Support ${status}`, status === 'Rejected' ? remarks : 'Support ticket updated.');
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
      : normalized.includes('pending') || normalized.includes('open') || normalized.includes('review') || normalized.includes('payout')
        ? 'warn'
        : normalized.includes('closed') || normalized.includes('failed') || normalized.includes('missing') || normalized.includes('reject')
          ? 'bad'
          : '';

    return <span className={`status-text ${tone}`}>{status}</span>;
  };

  const renderTextStatus = (status) => {
    const normalized = String(status || '').toLowerCase();
    const tone = normalized.includes('complete')
      || normalized.includes('active')
      || normalized.includes('approved')
      || normalized.includes('verified')
      || normalized.includes('ready')
      ? 'good'
      : normalized.includes('pending') || normalized.includes('open') || normalized.includes('review')
        ? 'warn'
        : normalized.includes('reject') || normalized.includes('closed') || normalized.includes('failed') || normalized.includes('missing')
          ? 'bad'
          : '';

    return <span className={`status-text ${tone}`}>{status}</span>;
  };

  const renderOverview = () => (
    <div className="module-stack">
      <div
        className={`${isSeller || isCustomer ? 'grid-3' : 'grid-4'} ${isAdmin ? 'admin-overview-metrics admin-metric-row' : ''} ${
          isSeller ? 'seller-overview-metrics' : ''
        } ${isCustomer ? 'customer-overview-metrics' : ''}`}
      >
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

        {isAdmin && (
          <div className="panel metric">
            <div>
              <span>Active Products</span>
              <strong className="number-value">{reports?.activeProducts || products.length}</strong>
            </div>
            <Package className="right-side-icon" size={22} />
          </div>
        )}

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
          {renderSellerDashboardTabs()}
        </>
      )}

      {isAdmin && (
        <div className="panel admin-sales-graph-panel">
          <div className="panel-title-row seller-sales-graph-header">
            <div>
              <h2>Sales Graph</h2>
              <p>Marketplace sales by month.</p>
            </div>
            <BarChart3 size={20} />
          </div>

          {renderAdminSalesTrendChart()}
        </div>
      )}

      {!isSeller && (
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
                    {isCustomer ? getOrderSellerName(order) : order.customerName} / {formatDate(order.createdAt)}
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
            {(reports?.salesByCategory || []).length === 0 && (
              <div className="empty-state">No category sales yet.</div>
            )}

            {(reports?.salesByCategory || []).map((item) => (
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
      )}
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
        {paginatedMarketplaceProducts.map((product, index) => {
          const productImageSource = getProductImageSource(product);

          return (
          <article
            className="discover-product-card"
            key={product.productId}
            style={{ '--discover-accent': getMarketplaceAccent(marketplacePageStart + index) }}
          >
            <div className={`discover-product-art ${productImageSource ? 'has-image' : ''}`}>
              {productImageSource ? (
                <img src={productImageSource} alt={`${product.title} thumbnail`} />
              ) : (
                <div className="discover-product-placeholder">
                  <Package size={42} />
                </div>
              )}
              <span>{getProductCategory(product)}</span>
            </div>

            <div className="discover-product-body">
              <div className="discover-product-meta">
                <span>{getOrderSellerName(product)}</span>
              </div>

              <h3>{product.title}</h3>
              <p>{product.description}</p>

              <div className="discover-product-version">
                <span>Version {product.latestVersion || '1.0.0'}</span>
                <span>{getProductQuantity(product)} left</span>
              </div>

              <div className="discover-product-footer">
                <strong className="money-value">{formatMoney(product.price)}</strong>

                <div className="discover-product-actions">
                  <button
                    className="discover-view-button"
                    type="button"
                    aria-label={`View ${product.title}`}
                    title="View"
                    onClick={() => openProductViewModal(product)}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="discover-buy-button"
                    type="button"
                    onClick={() => openProductViewModal(product)}
                  >
                    Buy
                  </button>
                </div>
              </div>
            </div>
          </article>
          );
        })}
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
      subtitle={isAdmin
        ? ''
        : productModalMode === 'version'
        ? 'Push an updated product version for an existing listing.'
        : 'Create or edit listing details. New seller products stay pending until admin approval.'}
      onClose={closeProductModal}
      size="wide"
    >
      {productModalMode === 'details' ? (
        <form className="product-listing-form" onSubmit={handleProductSubmit}>
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
              <div className="price-input-control">
                <span className="price-input-prefix" aria-hidden="true">&#8369;</span>
                <input
                  className="number-input price-input"
                  required
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]+([.][0-9]{1,2})?"
                  placeholder="0.00"
                  value={productForm.price}
                  onChange={(e) => setProductForm({
                    ...productForm,
                    price: normalizePriceInput(e.target.value),
                  })}
                />
              </div>
            </div>

            <div className="field">
              <label>Quantity</label>
              <input
                required
                inputMode="numeric"
                value={productForm.quantity}
                onChange={(e) => setProductForm({
                  ...productForm,
                  quantity: normalizeWholeNumberInput(e.target.value),
                })}
              />
            </div>

            <div className="field">
              <label>Digital Content</label>
              <div className="content-upload-grid single">
                <label aria-label="Upload product image">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={Boolean(productForm.productId)}
                    onClick={(e) => {
                      e.currentTarget.value = '';
                    }}
                    onChange={(e) => setProductForm({ ...productForm, coverPhotoFile: e.target.files?.[0] || null })}
                  />
                </label>
              </div>
              {productForm.coverPhotoFile && (
                <div className="upload-preview product-image-preview">
                  <div className="upload-preview-frame">
                    {productImagePreviewUrl ? (
                      <img src={productImagePreviewUrl} alt="Selected product image preview" />
                    ) : (
                      <div className="upload-preview-file">{productForm.coverPhotoFile.name}</div>
                    )}
                    <button
                      className="upload-preview-remove"
                      type="button"
                      aria-label="Remove selected image"
                      onClick={() => setProductForm({ ...productForm, coverPhotoFile: null })}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <span className="upload-preview-name">{productForm.coverPhotoFile.name}</span>
                </div>
              )}
              {productForm.productId && (
                <span className="field-note">Digital content media is locked while editing listing details.</span>
              )}
            </div>

            <div className="field">
              <label>Category</label>
              <select
                required
                value={productForm.categoryId}
                onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
              >
                <option value="">Select category</option>
                {categories.filter((category) => !isCategoryArchived(category)).map((category) => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
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
              {productForm.productId ? 'Save Product' : 'Request to Sell'}
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
              {versionForm.file && (
                <div className="upload-preview">
                  {versionFilePreviewUrl ? (
                    <img src={versionFilePreviewUrl} alt="Selected version file preview" />
                  ) : (
                    <div className="upload-preview-file">{versionForm.file.name}</div>
                  )}
                  <span>{versionForm.file.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="toolbar modal-actions">
            <button className="button" type="submit">
              Request to Update
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

  const renderProductViewModal = () => {
    if (!activeProductView) return null;

    const productStatus = getProductApprovalStatus(activeProductView);
    const productImageSource = getProductImageSource(activeProductView);
    const sellerDetails = getProductSellerDetails(activeProductView);
    const productViewTitle = isCustomer || isAdmin ? 'Product Details' : 'View Product';

    return (
      <DashboardModal title={productViewTitle} onClose={() => setActiveProductView(null)} size={isCustomer ? 'product-details' : 'wide'}>
        <div className="product-view-stack">
          <div className="product-view-layout">
            <div className="product-view-thumbnail">
              {productImageSource ? (
                <img src={productImageSource} alt={`${activeProductView.title} thumbnail`} />
              ) : (
                <div className="product-view-thumbnail-fallback">
                  <Package size={46} />
                </div>
              )}
            </div>

            <div className="product-view-details">
              <div className="product-view-row">
                <span>Title</span>
                <strong>{activeProductView.title}</strong>
              </div>

              <div className="product-view-row">
                <span>Category</span>
                <strong>{activeProductView.category || activeProductView.categoryName || 'Digital Product'}</strong>
              </div>

              <div className="product-view-row">
                <span>Price</span>
                <strong>{formatMoney(activeProductView.price)}</strong>
              </div>

              <div className="product-view-row">
                <span>Version</span>
                <strong>{activeProductView.latestVersion || '1.0.0'}</strong>
              </div>

              {isCustomer ? (
                <>
                  <div className="product-view-row">
                    <span>Contact No.</span>
                    <strong>{sellerDetails.contactNo}</strong>
                  </div>

                  <div className="product-view-row">
                    <span>Profile Name</span>
                    <strong>{sellerDetails.profileName}</strong>
                  </div>
                </>
              ) : (
                <>
                  {isAdmin && (
                    <div className="product-view-row">
                      <span>Seller</span>
                      <strong>{sellerDetails.profileName}</strong>
                    </div>
                  )}

                  <div className="product-view-row">
                    <span>Status</span>
                    {renderTextStatus(productStatus)}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="product-view-description">
            <strong>Description</strong>
            <p>{activeProductView.description || 'No description provided.'}</p>
          </div>

          {getProductReviewRemarks(activeProductView) && (
            <div className="ticket-message-box">
              <strong>Review Remarks</strong>
              <p>{getProductReviewRemarks(activeProductView)}</p>
            </div>
          )}
        </div>

        <div className="toolbar modal-actions">
          {isCustomer && (
            <>
              <label className="inline-payment-select">
                <span>Quantity</span>
                <input
                  min="1"
                  max={Math.max(getProductQuantity(activeProductView), 1)}
                  inputMode="numeric"
                  value={checkoutForm.quantity}
                  onChange={(event) => setCheckoutForm({
                    ...checkoutForm,
                    quantity: normalizeWholeNumberInput(event.target.value, 4) || '1',
                  })}
                />
              </label>

              <label className="inline-payment-select">
                <span>Payment</span>
                <select
                  value={checkoutForm.paymentMethod}
                  onChange={(event) => setCheckoutForm({ ...checkoutForm, paymentMethod: event.target.value })}
                >
                  <option value="GCash">GCash</option>
                  <option value="Card">Card</option>
                  <option value="Maya">Maya</option>
                </select>
              </label>

              <button className="button" type="button" onClick={() => handleBuyProduct(activeProductView)}>
                Buy Product
                <CreditCard size={16} />
              </button>
            </>
          )}
          <button className={isCustomer ? 'button secondary' : 'button'} type="button" onClick={() => setActiveProductView(null)}>
            OK
          </button>
        </div>
      </DashboardModal>
    );
  };

  const renderNotificationModal = () => {
    const isError = notificationModal?.tone === 'error';
    const Icon = isError ? AlertCircle : CheckCircle;

    return (
      <DashboardModal title={notificationModal?.title || 'Notification'} onClose={() => setNotificationModal(null)}>
        <div className={`request-notification ${isError ? 'error' : 'success'}`}>
          <span className="notification-icon-wrap">
            <Icon size={34} />
          </span>
          <strong>{notificationModal?.title}</strong>
          <p>{notificationModal?.message}</p>
        </div>

        <div className="toolbar modal-actions">
          <button className="button" type="button" onClick={() => setNotificationModal(null)}>
            OK
          </button>
        </div>
      </DashboardModal>
    );
  };

  const renderConfirmationModal = () => (
    <DashboardModal title={confirmationRequest?.title || 'Confirm Action'} onClose={() => closeConfirmation(false)}>
      <div className="confirmation-copy">
        <p>{confirmationRequest?.message}</p>
      </div>

      <div className="toolbar modal-actions">
        <button
          className={`button ${confirmationRequest?.tone === 'danger' ? 'danger' : ''}`}
          type="button"
          onClick={() => closeConfirmation(true)}
        >
          {confirmationRequest?.confirmLabel || 'Confirm'}
        </button>
        <button className="button secondary" type="button" onClick={() => closeConfirmation(false)}>
          {confirmationRequest?.cancelLabel || 'Cancel'}
        </button>
      </div>
    </DashboardModal>
  );

  const renderReasonModal = () => (
    <DashboardModal title={reasonRequest?.title || 'Add Remarks'} onClose={() => closeReason(false)}>
      <div className="confirmation-copy">
        <p>{reasonRequest?.message}</p>
      </div>

      <div className="field full reason-field">
        <label>{reasonRequest?.label || 'Remarks'}</label>
        <textarea
          autoFocus
          value={reasonRequest?.value || ''}
          onChange={(event) => setReasonRequest((current) => (
            current ? { ...current, value: event.target.value } : current
          ))}
        />
      </div>

      <div className="toolbar modal-actions">
        <button
          className={`button ${reasonRequest?.tone === 'danger' ? 'danger' : ''}`}
          type="button"
          onClick={() => closeReason(true)}
        >
          {reasonRequest?.confirmLabel || 'Continue'}
        </button>
        <button className="button secondary" type="button" onClick={() => closeReason(false)}>
          Cancel
        </button>
      </div>
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
                Product Version
                <UploadCloud size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="panel product-listings-panel">
          <div className="product-listings-header">
            <h2>Product Listings</h2>
            <input
              className="search-input"
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
                  <th className="number-cell">Qty</th>
                  <th className="number-cell">Version</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {roleProducts.map((product) => {
                  const productStatus = getProductApprovalStatus(product);
                  const adminRemarks = getProductReviewRemarks(product);
                  const isApprovedProduct = productStatus === 'Approved';
                  const isRejectedProduct = productStatus === 'Rejected';

                  return (
                  <tr key={product.productId}>
                    <td>
                      <strong>{product.title}</strong>
                      {adminRemarks && <span className="table-note">Remarks: {adminRemarks}</span>}
                    </td>
                    <td>{product.category || product.categoryName}</td>
                    <td className="money-cell">{formatMoney(product.price)}</td>
                    <td className="number-cell">{getProductQuantity(product)}</td>
                    <td className="number-cell">
                      {product.latestVersion || '1.0.0'} / {formatFileCount(product.versionCount)}
                    </td>
                    <td>{renderTextStatus(productStatus)}</td>

                    <td className="actions">
                      {isAdmin ? (
                        <>
                          {!isApprovedProduct && !isRejectedProduct && (
                            <>
                              <button
                                className="button icon-only-button action-approve"
                                type="button"
                                aria-label={`Approve ${product.title}`}
                                title="Approve"
                                onClick={() => handleApproveProduct(product)}
                              >
                                <CheckCircle size={14} />
                              </button>

                              <button
                                className="button icon-only-button action-reject"
                                type="button"
                                aria-label={`Reject ${product.title}`}
                                title="Reject"
                                onClick={() => handleRejectProduct(product)}
                              >
                                <X size={14} />
                              </button>
                            </>
                          )}

                          <button
                            className="button icon-only-button action-view"
                            type="button"
                            aria-label={`View ${product.title}`}
                            title="View Product"
                            onClick={() => openProductViewModal(product)}
                          >
                            <Eye size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="button secondary icon-only-button compact-view-button"
                            type="button"
                            aria-label={`View ${product.title}`}
                            title="View Product"
                            onClick={() => openProductViewModal(product)}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="button secondary icon-only-button"
                            type="button"
                            aria-label={`Add product version for ${product.title}`}
                            title="Product Version"
                            onClick={() => openVersionModal(product.productId)}
                          >
                            <UploadCloud size={14} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                  );
                })}

                {roleProducts.length === 0 && (
                  <tr>
                    <td colSpan="7">
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
      {isAdmin && (
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
          {categories.map((category) => {
            const archived = isCategoryArchived(category);

            return (
            <div className={`mini-row ${archived ? 'archived-row' : ''}`} key={category.categoryId}>
              <div>
                <strong>{category.categoryName}</strong>
                <span>
                  {category.description || 'No description'} / {category.productCount} products
                  {archived ? ' / Archived' : ''}
                </span>
              </div>

              {isAdmin && (
                <button
                  className="button icon-only-button action-archive"
                  type="button"
                  disabled={archived}
                  aria-label={`Archive ${category.categoryName}`}
                  title={archived ? 'Archived' : 'Archive'}
                  onClick={() => handleArchiveCategory(category)}
                >
                  <Archive size={14} />
                </button>
              )}
            </div>
          );
          })}

          {categories.length === 0 && <div className="empty-state">No categories yet.</div>}
        </div>
      </div>
    </div>
  );

  const renderLibraryFilterModal = () => (
    <DashboardModal
      title="Date Filter"
      subtitle="Narrow purchase records by checkout date."
      onClose={() => setIsLibraryFilterOpen(false)}
    >
      <div className="form-grid library-filter-form">
        <div className="field">
          <label>Start</label>
          <input
            type="date"
            value={libraryFilters.start}
            onChange={(e) => setLibraryFilters({ ...libraryFilters, start: e.target.value })}
          />
        </div>

        <div className="field">
          <label>End</label>
          <input
            type="date"
            value={libraryFilters.end}
            onChange={(e) => setLibraryFilters({ ...libraryFilters, end: e.target.value })}
          />
        </div>
      </div>

      <div className="toolbar modal-actions">
        <button className="button" type="button" onClick={() => setIsLibraryFilterOpen(false)}>
          Apply Date
          <CalendarDays size={16} />
        </button>

        <button
          className="button secondary"
          type="button"
          onClick={() => setLibraryFilters({ start: '', end: '' })}
        >
          Reset
        </button>
      </div>
    </DashboardModal>
  );

  const renderPayments = () => {
    const paymentRows = isSeller ? dateFilteredRoleOrders : filteredLibraryOrders;
    const showSegmentedPayments = isSeller;
    const showPayoutDateControls = isSeller || isAdmin;
    const activePaymentsTableTab = isAdmin ? 'payouts' : showSegmentedPayments ? paymentsTableTab : 'records';
    const payoutQrSeed = [
      profile.payoutMethod || 'GCash',
      profile.payoutAccountName || displayName,
      profile.payoutAccountNumber || 'No account number',
    ].join('|');
    const payoutQrCells = getPayoutQrCells(payoutQrSeed);

    return (
    <div className="module-stack">
      <div className={isAdmin || isCustomer ? 'module-stack' : 'grid-2'}>
        {isCustomer && (
          <form className="panel customer-checkout-form" onSubmit={handleCheckout}>
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
                      {product.title} / {formatMoney(product.price)}
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
                <label>Quantity</label>
                <input
                  required
                  inputMode="numeric"
                  value={checkoutForm.quantity}
                  onChange={(e) => setCheckoutForm({
                    ...checkoutForm,
                    quantity: normalizeWholeNumberInput(e.target.value, 4) || '1',
                  })}
                />
              </div>

              <div className="field">
                <label>Total</label>
                <input
                  className="number-input"
                  readOnly
                  value={selectedCheckoutProduct
                    ? formatMoney(Number(selectedCheckoutProduct.price || 0) * Number(checkoutForm.quantity || 1))
                    : formatMoney(0)}
                />
              </div>
            </div>

            <div className="toolbar" style={{ marginTop: 14 }}>
              <button className="button" type="submit">
                Record Payment
                <CheckCircle size={16} />
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

            <div className="payout-process-content">
              <div className="mini-list payout-summary-list">
                <div className="mini-row payout-summary-row">
                  <div>
                    <strong>Available Payout</strong>
                    <span>{formatDateRange(sellerDateFilters)}</span>
                  </div>
                  <strong className="money-value">{formatMoney(sellerRevenue)}</strong>
                </div>

                <div className="mini-row payout-summary-row">
                  <div>
                    <strong>Destination</strong>
                    <span>
                      {profile.payoutMethod || 'GCash'} - {profile.payoutAccountName || 'No account name'}
                      {profile.payoutAccountNumber ? ` (${profile.payoutAccountNumber})` : ''}
                    </span>
                  </div>
                  {renderStatus(profile.payoutAccountNumber ? 'Ready' : 'Missing')}
                </div>

                {latestPayoutRequest && (
                  <div className="mini-row payout-summary-row">
                    <div>
                      <strong>Latest Request</strong>
                      <span>
                        {formatDate(latestPayoutRequest.requestedAt)} - {formatMoney(latestPayoutRequest.amount)}
                      </span>
                    </div>
                    {renderStatus(latestPayoutRequest.status)}
                  </div>
                )}
              </div>

              <div className="payout-qr-card">
                {isPayoutQrVisible ? (
                  <>
                    <div className="payout-qr-grid" role="img" aria-label="Payout QR code">
                      {payoutQrCells.map((isFilled, index) => (
                        <span className={isFilled ? 'filled' : ''} key={`${payoutQrSeed}-${index}`} />
                      ))}
                    </div>
                    <div>
                      <strong>Payout QR</strong>
                      <span>{profile.payoutMethod || 'GCash'}</span>
                      <small>{profile.payoutAccountNumber || 'Add account number'}</small>
                    </div>
                  </>
                ) : (
                  <button
                    className="payout-qr-button"
                    type="button"
                    onClick={() => setIsPayoutQrVisible(true)}
                    disabled={!profile.payoutAccountNumber}
                    title={!profile.payoutAccountNumber ? 'Add payout account number in Profile first.' : undefined}
                  >
                    <QrCode size={32} />
                    <strong>Show QR Code</strong>
                    <span>{profile.payoutMethod || 'GCash'}</span>
                  </button>
                )}
              </div>
            </div>

            <button
              className="button"
              type="button"
              onClick={handleRequestPayout}
              disabled={isPayoutSubmitting || !profile.payoutAccountNumber || sellerRevenue <= 0}
              title={!profile.payoutAccountNumber ? 'Add payout account number in Profile first.' : undefined}
            >
              {isPayoutSubmitting ? 'Submitting...' : 'Request Payout'}
              <CreditCard size={16} />
            </button>
          </div>
        )}

        {isSeller && (
        <div className="panel">
          <div className="panel-title-row">
            <div>
              <h2>Recent Buyer Access</h2>
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
                    {order.referenceNumber || 'No reference'} / {order.paymentMethod}
                  </span>
                </div>
                {isAdmin || isCustomer ? renderTextStatus(order.status) : renderStatus(order.status)}
              </div>
            ))}

            {paymentRows.length === 0 && <div className="empty-state">No paid downloads match this view.</div>}
          </div>
        </div>
        )}
      </div>

      <div className="panel segmented-table-panel">
        {showSegmentedPayments && (
          <div className="seller-dashboard-tabs segmented-table-tabs" role="tablist" aria-label="Payment records">
            <button
              className={activePaymentsTableTab === 'records' ? 'active' : ''}
              type="button"
              role="tab"
              aria-selected={activePaymentsTableTab === 'records'}
              onClick={() => setPaymentsTableTab('records')}
            >
              Sales Records
            </button>
            <button
              className={activePaymentsTableTab === 'payouts' ? 'active' : ''}
              type="button"
              role="tab"
              aria-selected={activePaymentsTableTab === 'payouts'}
              onClick={() => setPaymentsTableTab('payouts')}
            >
              Payout Request History
            </button>
          </div>
        )}

        <div className="panel-title-row payout-records-header">
          <div>
            <h2>
              {activePaymentsTableTab === 'payouts'
                ? isAdmin ? 'Payout Requests' : 'Payout Request History'
                : isCustomer ? 'Purchase Records' : 'Sales Records'}
            </h2>
            {isCustomer && <p>Date range: {formatDateRange(libraryFilters)}</p>}
            {isSeller && activePaymentsTableTab === 'records' && <p>Date range: {formatDateRange(sellerDateFilters)}</p>}
            {showPayoutDateControls && activePaymentsTableTab === 'payouts' && <p>Date range: {formatDateRange(payoutDateFilters)}</p>}
          </div>

          {isSeller && activePaymentsTableTab === 'records' && renderSellerDateFilter('', { plain: true, compact: true, controlsOnly: true })}

          {showPayoutDateControls && activePaymentsTableTab === 'payouts' && (
            <div className="date-filter-controls payout-history-filter">
              <label>
                <span>Start</span>
                <input
                  type="date"
                  value={payoutDateFilters.start}
                  onChange={(e) => setPayoutDateFilters({ ...payoutDateFilters, start: e.target.value })}
                />
              </label>

              <label>
                <span>End</span>
                <input
                  type="date"
                  value={payoutDateFilters.end}
                  onChange={(e) => setPayoutDateFilters({ ...payoutDateFilters, end: e.target.value })}
                />
              </label>

              <button className="button secondary" type="button" onClick={resetPayoutDateFilters}>
                Reset
                <CalendarDays size={16} />
              </button>
            </div>
          )}

          {isCustomer && (
            <button className="button secondary" type="button" onClick={() => setIsLibraryFilterOpen(true)}>
              Date Filter
              <CalendarDays size={16} />
            </button>
          )}
        </div>

        {activePaymentsTableTab === 'records' ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reference No.</th>
                  <th>{isCustomer ? 'Seller' : 'Customer'}</th>
                  <th>Product</th>
                  <th className="number-cell">Qty</th>
                  <th className="money-cell">Total</th>
                  <th className="center-cell">Status</th>
                  {!isAdmin && (
                    <th className="number-cell">
                      {isSeller ? 'Payout Status' : 'Access Token'}
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {paymentRows.map((order) => (
                  <tr key={order.orderId}>
                    <td>{order.referenceNumber}</td>
                    <td>{isCustomer ? getOrderSellerName(order) : order.customerName}</td>
                    <td>{order.productTitle}</td>
                    <td className="number-cell">{getOrderQuantity(order)}</td>
                    <td className="money-cell">{formatMoney(order.totalAmount)}</td>
                    <td className="center-cell">{isAdmin || isCustomer ? renderTextStatus(order.status) : renderStatus(order.status)}</td>
                    {!isAdmin && (
                      <td className="number-cell">
                        {isSeller
                          ? renderStatus(order.status === 'Completed' ? 'For Payout' : 'Pending')
                          : order.downloadToken || 'Pending'}
                      </td>
                    )}
                  </tr>
                ))}

                {paymentRows.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 7}>
                      <div className="empty-state">No payment records match this view.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{isAdmin ? 'Seller' : 'Range'}</th>
                  <th className="money-cell">Amount</th>
                  <th>Destination</th>
                  <th className="center-cell">Status</th>
                  <th className="number-cell">Requested</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>

              <tbody>
                {filteredPayoutRequests.map((request) => {
                  const payoutStatus = getPayoutStatus(request);
                  const isFinalPayout = ['Approved', 'Rejected'].includes(payoutStatus);
                  const requestedAt = request.requestedAt || request.RequestedAt;
                  const destination = [
                    request.payoutMethod || request.PayoutMethod || 'GCash',
                    request.payoutAccountName || request.PayoutAccountName || 'No account name',
                    request.payoutAccountNumber || request.PayoutAccountNumber || '',
                  ].filter(Boolean).join(' - ');

                  return (
                    <tr key={getPayoutId(request)}>
                      <td>
                        {isAdmin ? getPayoutSellerName(request) : getPayoutDateRange(request)}
                        {getPayoutRemarks(request) && <span className="table-note">Remarks: {getPayoutRemarks(request)}</span>}
                      </td>
                      <td className="money-cell">{formatMoney(getPayoutAmount(request))}</td>
                      <td>{destination}</td>
                      <td className="center-cell">{isAdmin ? renderTextStatus(payoutStatus) : renderStatus(payoutStatus)}</td>
                      <td className="number-cell">{formatDate(requestedAt)}</td>
                      {isAdmin && (
                        <td className="actions payout-status-actions">
                          {['Approved', 'Rejected'].map((status) => (
                            <button
                              className={`button icon-only-button ${status === 'Approved' ? 'action-approve' : 'action-reject'}`}
                              disabled={payoutStatus === status || (isFinalPayout && payoutStatus !== status)}
                              key={status}
                              type="button"
                              aria-label={`${status} payout request`}
                              title={status}
                              onClick={() => handlePayoutStatus(request, status)}
                            >
                              {status === 'Approved' ? <CheckCircle size={14} /> : <X size={14} />}
                            </button>
                          ))}
                        </td>
                      )}
                    </tr>
                  );
                })}

                {filteredPayoutRequests.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5}>
                      <div className="empty-state">No payout requests match this view.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    );
  };

  const renderReports = () => {
    const reportRevenue = isSeller ? sellerRevenue : reports?.totalSales || 0;
    const reportProducts = isSeller ? roleProducts.length : reports?.totalProducts || 0;
    const reportCompletedOrders = isSeller ? completedRoleOrders.length : reports?.completedOrders || 0;
    const reportCategories = isSeller ? sellerSalesByCategory : reports?.salesByCategory || [];
    const reportTopProducts = isSeller ? sellerTopProducts : reports?.topProducts || [];

    if (isSeller) {
      return (
        <div className="module-stack">
          <div className="panel report-export-panel seller-report-export-panel">
            <div>
              <h2>Reports Export</h2>
              <p>Export the current analytics view as a browser-generated PDF.</p>
            </div>

            <div className="seller-report-export-actions">
              {renderSellerDateFilter('', { plain: true, compact: true, controlsOnly: true })}

              <button className="button" type="button" onClick={handleExportReportsPdf}>
                Export PDF
                <Download size={16} />
              </button>
            </div>
          </div>

          <div className="grid-3 seller-report-metrics">
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

            <div className="panel metric orders">
              <div>
                <span>Completed Orders</span>
                <strong className="number-value">{reportCompletedOrders}</strong>
              </div>
              <Download className="right-side-icon" size={22} />
            </div>
          </div>

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
        </div>
      );
    }

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

        <div className={`grid-3 ${isAdmin ? 'admin-report-metrics admin-metric-row' : ''}`}>
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

          <div className="panel metric orders">
            <div>
              <span>Completed Orders</span>
              <strong className="number-value">{reportCompletedOrders}</strong>
            </div>
            <Download className="right-side-icon" size={22} />
          </div>
        </div>

        <div className="grid-1">
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

        <div className="grid-1">
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
              <th>Valid ID</th>
              <th>Subscription</th>
              <th>Review</th>
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
              const validIdReview = validIdReviewRecords.find((record) => Number(record.userId) === Number(accountId));
              const subscriptionPlan = account.subscriptionPlan || account.SubscriptionPlan || defaultSubscriptionSettings.plan;
              const subscriptionSeats = account.subscriptionSeats || account.SubscriptionSeats || defaultSubscriptionSettings.seats;

              return (
                <tr key={accountId || email}>
                  <td>
                    <strong>{fullName}</strong>
                  </td>
                  <td>{email}</td>
                  <td>{accountRole}</td>
                  <td>{renderTextStatus(isEmailVerified ? 'Verified' : 'Unverified')}</td>
                  <td>{renderTextStatus(validIdReview?.status || 'Missing')}</td>
                  <td>
                    {accountRole === 'Seller' ? (
                      <span className="subscription-pill">
                        {subscriptionPlan} / {subscriptionSeats || defaultSubscriptionSettings.seats} seats
                      </span>
                    ) : (
                      <span className="table-note">N/A</span>
                    )}
                  </td>
                  <td className="actions">
                    {validIdReview ? (
                      <>
                        <button
                          className="button secondary icon-only-button"
                          type="button"
                          aria-label={`View valid ID for ${fullName}`}
                          title="View details"
                          onClick={() => setActiveValidIdDetails({ ...validIdReview, fullName, email })}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="button secondary icon-only-button"
                          type="button"
                          aria-label={`Accept valid ID for ${fullName}`}
                          title="Accept"
                          onClick={() => handleValidIdDecision({ ...validIdReview, fullName, email }, 'Verified')}
                        >
                          <CheckCircle size={14} />
                        </button>
                        <button
                          className="button secondary icon-only-button"
                          type="button"
                          aria-label={`Reject valid ID for ${fullName}`}
                          title="Reject"
                          onClick={() => handleValidIdDecision({ ...validIdReview, fullName, email }, 'Rejected')}
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <span className="table-note">No ID</span>
                    )}
                    {accountRole === 'Seller' && (
                      <button
                        className="button secondary icon-only-button"
                        type="button"
                        aria-label={`Manage subscription for ${fullName}`}
                        title="Manage Subscription"
                        onClick={() => openAdminSubscriptionModal(account)}
                      >
                        <CreditCard size={14} />
                      </button>
                    )}
                  </td>
                  <td className="number-cell">{account.productCount || account.ProductCount || 0}</td>
                  <td className="number-cell">{account.orderCount || account.OrderCount || 0}</td>
                  <td className="number-cell">{account.ticketCount || account.TicketCount || 0}</td>
                  <td className="number-cell">{formatDate(account.createdAt || account.CreatedAt)}</td>
                </tr>
              );
            })}

            {users.length === 0 && (
              <tr>
                <td colSpan="11">
                  <div className="empty-state">No users found yet.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSellerSubscriptionModal = () => {
    const selectedPlan = subscriptionPlanOptions.find((planOption) =>
      planOption.plan === subscriptionSettings.plan
    ) || subscriptionPlanOptions[0];

    return (
      <DashboardModal
        title="Subscription Plans"
        subtitle={`Current plan: ${subscriptionSettings.plan || 'Starter'}`}
        onClose={() => setIsSubscriptionModalOpen(false)}
        size="wide"
      >
        <form className="seller-subscription-modal subscription-settings-panel" onSubmit={handleSubscriptionSubmit} noValidate>
          <div className="subscription-summary-grid">
            <div>
              <span>Selected Plan</span>
              <strong>{selectedPlan.plan}</strong>
            </div>
            <div>
              <span>Price</span>
              <strong>{selectedPlan.price}</strong>
            </div>
            <div>
              <span>Seats</span>
              <strong>{subscriptionSettings.seats}</strong>
            </div>
          </div>

          <div className="subscription-plan-grid" aria-label="Subscription plans">
            {subscriptionPlanOptions.map((planOption) => {
              const isSelected = planOption.plan === subscriptionSettings.plan;

              return (
                <button
                  className={`subscription-plan-card ${isSelected ? 'selected' : ''}`}
                  key={planOption.plan}
                  type="button"
                  onClick={() => handleSubscriptionPlanSelect(planOption)}
                >
                  <span className="subscription-plan-heading">
                    <strong>{planOption.plan}</strong>
                    {isSelected && <span>Selected</span>}
                  </span>
                  <em>{planOption.price}</em>
                  <p>{planOption.description}</p>
                  <small>{planOption.seats} workspace seat(s)</small>
                  <span className="subscription-plan-features">
                    {planOption.features.map((feature) => (
                      <span key={feature}>
                        <CheckCircle size={14} />
                        {feature}
                      </span>
                    ))}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="form-grid subscription-form-grid">
            <div className="field">
              <label>Billing Cycle</label>
              <select
                value={subscriptionSettings.billingCycle}
                onChange={(e) => setSubscriptionSettings({ ...subscriptionSettings, billingCycle: e.target.value })}
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Annual">Annual</option>
              </select>
            </div>

            <div className="field">
              <label>Billing Email</label>
              <input
                required
                type="email"
                value={subscriptionSettings.billingEmail}
                onChange={(e) => setSubscriptionSettings({ ...subscriptionSettings, billingEmail: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Workspace Seats</label>
              <input
                inputMode="numeric"
                value={subscriptionSettings.seats}
                onChange={(e) => setSubscriptionSettings({
                  ...subscriptionSettings,
                  seats: normalizeWholeNumberInput(e.target.value, 2),
                })}
              />
            </div>

            <label className="field checkbox-row subscription-renewal-toggle">
              <input
                type="checkbox"
                checked={subscriptionSettings.autoRenew}
                onChange={(e) => setSubscriptionSettings({ ...subscriptionSettings, autoRenew: e.target.checked })}
              />
              <span>Auto-renew subscription</span>
            </label>
          </div>

          <div className="toolbar modal-actions">
            <button className="button" type="submit">
              Subscribe
              <CreditCard size={16} />
            </button>
            <button className="button secondary" type="button" onClick={() => setIsSubscriptionModalOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      </DashboardModal>
    );
  };

  const renderAdminSubscriptionModal = () => {
    if (!activeSubscriptionAccount) return null;

    const accountName = activeSubscriptionAccount.fullName || activeSubscriptionAccount.FullName || 'Seller account';

    return (
      <DashboardModal
        title="Seller Subscription"
        subtitle={accountName}
        onClose={() => setActiveSubscriptionAccount(null)}
        size="wide"
      >
        <form className="subscription-settings-panel" onSubmit={handleAdminSubscriptionSubmit} noValidate>
          <div className="subscription-summary-grid">
            <div>
              <span>Current Plan</span>
              <strong>{adminSubscriptionSettings.plan}</strong>
            </div>
            <div>
              <span>Billing</span>
              <strong>{adminSubscriptionSettings.billingCycle}</strong>
            </div>
            <div>
              <span>Seats</span>
              <strong>{adminSubscriptionSettings.seats}</strong>
            </div>
          </div>

          <div className="form-grid subscription-form-grid">
            <div className="field">
              <label>Plan</label>
              <select
                value={adminSubscriptionSettings.plan}
                onChange={(e) => setAdminSubscriptionSettings({ ...adminSubscriptionSettings, plan: e.target.value })}
              >
                <option value="Starter">Starter</option>
                <option value="Professional">Professional</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>

            <div className="field">
              <label>Billing Cycle</label>
              <select
                value={adminSubscriptionSettings.billingCycle}
                onChange={(e) => setAdminSubscriptionSettings({ ...adminSubscriptionSettings, billingCycle: e.target.value })}
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Annual">Annual</option>
              </select>
            </div>

            <div className="field">
              <label>Billing Email</label>
              <input
                type="email"
                value={adminSubscriptionSettings.billingEmail}
                onChange={(e) => setAdminSubscriptionSettings({ ...adminSubscriptionSettings, billingEmail: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Workspace Seats</label>
              <input
                inputMode="numeric"
                value={adminSubscriptionSettings.seats}
                onChange={(e) => setAdminSubscriptionSettings({
                  ...adminSubscriptionSettings,
                  seats: normalizeWholeNumberInput(e.target.value, 2),
                })}
              />
            </div>

            <label className="field checkbox-row subscription-renewal-toggle">
              <input
                type="checkbox"
                checked={adminSubscriptionSettings.autoRenew}
                onChange={(e) => setAdminSubscriptionSettings({ ...adminSubscriptionSettings, autoRenew: e.target.checked })}
              />
              <span>Auto-renew subscription</span>
            </label>
          </div>

          <div className="toolbar modal-actions">
            <button className="button" type="submit">
              Save Subscription
              <Save size={16} />
            </button>
            <button className="button secondary" type="button" onClick={() => setActiveSubscriptionAccount(null)}>
              Cancel
            </button>
          </div>
        </form>
      </DashboardModal>
    );
  };

  const renderProfile = () => {
    if (isAdmin) {
      return (
        <div className="panel">
          <h2>Account Settings</h2>

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

    const profileForm = (
      <form
        className={`panel ${isSeller ? 'seller-profile-form' : ''} ${isCustomer ? 'customer-profile-form' : ''}`}
        onSubmit={handleProfileSubmit}
        noValidate
      >
        <h2>Account Settings</h2>

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
              inputMode="numeric"
              maxLength={11}
              placeholder="09XXXXXXXXX"
              value={profile.phoneNumber}
              onChange={(e) => setProfile({
                ...profile,
                phoneNumber: normalizePhilippinePhoneInput(e.target.value),
              })}
            />
          </div>

          {isSeller && (
            <>
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
                  value={profile.payoutAccountNumber}
                  onChange={(e) => setProfile({ ...profile, payoutAccountNumber: e.target.value })}
                />
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
                    </button>
                  </div>
                </div>
              </div>

              <div className="field full">
                <label>Bio</label>
                <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
              </div>
            </>
          )}
        </div>

        <div className="toolbar" style={{ marginTop: 14 }}>
          <button className="button" type="submit">
            {isSeller ? 'Save Settings' : 'Save Profile'}
            <Save size={16} />
          </button>
        </div>
      </form>
    );

    const securityPanel = (
      <div className="panel account-security-panel security-standards-panel">
        <div>
          <h2>Security</h2>
          <p>Standard account protections for this CoreK workspace.</p>
        </div>

        <div className="security-standards-grid">
          <div>
            <CheckCircle size={16} />
            <strong>Email verification</strong>
            <span>{activeUser.isEmailVerified || activeUser.IsEmailVerified ? 'Verified' : 'Verification recommended'}</span>
          </div>
          <div>
            <KeyRound size={16} />
            <strong>Password standard</strong>
            <span>Use at least 8 characters with mixed letters and numbers.</span>
          </div>
          <div>
            <LogOut size={16} />
            <strong>Session safety</strong>
            <span>Sign out on shared devices after every admin or seller session.</span>
          </div>
        </div>

        <button className="button secondary" type="button" onClick={() => setIsChangePasswordModalOpen(true)}>
          Change Password
          <KeyRound size={16} />
        </button>
      </div>
    );

    const sellerProfileTab = profileSettingsTab === 'security' ? 'security' : 'account';
    const sellerSubscriptionPanel = (
      <div className="panel subscription-entry-panel">
        <div>
          <span>Subscription</span>
          <strong>{subscriptionSettings.plan || 'Starter'}</strong>
          <p>
            {subscriptionSettings.billingCycle} billing / {subscriptionSettings.seats || '1'} workspace seat(s)
          </p>
        </div>

        <button className="button" type="button" onClick={openSellerSubscriptionModal}>
          View Plans
          <CreditCard size={16} />
        </button>
      </div>
    );

    if (!isSeller) {
      return (
        <div className="module-stack account-segmented-shell">
          <div className="seller-dashboard-tabs account-settings-tabs" role="tablist" aria-label="Customer account settings">
            <button
              className={profileSettingsTab === 'account' ? 'active' : ''}
              type="button"
              onClick={() => setProfileSettingsTab('account')}
            >
              Account Settings
            </button>
            <button
              className={profileSettingsTab === 'security' ? 'active' : ''}
              type="button"
              onClick={() => setProfileSettingsTab('security')}
            >
              Security
            </button>
          </div>

          {profileSettingsTab === 'security' ? securityPanel : profileForm}
        </div>
      );
    }

    return (
      <div className="module-stack seller-account-settings account-segmented-shell">
        <div className="seller-dashboard-tabs account-settings-tabs" role="tablist" aria-label="Seller account settings">
          <button
            className={sellerProfileTab === 'account' ? 'active' : ''}
            type="button"
            onClick={() => setProfileSettingsTab('account')}
          >
            Account Settings
          </button>
          <button
            className={sellerProfileTab === 'security' ? 'active' : ''}
            type="button"
            onClick={() => setProfileSettingsTab('security')}
          >
            Security
          </button>
        </div>

        {sellerSubscriptionPanel}
        {sellerProfileTab === 'account' && profileForm}
        {sellerProfileTab === 'security' && securityPanel}
      </div>
    );
  };

  const renderValidIdModal = () => (
    <DashboardModal
      title="Valid ID"
      subtitle="Submit a government ID for profile verification."
      onClose={() => setIsValidIdModalOpen(false)}
    >
      <form className="valid-id-form" onSubmit={handleValidIdSubmit} noValidate>
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
              key={validIdForm.fileName || 'valid-id-empty-file'}
              type="file"
              accept="image/*,.pdf"
              onChange={handleValidIdFileChange}
            />
            {validIdForm.fileName && (
              <div className="valid-id-file-preview">
                <div className="valid-id-preview-frame">
                  {validIdForm.filePreviewUrl ? (
                    <img src={validIdForm.filePreviewUrl} alt="Valid ID preview" />
                  ) : (
                    <div className="upload-preview-file">{validIdForm.fileName}</div>
                  )}
                  <button
                    className="upload-preview-remove"
                    type="button"
                    aria-label="Remove selected valid ID file"
                    onClick={clearValidIdFile}
                  >
                    <X size={14} />
                  </button>
                </div>
                <span className="field-note">{validIdForm.fileName}</span>
              </div>
            )}
          </div>
        </div>

        <div className="toolbar modal-actions">
          <button className="button" type="submit">
            Submit ID
          </button>
          <button className="button secondary" type="button" onClick={() => setIsValidIdModalOpen(false)}>
            Cancel
          </button>
        </div>
      </form>
    </DashboardModal>
  );

  const renderChangePasswordModal = () => (
    <DashboardModal
      title="Change Password"
      subtitle="Update the password for this seller account."
      onClose={() => {
        setPasswordForm(emptyPasswordForm);
        setIsChangePasswordModalOpen(false);
      }}
    >
      <form className="change-password-form" onSubmit={handleChangePasswordSubmit} noValidate>
        <div className="form-grid">
          <div className="field full">
            <label>Current Password</label>
            <input
              required
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            />
          </div>

          <div className="field">
            <label>New Password</label>
            <input
              required
              minLength={6}
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            />
          </div>

          <div className="field">
            <label>Confirm Password</label>
            <input
              required
              minLength={6}
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            />
          </div>
        </div>

        <div className="toolbar modal-actions">
          <button className="button" type="submit">
            Change Password
            <KeyRound size={16} />
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              setPasswordForm(emptyPasswordForm);
              setIsChangePasswordModalOpen(false);
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </DashboardModal>
  );

  const renderValidIdDetailsModal = () => (
    <DashboardModal
      title="Valid ID Details"
      subtitle={activeValidIdDetails?.fullName || activeValidIdDetails?.email}
      onClose={() => setActiveValidIdDetails(null)}
    >
      <div className="valid-id-detail-stack">
        <div className="mini-row">
          <div>
            <strong>Account</strong>
            <span>{activeValidIdDetails?.fullName || 'Unknown user'}</span>
          </div>
          {renderStatus(activeValidIdDetails?.status || 'Pending Review')}
        </div>

        <div className="mini-row">
          <div>
            <strong>ID Type</strong>
            <span>{activeValidIdDetails?.idType || 'Not provided'}</span>
          </div>
          <div>
            <strong>ID Number</strong>
            <span>{activeValidIdDetails?.idNumber || 'Not provided'}</span>
          </div>
        </div>

        <div className="valid-id-detail-preview">
          {activeValidIdDetails?.filePreviewUrl ? (
            <img src={activeValidIdDetails.filePreviewUrl} alt="Submitted valid ID" />
          ) : (
            <div className="upload-preview-file">{activeValidIdDetails?.fileName || 'No file preview available'}</div>
          )}
          <span>{activeValidIdDetails?.fileName || 'No file attached'}</span>
        </div>

        {activeValidIdDetails?.remarks && (
          <div className="ticket-message-box">
            <strong>Remarks</strong>
            <p>{activeValidIdDetails.remarks}</p>
          </div>
        )}
      </div>

      <div className="toolbar modal-actions">
        <button
          className="button"
          type="button"
          onClick={async () => {
            await handleValidIdDecision(activeValidIdDetails, 'Verified');
            setActiveValidIdDetails(null);
          }}
        >
          Accept
          <CheckCircle size={16} />
        </button>
        <button
          className="button secondary"
          type="button"
          onClick={async () => {
            await handleValidIdDecision(activeValidIdDetails, 'Rejected');
            setActiveValidIdDetails(null);
          }}
        >
          Reject
          <X size={16} />
        </button>
      </div>
    </DashboardModal>
  );

  const renderSupportTicketModal = () => (
    <DashboardModal
      title={isSeller ? 'Seller Support' : 'Submit Ticket'}
      subtitle={isSeller ? 'Send an account, payout, or listing concern to admin.' : 'Send a product or order concern to the seller.'}
      onClose={() => setIsTicketModalOpen(false)}
      size="wide"
    >
      <form className={isCustomer ? 'support-ticket-form customer-ticket-form' : 'support-ticket-form'} onSubmit={handleTicketSubmit}>
        <div className="form-grid">
          {!isCustomer && (
            <div className="field">
              <label>Product</label>
              <select
                value={ticketForm.productId}
                onChange={(e) => setTicketForm({ ...ticketForm, productId: e.target.value })}
              >
                <option value="">General admin support</option>
                {roleProducts.map((product) => (
                  <option key={product.productId} value={product.productId}>
                    {product.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="field">
            <label>Order</label>
            <select
              value={ticketForm.orderId}
              onChange={(e) => {
                const selectedOrder = roleOrders.find((order) => String(order.orderId) === e.target.value);
                setTicketForm({
                  ...ticketForm,
                  orderId: e.target.value,
                  productId: selectedOrder?.productId ? String(selectedOrder.productId) : ticketForm.productId,
                });
              }}
              required={isCustomer}
            >
              <option value="">{isCustomer ? 'Select order' : 'No order selected'}</option>
              {roleOrders.map((order) => (
                <option key={order.orderId} value={order.orderId}>
                  {order.referenceNumber} {order.productTitle ? `/ ${order.productTitle}` : ''}
                </option>
              ))}
            </select>
          </div>

          {!isCustomer && (
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
          )}

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
            {isSeller ? 'Send to Admin' : 'Send to Seller'}
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

        {getTicketRemarks(activeTicket) && (
          <div className="ticket-message-box">
            <strong>Review Remarks</strong>
            <p>{getTicketRemarks(activeTicket)}</p>
          </div>
        )}

        {isSeller && getTicketRequesterRole(activeTicket) === 'Customer' && (
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

        {isAdmin && getTicketRequesterRole(activeTicket) === 'Seller' && (
          <div className="toolbar modal-actions">
            {['Approved', 'Rejected'].map((status) => (
              <button
                className={`button icon-action-button ${status === 'Approved' ? 'action-approve' : 'action-reject'}`}
                disabled={['Approved', 'Rejected'].includes(activeTicket?.status) && activeTicket?.status !== status}
                key={status}
                type="button"
                onClick={async () => {
                  await handleTicketStatus(activeTicket, status);
                  setActiveTicket({ ...activeTicket, status, updatedAt: new Date().toISOString() });
                }}
              >
                {status === 'Approved' ? <CheckCircle size={16} /> : <X size={16} />}
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
              <span>
                {activeChatThread
                  ? `${activeChatThread.displayName} - ${activeChatThread.productTitle || 'Digital product'}`
                  : isSeller
                    ? 'No buyer conversations yet'
                    : 'No seller conversations yet'}
              </span>
            </div>

            <button className="modal-close-button" type="button" onClick={() => setIsChatOpen(false)}>
              <X size={16} />
            </button>
          </div>

          {chatThreads.length > 0 && (
            <div className="chat-thread-list">
              {chatThreads.map((thread) => (
                <button
                  className={thread.threadId === activeChatThreadId ? 'active' : ''}
                  key={thread.threadId}
                  type="button"
                  onClick={() => setActiveChatThreadId(thread.threadId)}
                >
                  <strong>{thread.displayName}</strong>
                  <span>{thread.productTitle || thread.lastMessage || 'Conversation'}</span>
                </button>
              ))}
            </div>
          )}

          <div className="chatbox-messages">
            {isChatLoading && <div className="empty-state">Loading conversation...</div>}

            {!isChatLoading && chatThreads.length === 0 && (
              <div className="empty-state">
                {isSeller
                  ? 'Buyer chats appear after customers purchase your products.'
                  : 'Seller chats appear after you purchase a product.'}
              </div>
            )}

            {!isChatLoading && activeChatThread && chatMessages.length === 0 && (
              <div className="empty-state">No messages yet. Start the conversation.</div>
            )}

            {chatMessages.map((message) => (
              <div
                className={`chat-message ${Number(message.senderId) === Number(userId) ? 'mine' : ''}`}
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
              disabled={!activeChatThread}
            />
            <button className="button icon-only-button" type="submit" aria-label="Send message" disabled={!activeChatThread}>
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
      <div className={isAdmin || isSeller ? 'module-stack' : 'grid-2'}>
        {!isAdmin && (
          <div className="panel support-command-panel">
            <div>
              <h2>{isSeller ? 'Seller Support' : 'Support Center'}</h2>
              <p>{isSeller ? 'Send account, payout, or listing concerns to admin.' : 'Create a ticket for a product you purchased.'}</p>
            </div>

            <button className="button" type="button" onClick={() => setIsTicketModalOpen(true)}>
              New Ticket
              <Send size={16} />
            </button>
          </div>
        )}

        {!isSeller && (
        <div className="panel">
          <h2>{isAdmin ? 'Seller Support Requests' : isSeller ? 'Seller Support' : 'My Seller Tickets'}</h2>

          <div className="mini-list">
            {roleTickets.slice(0, 5).map((ticket) => (
              <div className="mini-row" key={ticket.supportTicketId}>
                <div>
                  <strong>{ticket.subject}</strong>
                  <span>
                    {ticket.customerName} / {ticket.priority}
                  </span>
                </div>
                {renderStatus(ticket.status)}
              </div>
            ))}

            {roleTickets.length === 0 && <div className="empty-state">No tickets submitted yet.</div>}
          </div>
        </div>
        )}
      </div>

      <div className="panel">
        <h2>Ticket Records</h2>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Requester</th>
                <th>Product</th>
                <th>Priority</th>
                <th>Status</th>
                <th className="number-cell">Updated</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {roleTickets.map((ticket) => {
                const requesterRole = getTicketRequesterRole(ticket);
                const canSellerManage = isSeller && requesterRole === 'Customer';
                const canAdminReview = isAdmin && requesterRole === 'Seller';
                const isFinalSupportStatus = ['Approved', 'Rejected'].includes(ticket.status || ticket.Status);

                return (
                <tr key={getTicketId(ticket)}>
                  <td>
                    <strong>{ticket.subject}</strong>
                    {getTicketRemarks(ticket) && <span className="table-note">Remarks: {getTicketRemarks(ticket)}</span>}
                  </td>
                  <td>{ticket.customerName}</td>
                  <td>{ticket.productTitle || (requesterRole === 'Seller' ? 'Admin support' : 'General')}</td>
                  <td>{ticket.priority}</td>
                  <td>
                    {canSellerManage ? (
                      <select value={ticket.status} onChange={(e) => handleTicketStatus(ticket, e.target.value)}>
                        <option value="Open">Open</option>
                        <option value="In Review">In Review</option>
                        <option value="Closed">Closed</option>
                      </select>
                    ) : (
                      renderStatus(ticket.status)
                  )}
                  </td>
                  <td className="number-cell">{formatDate(ticket.updatedAt)}</td>
                  <td className="actions">
                    <button
                      className="button icon-only-button action-view"
                      type="button"
                      aria-label={`View ${ticket.subject}`}
                      title="View Details"
                      onClick={() => setActiveTicket(ticket)}
                    >
                      <Eye size={14} />
                    </button>
                    {canAdminReview && (
                      <>
                        <button
                          className="button icon-only-button action-approve"
                          disabled={isFinalSupportStatus && (ticket.status || ticket.Status) !== 'Approved'}
                          type="button"
                          aria-label={`Approve ${ticket.subject}`}
                          title="Approve"
                          onClick={() => handleTicketStatus(ticket, 'Approved')}
                        >
                          <CheckCircle size={14} />
                        </button>
                        <button
                          className="button icon-only-button action-reject"
                          disabled={isFinalSupportStatus && (ticket.status || ticket.Status) !== 'Rejected'}
                          type="button"
                          aria-label={`Reject ${ticket.subject}`}
                          title="Reject"
                          onClick={() => handleTicketStatus(ticket, 'Rejected')}
                        >
                          <X size={14} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
                );
              })}

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
      products: ['Products', 'View listings, versions, category placement, and product status across the marketplace.'],
      categories: [
        'Category',
        'View category counts across software and tech, business and finance, 3D assets, design assets, courses, productivity, and entertainment.',
      ],
      payments: ['Payout Requests', 'Review seller payout requests and final payout decisions.'],
      reports: ['Reports and Analytics', 'Review sales analytics, category performance, top products, and support load.'],
      users: ['User Directory', 'View registered admins, sellers, and customers without changing their account records.'],
      profile: ['Account Settings', 'View account details and payout settings.'],
      support: ['Seller Support', 'Review seller requests sent to admin.'],
    },
    Seller: {
      overview: [`Hello! ${displayName}`, 'Welcome back to your seller dashboard.'],
      products: ['', ''],
      payments: ['Payout Activity', 'Monitor buyer orders, delivery access, and checkout references.'],
      reports: ['', ''],
      profile: ['Account Settings', 'Maintain storefront details and payout account settings.'],
      support: ['Seller Support', 'Send admin support requests and manage customer product tickets.'],
    },
    Customer: {
      overview: [`Hi, ${firstName}`, 'Browse the marketplace, see your purchases, and keep support close.'],
      products: ['Marketplace', 'Discover digital products, review versions, and choose what to buy.'],
      payments: ['My Library', 'View purchase references and delivery records.'],
      profile: ['Account Settings', 'Maintain your buyer information and account protection settings.'],
      support: ['Seller Support', 'Ask the seller for help on products you bought.'],
    },
  };

  const activeCopy = moduleCopy[normalizedRole]?.[activeRoleModule] || moduleCopy.Customer.overview;
  const adminPlainHeaderModules = ['overview', 'reports', 'users', 'products', 'categories', 'payments', 'support', 'profile'];
  const sellerPlainHeaderModules = ['overview', 'products', 'payments', 'reports', 'support', 'profile'];
  const customerPlainHeaderModules = ['overview', 'products', 'payments', 'support', 'profile'];

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
    <div className={`dashboard-shell ${roleConfig.className} module-${activeRoleModule}`}>
      {!isCustomer && (
      <aside className="dashboard-sidebar">
        <div className="dashboard-user">
          <strong>{displayName}</strong>
          <span className="role-label-clean">
            {normalizedRole}
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

        <div className="dashboard-sidebar-footer">
          <button className="sidebar-signout-button" type="button" onClick={onLogout}>
            <span>Sign Out</span>
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      )}

      <main className="dashboard-content">
        {(activeCopy[0] || activeCopy[1]) && (
          <div
            className={`module-header ${
              (isAdmin && adminPlainHeaderModules.includes(activeRoleModule))
                || (isSeller && sellerPlainHeaderModules.includes(activeRoleModule))
                || (isCustomer && customerPlainHeaderModules.includes(activeRoleModule))
                ? 'seller-dashboard-heading'
                : ''
            }`}
          >
            <div>
              {activeCopy[0] && <h1>{activeCopy[0]}</h1>}
              {activeCopy[1] && <p>{activeCopy[1]}</p>}
            </div>
          </div>
        )}

        {notice && <div className="notice">{notice}</div>}
        {error && <div className="notice error">{error}</div>}

        <div style={{ marginTop: notice || error ? 16 : 0 }}>{renderActiveModule()}</div>
      </main>

      {isProductModalOpen && renderProductListingModal()}
      {activeProductView && renderProductViewModal()}
      {notificationModal && renderNotificationModal()}
      {confirmationRequest && renderConfirmationModal()}
      {reasonRequest && renderReasonModal()}
      {isTicketModalOpen && renderSupportTicketModal()}
      {activeTicket && renderTicketDetailsModal()}
      {isValidIdModalOpen && renderValidIdModal()}
      {isChangePasswordModalOpen && renderChangePasswordModal()}
      {activeValidIdDetails && renderValidIdDetailsModal()}
      {isSubscriptionModalOpen && renderSellerSubscriptionModal()}
      {activeSubscriptionAccount && renderAdminSubscriptionModal()}
      {isLibraryFilterOpen && renderLibraryFilterModal()}
      {(isSeller || isCustomer) && renderChatboxMessenger()}
    </div>
  );
}
