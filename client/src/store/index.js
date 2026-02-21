import { create } from 'zustand';
import { 
  api, 
  auth as authApi, 
  leads as leadsApi, 
  clients as clientsApi, 
  projects as projectsApi, 
  documents as documentsApi, 
  templates as templatesApi, 
  invoices as invoicesApi, 
  dashboard as dashboardApi, 
  workflows as workflowsApi,
  notes as notesApi,
  dailyTasks as dailyTasksApi
} from '../lib/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const { user, token } = await authApi.login(email, password);
    api.setToken(token);
    set({ user, isAuthenticated: true });
    return user;
  },

  register: async (data) => {
    const { user, token } = await authApi.register(data);
    api.setToken(token);
    set({ user, isAuthenticated: true });
    return user;
  },

  logout: () => {
    api.clearToken();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    
    if (!api.token) {
      api.setToken(token);
    }

    try {
      const user = await authApi.me();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      api.clearToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateProfile: async (data) => {
    const user = await authApi.updateProfile(data);
    set({ user });
    return user;
  },
}));

export const useLeadStore = create((set, get) => ({
  leads: [],
  stats: null,
  pagination: { page: 1, pages: 1, total: 0 },
  isLoading: false,

  fetchLeads: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { leads, pagination } = await leadsApi.getAll(params);
      set({ leads, pagination, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchStats: async () => {
    const stats = await leadsApi.getStats();
    set({ stats });
  },

  createLead: async (data) => {
    const lead = await leadsApi.create(data);
    set(state => ({ leads: [lead, ...state.leads] }));
    return lead;
  },

  updateLead: async (id, data) => {
    const lead = await leadsApi.update(id, data);
    set(state => ({
      leads: state.leads.map(l => l._id === id ? lead : l)
    }));
    return lead;
  },

  deleteLead: async (id) => {
    await leadsApi.delete(id);
    set(state => ({
      leads: state.leads.filter(l => l._id !== id)
    }));
  },
}));

export const useClientStore = create((set) => ({
  clients: [],
  pagination: { page: 1, pages: 1, total: 0 },
  isLoading: false,

  fetchClients: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { clients, pagination } = await clientsApi.getAll(params);
      set({ clients, pagination, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createClient: async (data) => {
    const client = await clientsApi.create(data);
    set(state => ({ clients: [client, ...state.clients] }));
    return client;
  },

  updateClient: async (id, data) => {
    const client = await clientsApi.update(id, data);
    set(state => ({
      clients: state.clients.map(c => c._id === id ? client : c)
    }));
    return client;
  },

  deleteClient: async (id) => {
    await clientsApi.delete(id);
    set(state => ({
      clients: state.clients.filter(c => c._id !== id)
    }));
  },
}));

export const useProjectStore = create((set) => ({
  projects: [],
  pagination: { page: 1, pages: 1, total: 0 },
  isLoading: false,

  fetchProjects: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { projects, pagination } = await projectsApi.getAll(params);
      set({ projects, pagination, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createProject: async (data) => {
    const project = await projectsApi.create(data);
    set(state => ({ projects: [project, ...state.projects] }));
    return project;
  },

  updateProject: async (id, data) => {
    const project = await projectsApi.update(id, data);
    set(state => ({
      projects: state.projects.map(p => p._id === id ? project : p)
    }));
    return project;
  },

  deleteProject: async (id) => {
    await projectsApi.delete(id);
    set(state => ({
      projects: state.projects.filter(p => p._id !== id)
    }));
  },
}));

export const useDocumentStore = create((set) => ({
  documents: [],
  currentDocument: null,
  isLoading: false,

  fetchDocuments: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { documents: docs } = await documentsApi.getAll(params);
      set({ documents: docs, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchDocument: async (id) => {
    const document = await documentsApi.getOne(id);
    set({ currentDocument: document });
    return document;
  },

  createDocument: async (data) => {
    const document = await documentsApi.create(data);
    set(state => ({ documents: [document, ...state.documents] }));
    return document;
  },

  updateDocument: async (id, data) => {
    const document = await documentsApi.update(id, data);
    set({ currentDocument: document });
    return document;
  },

  deleteDocument: async (id) => {
    await documentsApi.delete(id);
    set(state => ({
      documents: state.documents.filter(d => d._id !== id)
    }));
  },
}));

export const useTemplateStore = create((set) => ({
  templates: [],
  isLoading: false,

  fetchTemplates: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { templates: items } = await templatesApi.getAll(params);
      set({ templates: items, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createTemplate: async (data) => {
    const template = await templatesApi.create(data);
    set(state => ({ templates: [template, ...state.templates] }));
    return template;
  },

  updateTemplate: async (id, data) => {
    const template = await templatesApi.update(id, data);
    set(state => ({
      templates: state.templates.map(t => t._id === id ? template : t)
    }));
    return template;
  },

  deleteTemplate: async (id) => {
    await templatesApi.delete(id);
    set(state => ({
      templates: state.templates.filter(t => t._id !== id)
    }));
  },
}));

export const useInvoiceStore = create((set) => ({
  invoices: [],
  stats: null,
  pagination: { page: 1, pages: 1, total: 0 },
  isLoading: false,

  fetchInvoices: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { invoices, pagination } = await invoicesApi.getAll(params);
      set({ invoices, pagination, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchStats: async () => {
    const stats = await invoicesApi.getStats();
    set({ stats });
  },

  createInvoice: async (data) => {
    const invoice = await invoicesApi.create(data);
    set(state => ({ invoices: [invoice, ...state.invoices] }));
    return invoice;
  },

  updateInvoice: async (id, data) => {
    const invoice = await invoicesApi.update(id, data);
    set(state => ({
      invoices: state.invoices.map(i => i._id === id ? invoice : i)
    }));
    return invoice;
  },

  deleteInvoice: async (id) => {
    await invoicesApi.delete(id);
    set(state => ({
      invoices: state.invoices.filter(i => i._id !== id)
    }));
  },
}));

export const useDashboardStore = create((set) => ({
  stats: null,
  activity: [],
  upcoming: null,
  isLoading: false,

  fetchStats: async () => {
    set({ isLoading: true });
    try {
      const stats = await dashboardApi.getStats();
      set({ stats, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchActivity: async (params = {}) => {
    const activity = await dashboardApi.getActivity(params);
    set({ activity });
  },

  fetchUpcoming: async () => {
    const upcoming = await dashboardApi.getUpcoming();
    set({ upcoming });
  },
}));

export const useWorkflowStore = create((set) => ({
  stages: null,
  currentStage: null,

  fetchStages: async () => {
    const stages = await workflowsApi.getStages();
    set({ stages });
  },

  fetchStage: async (stage) => {
    const currentStage = await workflowsApi.getStage(stage);
    set({ currentStage });
  },

  advanceWorkflow: async (entityType, entityId) => {
    return await workflowsApi.advance(entityType, entityId);
  },

  generateDocument: async (entityType, entityId, templateId) => {
    return await workflowsApi.generateDocument(entityType, entityId, templateId);
  },
}));

export const useNoteStore = create((set) => ({
  notes: [],
  isLoading: false,

  fetchNotes: async () => {
    set({ isLoading: true });
    try {
      const notes = await notesApi.getAll();
      set({ notes, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createNote: async (content) => {
    const note = await notesApi.create(content);
    set(state => ({ notes: [note, ...state.notes] }));
    return note;
  },

  updateNote: async (id, content) => {
    const note = await notesApi.update(id, content);
    set(state => ({
      notes: state.notes.map(n => n._id === id ? note : n)
    }));
    return note;
  },

  deleteNote: async (id) => {
    await notesApi.delete(id);
    set(state => ({
      notes: state.notes.filter(n => n._id !== id)
    }));
  },
}));

export const useDailyTaskStore = create((set) => ({
  dailyTasks: [],
  isLoading: false,

  fetchDailyTasks: async (params = {}) => {
    set({ isLoading: true });
    try {
      const tasks = await dailyTasksApi.getAll(params);
      set({ dailyTasks: tasks, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createDailyTask: async (data) => {
    const task = await dailyTasksApi.create(data);
    set(state => ({ dailyTasks: [task, ...state.dailyTasks] }));
    return task;
  },

  updateDailyTask: async (id, data) => {
    const task = await dailyTasksApi.update(id, data);
    set(state => ({
      dailyTasks: state.dailyTasks.map(t => t._id === id ? task : t)
    }));
    return task;
  },

  deleteDailyTask: async (id) => {
    await dailyTasksApi.delete(id);
    set(state => ({
      dailyTasks: state.dailyTasks.filter(t => t._id !== id)
    }));
  },
}));
