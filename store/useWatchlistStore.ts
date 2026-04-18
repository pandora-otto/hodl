import { create } from 'zustand';
import { saveData, loadData, STORAGE_KEYS } from '../utils/storage';

export interface WatchlistCoin {
    id: string;
    name: string;
    symbol: string;
    thumb: string;
}

interface WatchlistStore {
    coins: WatchlistCoin[];
    hydrated: boolean;
    hydrate: () => Promise<void>;
    addCoin: (coin: WatchlistCoin) => void;
    removeCoin: (id: string) => void;
    hasCoin: (id: string) => boolean;
}

export const useWatchlistStore = create<WatchlistStore>((set, get) => ({
    coins: [],
    hydrated: false,

    hydrate: async () => {
        const saved = await loadData<WatchlistCoin[]>(STORAGE_KEYS.WATCHLIST);
        set({ coins: saved ?? [], hydrated: true });
    },

    addCoin: (coin) => {
        const { coins } = get();
        if (coins.length >= 10) return;
        if (coins.find((c) => c.id === coin.id)) return;
        const updated = [...coins, coin];
        set({ coins: updated });
        saveData(STORAGE_KEYS.WATCHLIST, updated);
    },

    removeCoin: (id) => {
        const updated = get().coins.filter((c) => c.id !== id);
        set({ coins: updated });
        saveData(STORAGE_KEYS.WATCHLIST, updated);
    },

    hasCoin: (id) => get().coins.some((c) => c.id === id),
}));
