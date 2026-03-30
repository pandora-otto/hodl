const BASE_URL = 'https://api.coingecko.com/api/v3';

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
export async function fetchMarkets(coinIds: string[]): Promise<CoinMarket[]> {
  if (coinIds.length === 0) return [];
  const ids = coinIds.join(',');
  const url = `${BASE_URL}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&price_change_percentage=1h,24h,7d`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko markets error: ${res.status}`);
  return res.json();
}

// Search coins by name or ticker
export async function searchCoins(query: string): Promise<CoinSearchResult[]> {
  const url = `${BASE_URL}/search?query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko search error: ${res.status}`);
  const data = await res.json();
  return data.coins.slice(0, 20);
}

// Fetch chart data for a coin
// days can be: 1, 7, 30, 90, 365, 'max'
export async function fetchChartData(coinId: string, days: number | string): Promise<ChartData> {
  const url = `${BASE_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko chart error: ${res.status}`);
  return res.json();
}

// Fetch detailed coin info (rank, supply, etc.)
export async function fetchCoinDetail(coinId: string): Promise<any> {
  const url = `${BASE_URL}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko detail error: ${res.status}`);
  return res.json();
}