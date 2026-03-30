import { create } from 'zustand';
import { saveData, loadData, STORAGE_KEYS } from '../utils/storage';

export type AlertDirection = 'above' | 'below';

export interface PriceAlert {
  id: string;
  coinId: string;
  coinName: string;
  targetPrice: number;
  direction: AlertDirection;
  triggered: boolean;
}

interface AlertStore {
  alerts: PriceAlert[];
  hydrate: () => Promise<void>;
  addAlert: (alert: PriceAlert) => void;
  removeAlert: (id: string) => void;
  markTriggered: (id: string) => void;
}

export const useAlertStore = create<AlertStore>((set, get) => ({
  alerts: [],

  hydrate: async () => {
    const saved = await loadData<PriceAlert[]>(STORAGE_KEYS.ALERTS);
    set({ alerts: saved ?? [] });
  },

  addAlert: (alert) => {
    const updated = [...get().alerts, alert];
    set({ alerts: updated });
    saveData(STORAGE_KEYS.ALERTS, updated);
  },

  removeAlert: (id) => {
    const updated = get().alerts.filter(a => a.id !== id);
    set({ alerts: updated });
    saveData(STORAGE_KEYS.ALERTS, updated);
  },

  markTriggered: (id) => {
    const updated = get().alerts.map(a =>
      a.id === id ? { ...a, triggered: true } : a
    );
    set({ alerts: updated });
    saveData(STORAGE_KEYS.ALERTS, updated);
  },
}));