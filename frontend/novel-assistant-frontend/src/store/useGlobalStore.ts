import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface GlobalState {
  // Sidebar state
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;

  // Theme state (example)
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useGlobalStore = create<GlobalState>()(
  devtools(
    persist(
      (set) => ({
        isSidebarOpen: true,
        toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
        setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
        
        theme: 'system',
        setTheme: (theme) => set({ theme }),
      }),
      {
        name: 'global-storage',
      }
    )
  )
);
