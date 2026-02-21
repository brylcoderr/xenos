const API_URL = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message);
    }

    return response.json();
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  async downloadPdf(endpoint, filename) {
    const url = `${API_URL}${endpoint}`;
    const headers = {};
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }
}

export const api = new ApiClient();

export const auth = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/password', data),
};

export const leads = {
  getAll: (params) => api.get(`/leads?${new URLSearchParams(params)}`),
  getOne: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  delete: (id) => api.delete(`/leads/${id}`),
  getStats: () => api.get('/leads/stats'),
  importAnalyze: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_URL}/leads/import/analyze`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${api.token}` },
      body: formData
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    return response.json();
  },
  importConfirm: (mapping, data) => api.post('/leads/import/confirm', { mapping, data }),
  getImportFields: () => api.get('/leads/import/fields'),
};

export const clients = {
  getAll: (params) => api.get(`/clients?${new URLSearchParams(params)}`),
  getOne: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  getStats: () => api.get('/clients/stats'),
};

export const projects = {
  getAll: (params) => api.get(`/projects?${new URLSearchParams(params)}`),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addTask: (id, task) => api.post(`/projects/${id}/tasks`, task),
  updateTasks: (id, tasks) => api.put(`/projects/${id}/tasks`, { tasks }),
  updateTask: (projectId, taskId, data) => api.put(`/projects/${projectId}/tasks/${taskId}`, data),
  getStats: () => api.get('/projects/stats'),
};

export const documents = {
  getAll: (params) => api.get(`/documents?${new URLSearchParams(params)}`),
  getOne: (id) => api.get(`/documents/${id}`),
  create: (data) => api.post('/documents', data),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
  send: (id) => api.post(`/documents/${id}/sign`, {}),
  getTemplates: () => api.get('/documents/templates'),
  getTemplate: (type) => api.get(`/documents/templates/${type}`),
  share: (id, enable) => api.post(`/documents/${id}/share`, { enable }),
  getShared: (token) => api.get(`/documents/shared/${token}`),
  duplicate: (id) => api.post(`/documents/${id}/duplicate`, {}),
  exportPdf: (id, filename) => api.downloadPdf(`/documents/${id}/export/pdf`, filename),
  exportDocx: (id, filename) => api.downloadPdf(`/documents/${id}/export/docx`, filename),
};

export const templates = {
  getAll: (params) => api.get(`/templates?${new URLSearchParams(params)}`),
  getOne: (id) => api.get(`/templates/${id}`),
  create: (data) => api.post('/templates', data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
  duplicate: (id) => api.post(`/templates/${id}/duplicate`, {}),
  getTypes: () => api.get('/templates/types/list'),
  seedDefaults: () => api.post('/templates/seed/defaults', {}),
};

export const invoices = {
  getAll: (params) => api.get(`/invoices?${new URLSearchParams(params)}`),
  getOne: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  send: (id) => api.post(`/invoices/${id}/send`, {}),
  markPaid: (id) => api.post(`/invoices/${id}/mark-paid`, {}),
  exportPdf: (id, filename) => api.downloadPdf(`/invoices/${id}/export/pdf`, filename),
  getStats: () => api.get('/invoices/stats'),
};

export const dashboard = {
  getStats: () => api.get('/dashboard/stats'),
  getActivity: (params) => api.get(`/dashboard/activity?${new URLSearchParams(params)}`),
  getUpcoming: () => api.get('/dashboard/upcoming'),
};

export const workflows = {
  getStages: () => api.get('/workflows/stages'),
  getStage: (stage) => api.get(`/workflows/stages/${stage}`),
  advance: (entityType, entityId) => api.post('/workflows/advance', { entityType, entityId }),
  generateDocument: (entityType, entityId, templateId) => 
    api.post('/workflows/generate-document', { entityType, entityId, templateId }),
  getSuggestedDocuments: (stage) => api.get(`/workflows/suggested-documents/${stage}`),
};

export const notes = {
  getAll: () => api.get('/notes'),
  create: (content) => api.post('/notes', { content }),
  update: (id, content) => api.put(`/notes/${id}`, { content }),
  delete: (id) => api.delete(`/notes/${id}`),
};

export const dailyTasks = {
  getAll: (params) => api.get(`/daily-tasks?${new URLSearchParams(params)}`),
  create: (data) => api.post('/daily-tasks', data),
  update: (id, data) => api.put(`/daily-tasks/${id}`, data),
  delete: (id) => api.delete(`/daily-tasks/${id}`),
};
