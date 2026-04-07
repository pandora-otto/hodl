import { create } from 'zustand';
import { saveData, loadData, STORAGE_KEYS } from '../utils/storage';

export type DefaultView = 'coins' | 'favorites';

export type Currency = 'usd' | 'eur' | 'gbp' | 'jpy' | 'chf';

export interface CurrencyInfo {
    code: Currency;
    symbol: string;
    label: string;
}

export const CURRENCIES: CurrencyInfo[] = [
    { code: 'usd', symbol: '$', label: 'USD - US Dollar' },
    { code: 'eur', symbol: '€', label: 'EUR - Euro' },
    { code: 'gbp', symbol: '£', label: 'GBP - British Pound' },
    { code: 'jpy', symbol: '¥', label: 'JPY - Japanese Yen' },
    { code: 'chf', symbol: 'Fr', label: 'CHF - Swiss Franc' },
];

export interface DisplaySettings {
    show1h: boolean;
    show24h: boolean;
    show7d: boolean;
}

export interface SettingsStore {
    currency: Currency;
    display: DisplaySettings;
    defaultView: DefaultView;
    hydrate: () => Promise<void>;
    setCurrency: (currency: Currency) => void;
    setDisplay: (display: DisplaySettings) => void;
    setDefaultView: (view: DefaultView) => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
    currency: 'usd',
    display: {
        show1h: true,
        show24h: true,
        show7d: true,
    },
    defaultView: 'coins',

    hydrate: async () => {
        const saved = await loadData<{
            currency: Currency;
            display: DisplaySettings;
            defaultView: DefaultView;
        }>(STORAGE_KEYS.SETTINGS);
        if (saved) {
            set({
                currency: saved.currency ?? 'usd',
                display: saved.display ?? { show1h: true, show24h: true, show7d: true },
                defaultView: saved.defaultView ?? 'coins',
            });
        }
    },

    setCurrency: (currency) => {
        const { display, defaultView } = get();
        set({ currency });
        saveData(STORAGE_KEYS.SETTINGS, { currency, display, defaultView });
    },

    setDisplay: (display) => {
        const { currency, defaultView } = get();
        set({ display });
        saveData(STORAGE_KEYS.SETTINGS, { currency, display, defaultView });
    },

    setDefaultView: (defaultView) => {
        const { currency, display } = get();
        set({ defaultView });
        saveData(STORAGE_KEYS.SETTINGS, { currency, display, defaultView });
    },
}));
