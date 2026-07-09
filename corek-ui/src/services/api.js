export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5132/api';

async function parseResponse(response) {
  const text = await response.text();
  let payload;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    const message = payload?.message || payload || `Request failed with status ${response.status}`;
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
        : error.message
    );
  }

  return parseResponse(response);
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

  checkout: (payload) => request('/Payments/checkout', { method: 'POST', body: JSON.stringify(payload) }),
  getOrders: (customerId) => request(`/Payments/orders${customerId ? `?customerId=${customerId}` : ''}`),

  getReports: () => request('/Reports/summary'),

  getUsers: () => request('/Users'),

  getTickets: (customerId) => request(`/SupportTickets${customerId ? `?customerId=${customerId}` : ''}`),
  createTicket: (payload) => request('/SupportTickets', { method: 'POST', body: JSON.stringify(payload) }),
  updateTicket: (ticketId, payload) => request(`/SupportTickets/${ticketId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
};
