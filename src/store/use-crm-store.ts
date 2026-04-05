import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AdminUser = {
  id: string;
  username: string;
  role: string;
  fullName: string;
  mobile: string;
  email: string;
};

export type Module =
  | 'dashboard'
  | 'customers'
  | 'inventory'
  | 'sales'
  | 'invoices'
  | 'orders'
  | 'shop'
  | 'admins'
  | 'profile'
  | 'settings';

interface CRMState {
  // Auth
  admin: AdminUser | null;
  setAdmin: (admin: AdminUser | null) => void;
  isAuthenticated: () => boolean;
  isMasterAdmin: () => boolean;

  // Navigation
  currentModule: Module;
  setCurrentModule: (module: Module) => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useCRMStore = create<CRMState>()(
  persist(
    (set, get) => ({
      // Auth
      admin: null,
      setAdmin: (admin) => set({ admin }),
      isAuthenticated: () => get().admin !== null,
      isMasterAdmin: () => get().admin?.role === 'master',

      // Navigation
      currentModule: 'dashboard',
      setCurrentModule: (module) => set({ currentModule: module }),

      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    {
      name: 'crm-auth-storage',
      partialize: (state) => ({
        admin: state.admin,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
