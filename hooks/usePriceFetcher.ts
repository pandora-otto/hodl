import { useEffect, useRef, useState } from 'react';
import { fetchMarkets } from '../services/coingecko';
import { useWatchlistStore } from '../store/useWatchlistStore';
import { usePriceStore } from '../store/usePriceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { config } from '../constants/config';

const INTERVAL_MS = config.PRICE_REFRESH_MS;

export function usePriceFetcher() {
    const coins = useWatchlistStore((state) => state.coins);
    const setPrices = usePriceStore((state) => state.setPrices);
    const setLoading = usePriceStore((state) => state.setLoading);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const currency = useSettingsStore((state) => state.currency);

    const fetchPrices = async () => {
        if (coins.length === 0) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const ids = coins.map((c) => c.id);
            const data = await fetchMarkets(ids, currency);
            setPrices(data);
        } catch (e) {
            console.warn('Price fetch failed:', e);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrices();
        intervalRef.current = setInterval(fetchPrices, INTERVAL_MS);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [coins, currency]);

    return { fetchPrices };
}
