import { create } from 'zustand';
import { CoinMarket } from '../services/coingecko';
import { saveData, loadData, STORAGE_KEYS } from '../utils/storage';

interface PriceStore {
  prices: Record<string, CoinMarket>;
  lastUpdated: number | null;
  loading: boolean;
  hydrate: () => Promise<void>;
  setPrices: (data: CoinMarket[]) => void;
  setLoading: (val: boolean) => void;
}

export const usePriceStore = create<PriceStore>((set) => ({
  prices: {},
  lastUpdated: null,
  loading: false,

  hydrate: async () => {
    const saved = await loadData<Record<string, CoinMarket>>(STORAGE_KEYS.PRICES);
    if (saved) set({ prices: saved });
  },

  setPrices: (data) => {
    const prices: Record<string, CoinMarket> = {};
    data.forEach(coin => { prices[coin.id] = coin; });
    set({ prices, lastUpdated: Date.now() });
    saveData(STORAGE_KEYS.PRICES, prices);
  },

  setLoading: (val) => set({ loading: val }),
}));