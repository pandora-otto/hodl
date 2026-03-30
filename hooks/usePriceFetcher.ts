import { useEffect, useRef } from 'react';
import { fetchMarkets } from '../services/coingecko';
import { useWatchlistStore } from '../store/useWatchlistStore';
import { usePriceStore } from '../store/usePriceStore';

const INTERVAL_MS = 60_000; // 60 seconds

export function usePriceFetcher() {
  const coins = useWatchlistStore(state => state.coins);
  const setPrices = usePriceStore(state => state.setPrices);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPrices = async () => {
    if (coins.length === 0) return;
    try {
      const ids = coins.map(c => c.id);
      const data = await fetchMarkets(ids);
      setPrices(data);
    } catch (e) {
      console.warn('Price fetch failed:', e);
    }
  };

  useEffect(() => {
    fetchPrices(); // fetch immediately on mount

    intervalRef.current = setInterval(fetchPrices, INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [coins]); // re-runs if watchlist changes
}