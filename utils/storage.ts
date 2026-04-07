import AsyncStorage from '@react-native-async-storage/async-storage';

export async function saveData<T>(key: string, value: T): Promise<void> {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Storage save error [${key}]:`, e);
    }
}

export async function loadData<T>(key: string): Promise<T | null> {
    try {
        const raw = await AsyncStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch (e) {
        console.error(`Storage load error [${key}]:`, e);
        return null;
    }
}

export async function removeData(key: string): Promise<void> {
    try {
        await AsyncStorage.removeItem(key);
    } catch (e) {
        console.error(`Storage remove error [${key}]:`, e);
    }
}

export const STORAGE_KEYS = {
    WATCHLIST: 'hodl_watchlist',
    PRICES: 'hodl_prices',
    ALERTS: 'hodl_alerts',
    SETTINGS: 'hodl_settings',
};
