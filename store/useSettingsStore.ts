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

export type ThemeMode = 'dark' | 'light' | 'system';

export interface DisplaySettings {
    show1h: boolean;
    show24h: boolean;
    show7d: boolean;
    showImage: boolean;
    showTabLabels: boolean;
}

export interface SettingsStore {
    currency: Currency;
    display: DisplaySettings;
    defaultView: DefaultView;
    themeMode: ThemeMode;
    hydrate: () => Promise<void>;
    setCurrency: (currency: Currency) => void;
    setDisplay: (display: DisplaySettings) => void;
    setDefaultView: (view: DefaultView) => void;
    setThemeMode: (mode: ThemeMode) => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
    currency: 'usd',
    display: {
        show1h: true,
        show24h: true,
        show7d: true,
        showImage: false,
        showTabLabels: true,
    },
    defaultView: 'coins',
    themeMode: 'system',

    hydrate: async () => {
        const saved = await loadData<{
            currency: Currency;
            display: DisplaySettings;
            defaultView: DefaultView;
            themeMode: ThemeMode;
        }>(STORAGE_KEYS.SETTINGS);
        if (saved) {
            set({
                currency: saved.currency ?? 'usd',
                display: saved.display ?? {
                    show1h: true,
                    show24h: true,
                    show7d: true,
                    showImage: false,
                    showTabLabels: true,
                },
                defaultView: saved.defaultView ?? 'coins',
                themeMode: saved.themeMode ?? 'dark',
            });
        }
    },

    setCurrency: (currency) => {
        const { display, defaultView, themeMode } = get();
        set({ currency });
        saveData(STORAGE_KEYS.SETTINGS, { currency, display, defaultView, themeMode });
    },

    setDisplay: (display) => {
        const { currency, defaultView, themeMode } = get();
        set({ display });
        saveData(STORAGE_KEYS.SETTINGS, { currency, display, defaultView, themeMode });
    },

    setDefaultView: (defaultView) => {
        const { currency, display, themeMode } = get();
        set({ defaultView });
        saveData(STORAGE_KEYS.SETTINGS, { currency, display, defaultView, themeMode });
    },

    setThemeMode: (themeMode) => {
        const { currency, display, defaultView } = get();
        set({ themeMode });
        saveData(STORAGE_KEYS.SETTINGS, { currency, display, defaultView, themeMode });
    },
}));
