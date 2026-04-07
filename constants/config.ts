export const config = {
    // Polling intervals
    PRICE_REFRESH_MS: 2 * 60_000, // 2 minutes
    COINS_REFRESH_MS: 5 * 60_000, // 5 minutes
    CHART_CACHE_MS: 3 * 60_000, // 3 minutes

    // Pagination
    COINS_PER_PAGE: 100,

    // Limits
    MAX_FAVORITES: 10,
    SEARCH_MIN_CHARS: 2,
    SEARCH_DEBOUNCE_MS: 500,
};
