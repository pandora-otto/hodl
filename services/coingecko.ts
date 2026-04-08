import { config } from '../constants/config';

const COINGECKO_BASE_URL = process.env.EXPO_PUBLIC_COINGECKO_BASE_URL;
const API_KEY = process.env.EXPO_PUBLIC_COINGECKO_API_KEY ?? '';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

const headers = {
    'x-cg-demo-api-key': API_KEY,
};

// Add chart caching
const chartCache: Record<string, { data: ChartData; timestamp: number }> = {};
const CHART_CACHE_MS = config.CHART_CACHE_MS; // from config

export interface CoinMarket {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    market_cap: number;
    market_cap_rank: number;
    price_change_percentage_1h_in_currency: number;
    price_change_percentage_24h_in_currency: number;
    price_change_percentage_7d_in_currency: number;
    low_24h: number;
    high_24h: number;
    total_volume: number;
    circulating_supply: number;
    total_supply: number | null;
}

export interface CoinSearchResult {
    id: string;
    name: string;
    symbol: string;
    thumb: string;
    market_cap_rank: number;
}

export interface ChartData {
    prices: [number, number][];
    total_volumes: [number, number][];
}

// Fetch live data for up to 10 coins in a single API call
export async function fetchMarkets(
    coinIds: string[],
    currency: string = 'usd',
): Promise<CoinMarket[]> {
    if (coinIds.length === 0) return [];
    const ids = coinIds.join(',');
    console.log(`Fetching prices for: ${ids} every ${config.PRICE_REFRESH_MS / 1000} seconds`);
    const url = `${SUPABASE_URL}/coins-markets?vs_currency=${currency}&ids=${ids}&order=market_cap_desc&price_change_percentage=1h,24h,7d`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Supabase coin-markets error: ${res.status}`);
    return res.json();
}

// Search coins by name or ticker
export async function searchCoins(query: string): Promise<CoinSearchResult[]> {
    const url = `${COINGECKO_BASE_URL}/search?query=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`CoinGecko search error: ${res.status}`);
    const data = await res.json();
    console.log(`Search results for "${query}":`, data.coins.slice(0, 20));
    return data.coins.slice(0, 20);
}

// Fetch chart data for a coin
// days can be: 1, 7, 30, 90, 365, 'max'
export async function fetchChartData(
    coinId: string,
    days: number | string,
    currency: string = 'usd',
): Promise<ChartData> {
    const cacheKey = `${coinId}_${days}_${currency}`;
    const cached = chartCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CHART_CACHE_MS) {
        return cached.data;
    }
    console.log(
        `Fetching chart data for ${coinId} (${days} days) every ${config.CHART_CACHE_MS / 1000} seconds`,
    );
    const url = `${COINGECKO_BASE_URL}/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`CoinGecko chart error: ${res.status}`);
    const data = await res.json();
    chartCache[cacheKey] = { data, timestamp: Date.now() };
    return data;
}

// Fetch detailed coin info (rank, supply, etc.)
export async function fetchCoinDetail(coinId: string): Promise<any> {
    console.log(
        `Fetching detail for coin: ${coinId} every ${config.COINS_REFRESH_MS / 1000} seconds`,
    );
    const url = `${COINGECKO_BASE_URL}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`CoinGecko detail error: ${res.status}`);
    console.log(`Fetching detail for coin: ${coinId}`);
    return res.json();
}

export async function fetchTopCoins(
    page: number = 1,
    perPage: number = config.COINS_PER_PAGE,
    currency: string = 'usd',
): Promise<CoinMarket[]> {
    console.log(
        `Fetching top coins: page ${page}, perPage ${perPage} every ${config.COINS_REFRESH_MS / 1000} seconds`,
    );
    const url = `${COINGECKO_BASE_URL}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${perPage}&page=${page}&price_change_percentage=1h,24h,7d`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`CoinGecko top coins error: ${res.status}`);
    return res.json();
}
