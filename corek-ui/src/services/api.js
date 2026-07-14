const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
const defaultApiBaseUrl =
  typeof window !== 'undefined' && localHosts.has(window.location.hostname)
    ? 'http://localhost:5132/api'
    : '/api';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl;

async function parseResponse(response, path = '') {
  const text = await response.text();
  let payload;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/Auth/login')) {
      localStorage.removeItem('sys_auth_token');
      localStorage.removeItem('corek_user');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('corek:unauthorized'));
      }

      throw new Error('Your session expired. Please log in again.');
    }

    const validationMessage = payload?.errors
      ? Object.values(payload.errors).flat().join(' ')
      : '';
    const message =
      payload?.message ||
      validationMessage ||
      payload?.title ||
      (typeof payload === 'string' ? payload : '') ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

async function request(path, options = {}) {
  const token = localStorage.getItem('sys_auth_token');
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    throw new Error(
      error instanceof TypeError
        ? 'Unable to reach the CoreK API. Start the backend server, then try again.'
        : error.message,
      { cause: error }
    );
  }

  return parseResponse(response, path);
}

export const api = {
  register: (payload) => request('/Auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  login: (payload) => request('/Auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  getProducts: (search = '') => request(`/Product${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getProduct: (productId) => request(`/Product/${productId}`),
  getSellerProducts: (sellerId) => request(`/Product/seller/${sellerId}`),
  uploadProduct: (formData) => request('/Product/upload', { method: 'POST', body: formData }),
  updateProduct: (productId, payload) => request(`/Product/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  deactivateProduct: (productId) => request(`/Product/${productId}`, { method: 'DELETE' }),
  addProductVersion: (productId, formData) => request(`/Product/${productId}/add-version`, {
    method: 'POST',
    body: formData,
  }),

  getCategories: () => request('/Categories'),
  createCategory: (payload) => request('/Categories', { method: 'POST', body: JSON.stringify(payload) }),
  updateCategory: (categoryId, payload) => request(`/Categories/${categoryId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  deleteCategory: (categoryId) => request(`/Categories/${categoryId}`, { method: 'DELETE' }),

  getProfile: (userId) => request(`/Profile/${userId}`),
  updateProfile: (userId, payload) => request(`/Profile/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  updatePassword: (userId, payload) => request(`/Profile/${userId}/password`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  getValidId: (userId) => request(`/SellerAccounts/${userId}/valid-id`),
  getValidIds: () => request('/SellerAccounts/valid-ids'),
  submitValidId: (userId, formData) => request(`/SellerAccounts/${userId}/valid-id`, {
    method: 'POST',
    body: formData,
  }),
  updateValidIdStatus: (validIdSubmissionId, payload) => request(`/SellerAccounts/valid-ids/${validIdSubmissionId}/status`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  getSubscription: (sellerId) => request(`/SellerAccounts/${sellerId}/subscription`),
  updateSubscription: (sellerId, payload) => request(`/SellerAccounts/${sellerId}/subscription`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),

  checkout: (payload) => request('/Payments/checkout', { method: 'POST', body: JSON.stringify(payload) }),
  getOrders: (customerId) => request(`/Payments/orders${customerId ? `?customerId=${customerId}` : ''}`),
  getPayoutRequests: (sellerId) => request(`/Payments/payouts${sellerId ? `?sellerId=${sellerId}` : ''}`),
  requestPayout: (payload) => request('/Payments/payouts', { method: 'POST', body: JSON.stringify(payload) }),
  updatePayoutStatus: (payoutRequestId, payload) => request(`/Payments/payouts/${payoutRequestId}/status`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),

  getReports: () => request('/Reports/summary'),

  getUsers: () => request('/Users'),

  getChatThreads: () => request('/Chat/threads'),
  getChatMessages: (sellerId, customerId) => request(
    `/Chat/messages?sellerId=${encodeURIComponent(sellerId)}&customerId=${encodeURIComponent(customerId)}`
  ),
  sendChatMessage: (payload) => request('/Chat/messages', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  getTickets: (customerId) => request(`/SupportTickets${customerId ? `?customerId=${customerId}` : ''}`),
  createTicket: (payload) => request('/SupportTickets', { method: 'POST', body: JSON.stringify(payload) }),
  updateTicket: (ticketId, payload) => request(`/SupportTickets/${ticketId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
};
