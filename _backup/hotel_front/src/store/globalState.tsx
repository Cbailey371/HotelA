import { GlobalActions } from "@/models/global-actions";
import { GlobalState } from "@/models/global-state";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useStore = create<
  GlobalState & GlobalActions,
  [["zustand/persist", Partial<GlobalState>]]
>(
  persist(
    (set) => ({
      openSideNav: false,
      setOpenSideNav: (openSideNav) => set({ openSideNav }),

      assets: [],
      setAssets: (assets) => set({ assets }),

      providers: [],
      setProviders: (providers) => set({ providers }),

      locations: [],
      setLocations: (locations) => set({ locations }),

      notifications: [],
      setNotifications: (notifications) => set({ notifications }),

      technicians: [],
      setTechnicians: (technicians) => set({ technicians }),
    }),
    {
      name: "global-state",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({}),
    }
  )
);
