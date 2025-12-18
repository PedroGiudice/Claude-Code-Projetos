import { create } from 'zustand';
import {
  stjApi,
  SearchParams,
  AcordaoSummary,
  AcordaoDetail,
  StatsResponse,
  SyncParams,
  SyncStatusType,
  SyncProgress,
  ExportFormat,
} from '@/services/stjApi';

interface STJState {
  // Search state
  searchTerm: string;
  results: AcordaoSummary[];
  total: number;
  loading: boolean;
  error: string | null;

  // Filters
  filters: {
    orgao: string;
    dias: number;
    campo: 'ementa' | 'texto_integral';
  };

  // Pagination
  page: number;
  pageSize: number;

  // Selected case
  selectedCase: AcordaoDetail | null;
  loadingCase: boolean;

  // Stats
  stats: StatsResponse | null;

  // Sync state
  syncStatus: SyncStatusType;
  isSyncing: boolean;
  syncProgress: SyncProgress;
  syncError: string | null;
  pollingInterval: NodeJS.Timeout | null;

  // Actions
  setSearchTerm: (term: string) => void;
  setFilters: (filters: Partial<STJState['filters']>) => void;
  search: () => Promise<void>;
  loadCase: (id: string) => Promise<void>;
  loadStats: () => Promise<void>;
  setPage: (page: number) => void;
  clearResults: () => void;

  // Sync actions
  startSync: (params: SyncParams) => Promise<void>;
  pollSyncStatus: () => Promise<void>;
  cancelSync: () => Promise<void>;
  resetSyncState: () => void;

  // Export actions
  exportResults: (format: ExportFormat) => Promise<void>;
}

export const useSTJStore = create<STJState>((set, get) => ({
  searchTerm: '',
  results: [],
  total: 0,
  loading: false,
  error: null,

  filters: {
    orgao: '',
    dias: 365,
    campo: 'ementa',
  },

  page: 0,
  pageSize: 20,

  selectedCase: null,
  loadingCase: false,

  stats: null,

  // Sync initial state
  syncStatus: 'idle',
  isSyncing: false,
  syncProgress: {
    downloaded: 0,
    processed: 0,
    inserted: 0,
    duplicates: 0,
    errors: 0,
  },
  syncError: null,
  pollingInterval: null,

  setSearchTerm: (term) => set({ searchTerm: term }),

  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
    page: 0, // Reset pagination on filter change
  })),

  search: async () => {
    const { searchTerm, filters, page, pageSize } = get();
    if (searchTerm.length < 3) {
      set({ error: 'Termo de busca deve ter ao menos 3 caracteres' });
      return;
    }

    set({ loading: true, error: null });

    try {
      const params: SearchParams = {
        termo: searchTerm,
        dias: filters.dias,
        campo: filters.campo,
        limit: pageSize,
        offset: page * pageSize,
      };

      if (filters.orgao) {
        params.orgao = filters.orgao;
      }

      const { data } = await stjApi.search(params);
      set({
        results: data.resultados,
        total: data.total,
        loading: false
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.detail || 'Erro ao buscar jurisprudência',
        loading: false
      });
    }
  },

  loadCase: async (id) => {
    set({ loadingCase: true });
    try {
      const { data } = await stjApi.getCase(id);
      set({ selectedCase: data, loadingCase: false });
    } catch (err: any) {
      set({ loadingCase: false });
    }
  },

  loadStats: async () => {
    try {
      const { data } = await stjApi.getStats();
      set({ stats: data });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  },

  setPage: (page) => {
    set({ page });
    get().search();
  },

  clearResults: () => set({
    results: [],
    total: 0,
    searchTerm: '',
    selectedCase: null,
    page: 0
  }),

  // Sync actions
  startSync: async (params: SyncParams) => {
    const { pollingInterval } = get();

    // Clear any existing polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    set({
      isSyncing: true,
      syncStatus: 'downloading',
      syncError: null,
      syncProgress: {
        downloaded: 0,
        processed: 0,
        inserted: 0,
        duplicates: 0,
        errors: 0,
      },
    });

    try {
      const { data } = await stjApi.triggerSync(params);

      if (data.success) {
        // Start polling for status updates
        const interval = setInterval(() => {
          get().pollSyncStatus();
        }, 2000); // Poll every 2 seconds

        set({ pollingInterval: interval });
      } else {
        set({
          isSyncing: false,
          syncStatus: 'error',
          syncError: data.message,
        });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Erro ao iniciar sincronizacao';
      set({
        isSyncing: false,
        syncStatus: 'error',
        syncError: errorMessage,
      });
    }
  },

  pollSyncStatus: async () => {
    try {
      const { data } = await stjApi.getSyncStatus();

      set({
        syncStatus: data.status,
        syncProgress: data.progress,
      });

      // Stop polling if complete or error
      if (data.status === 'complete' || data.status === 'error') {
        const { pollingInterval } = get();
        if (pollingInterval) {
          clearInterval(pollingInterval);
          set({ pollingInterval: null });
        }

        set({
          isSyncing: false,
          syncError: data.error || null,
        });

        // Reload stats after sync completes
        if (data.status === 'complete') {
          get().loadStats();
        }
      }
    } catch (err: unknown) {
      console.error('Failed to poll sync status:', err);
    }
  },

  cancelSync: async () => {
    const { pollingInterval } = get();

    try {
      await stjApi.cancelSync();

      if (pollingInterval) {
        clearInterval(pollingInterval);
      }

      set({
        isSyncing: false,
        syncStatus: 'idle',
        pollingInterval: null,
      });
    } catch (err: unknown) {
      console.error('Failed to cancel sync:', err);
    }
  },

  resetSyncState: () => {
    const { pollingInterval } = get();

    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    set({
      syncStatus: 'idle',
      isSyncing: false,
      syncProgress: {
        downloaded: 0,
        processed: 0,
        inserted: 0,
        duplicates: 0,
        errors: 0,
      },
      syncError: null,
      pollingInterval: null,
    });
  },

  // Export actions
  exportResults: async (format: ExportFormat) => {
    const { searchTerm, filters } = get();

    try {
      const response = await stjApi.exportResults({
        termo: searchTerm || undefined,
        orgao: filters.orgao || undefined,
        dias: filters.dias,
        campo: filters.campo,
        format,
      });

      // Create download link
      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `stj_export_${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error('Failed to export results:', err);
      throw err;
    }
  },
}));

export default useSTJStore;
