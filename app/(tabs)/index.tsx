import { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWatchlistStore } from '../../store/useWatchlistStore';
import { usePriceStore } from '../../store/usePriceStore';
import { useSettingsStore, CURRENCIES } from '../../store/useSettingsStore';
import { theme } from '../../constants/theme';
import CoinRow from '../../components/CoinRow';
import LoadingBar from '../../components/LoadingBar';
import { CoinMarket } from '../../services/coingecko';
import { fetchTopCoins } from '../../services/coingecko';
import Svg, { Line, Circle, Path } from 'react-native-svg';
import { config } from '../../constants/config';
import Toast from '../../components/Toast';

type SortField = 'rank' | 'name' | 'price' | '1h' | '24h' | '7d';
type SortDir = 'asc' | 'desc';
type ViewMode = 'coins' | 'favorites';

const PER_PAGE = config.COINS_PER_PAGE;

function sortCoins(coins: CoinMarket[], field: SortField, dir: SortDir): CoinMarket[] {
    return [...coins].sort((a, b) => {
        let valA: number | string;
        let valB: number | string;
        switch (field) {
            case 'rank':
                valA = a.market_cap_rank;
                valB = b.market_cap_rank;
                break;
            case 'name':
                valA = a.name.toLowerCase();
                valB = b.name.toLowerCase();
                break;
            case 'price':
                valA = a.current_price;
                valB = b.current_price;
                break;
            case '1h':
                valA = a.price_change_percentage_1h_in_currency;
                valB = b.price_change_percentage_1h_in_currency;
                break;
            case '24h':
                valA = a.price_change_percentage_24h_in_currency;
                valB = b.price_change_percentage_24h_in_currency;
                break;
            case '7d':
                valA = a.price_change_percentage_7d_in_currency;
                valB = b.price_change_percentage_7d_in_currency;
                break;
        }
        if (valA < valB) return dir === 'asc' ? -1 : 1;
        if (valA > valB) return dir === 'asc' ? 1 : -1;
        return 0;
    });
}

interface ColumnHeaderProps {
    label: string;
    field: SortField;
    currentField: SortField;
    currentDir: SortDir;
    onPress: (field: SortField) => void;
    align?: 'left' | 'right';
    style?: object;
}

function ColumnHeader({
    label,
    field,
    currentField,
    currentDir,
    onPress,
    align = 'right',
    style,
}: ColumnHeaderProps) {
    const isActive = currentField === field;
    const arrow = isActive ? (currentDir === 'asc' ? '▲' : '▼') : '';
    return (
        <TouchableOpacity onPress={() => onPress(field)} activeOpacity={0.7}>
            <Text
                style={[
                    styles.label,
                    align === 'left' ? { textAlign: 'left' } : { textAlign: 'right' },
                    style,
                    isActive && styles.labelActive,
                ]}
            >
                {label}
                {arrow}
            </Text>
        </TouchableOpacity>
    );
}

function SearchIcon({ focused }: { focused: boolean }) {
    const color = focused ? theme.text.primary : theme.text.secondary;
    return (
        <Svg width={24} height={24} viewBox="0 0 24 24" stroke={color} strokeWidth="2" fill="none">
            <Circle cx="14.86" cy="9.14" r="7.64"></Circle>
            <Line x1="1.5" y1="22.5" x2="9.14" y2="14.86"></Line>
        </Svg>
    );
}

function FavoritesIcon({ focused, hasFavorites }: { focused: boolean; hasFavorites?: boolean }) {
    const color = focused ? theme.text.primary : theme.text.secondary;
    const fill = hasFavorites ? (focused ? '#fff' : theme.text.secondary) : 'none';
    return (
        <Svg width={24} height={24} viewBox="0 0 24 24" stroke={color} strokeWidth="2" fill={fill}>
            <Path d="M11.2691 4.41115C11.5006 3.89177 11.6164 3.63208 11.7776 3.55211C11.9176 3.48263 12.082 3.48263 12.222 3.55211C12.3832 3.63208 12.499 3.89177 12.7305 4.41115L14.5745 8.54808C14.643 8.70162 14.6772 8.77839 14.7302 8.83718C14.777 8.8892 14.8343 8.93081 14.8982 8.95929C14.9705 8.99149 15.0541 9.00031 15.2213 9.01795L19.7256 9.49336C20.2911 9.55304 20.5738 9.58288 20.6997 9.71147C20.809 9.82316 20.8598 9.97956 20.837 10.1342C20.8108 10.3122 20.5996 10.5025 20.1772 10.8832L16.8125 13.9154C16.6877 14.0279 16.6252 14.0842 16.5857 14.1527C16.5507 14.2134 16.5288 14.2807 16.5215 14.3503C16.5132 14.429 16.5306 14.5112 16.5655 14.6757L17.5053 19.1064C17.6233 19.6627 17.6823 19.9408 17.5989 20.1002C17.5264 20.2388 17.3934 20.3354 17.2393 20.3615C17.0619 20.3915 16.8156 20.2495 16.323 19.9654L12.3995 17.7024C12.2539 17.6184 12.1811 17.5765 12.1037 17.56C12.0352 17.5455 11.9644 17.5455 11.8959 17.56C11.8185 17.5765 11.7457 17.6184 11.6001 17.7024L7.67662 19.9654C7.18404 20.2495 6.93775 20.3915 6.76034 20.3615C6.60623 20.3354 6.47319 20.2388 6.40075 20.1002C6.31736 19.9408 6.37635 19.6627 6.49434 19.1064L7.4341 14.6757C7.46898 14.5112 7.48642 14.429 7.47814 14.3503C7.47081 14.2807 7.44894 14.2134 7.41394 14.1527C7.37439 14.0842 7.31195 14.0279 7.18708 13.9154L3.82246 10.8832C3.40005 10.5025 3.18884 10.3122 3.16258 10.1342C3.13978 9.97956 3.19059 9.82316 3.29993 9.71147C3.42581 9.58288 3.70856 9.55304 4.27406 9.49336L8.77835 9.01795C8.94553 9.00031 9.02911 8.99149 9.10139 8.95929C9.16534 8.93081 9.2226 8.8892 9.26946 8.83718C9.32241 8.77839 9.35663 8.70162 9.42508 8.54808L11.2691 4.41115Z"></Path>
        </Svg>
    );
}

export default function WatchlistScreen() {
    const router = useRouter();
    const { coins, hydrated, addCoin, hasCoin, removeCoin } = useWatchlistStore();
    const prices = usePriceStore((state) => state.prices);
    const loading = usePriceStore((state) => state.loading);
    const { display, defaultView, currency } = useSettingsStore();
    const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? '$';

    const [view, setView] = useState<ViewMode>(defaultView);
    useEffect(() => {
        setView(defaultView);
    }, [defaultView]);
    const [sortField, setSortField] = useState<SortField>('rank');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    // Coins list state
    const [topCoins, setTopCoins] = useState<CoinMarket[]>([]);
    const [page, setPage] = useState(1);
    const [loadingCoins, setLoadingCoins] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const [toastMsg, setToastMsg] = useState('');
    const [toastVisible, setToastVisible] = useState(false);
    const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = (msg: string) => {
        if (toastTimeout.current) clearTimeout(toastTimeout.current);
        setToastMsg(msg);
        setTimeout(() => setToastVisible(true), 100); // slight delay to allow message to update before showing
        setToastVisible(true);
        toastTimeout.current = setTimeout(() => {
            setToastVisible(false);
            setTimeout(() => setToastMsg(''), 300); // wait for fade out animation to finish
        }, 4000);
    };

    const MAX_FAVORITES = config.MAX_FAVORITES;
    const COINS_REFRESH_MS = config.COINS_REFRESH_MS;
    const lastCoinsRefresh = useRef<number>(0);
    const coinsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const openCloseRef = useRef<(() => void) | null>(null);
    const openIdRef = useRef<string | null>(null);

    // Simplify handleSwipeOpen:
    const handleSwipeOpen = (closeFn: () => void, id: string) => {
        openCloseRef.current?.();
        openCloseRef.current = closeFn;
        openIdRef.current = id;
    };

    // Simplify handleSwipeClose:
    const handleSwipeClose = (id: string) => {
        if (openIdRef.current === id) {
            openCloseRef.current = null;
            openIdRef.current = null;
        }
    };

    const handleSort = (field: SortField) => {
        if (field === sortField) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    // Load top coins
    const loadCoins = useCallback(
        async (pageNum: number, replace: boolean = false) => {
            if (pageNum === 1) setLoadingCoins(true);
            else setLoadingMore(true);
            try {
                const data = await fetchTopCoins(pageNum, PER_PAGE, currency);
                if (replace) {
                    setTopCoins(data);
                } else {
                    setTopCoins((prev) => [...prev, ...data]);
                }
                setHasMore(data.length === PER_PAGE);
                setPage(pageNum);
            } catch (e) {
                console.warn('Top coins fetch failed:', e);
            } finally {
                setLoadingCoins(false);
                setLoadingMore(false);
            }
        },
        [currency],
    );

    useEffect(() => {
        if (view === 'coins') {
            // Refresh immediately if stale
            const isStale = Date.now() - lastCoinsRefresh.current > COINS_REFRESH_MS;
            if (isStale || topCoins.length === 0) {
                loadCoins(1, true);
                lastCoinsRefresh.current = Date.now();
            }

            // Set up interval while on coins view
            coinsIntervalRef.current = setInterval(() => {
                loadCoins(1, true);
                lastCoinsRefresh.current = Date.now();
            }, COINS_REFRESH_MS);

            return () => {
                if (coinsIntervalRef.current) clearInterval(coinsIntervalRef.current);
            };
        }
    }, [view, currency]);

    const handleLoadMore = () => {
        if (!loadingMore && hasMore && view === 'coins') {
            loadCoins(page + 1);
        }
    };

    const toggleFavorite = (coin: CoinMarket) => {
        if (hasCoin(coin.id)) {
            removeCoin(coin.id);
            showToast(`${coin.name} removed from favorites`);
            return;
        }
        if (coins.length >= MAX_FAVORITES) {
            showToast(`Favorites full — max ${MAX_FAVORITES} reached`);
            return;
        }
        addCoin({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            thumb: coin.image,
        });
        showToast(`${coin.name} added to favorites`);
    };

    // Favorites data
    const favCoins = coins.map((c) => prices[c.id]).filter(Boolean) as CoinMarket[];
    const sortedFavs = sortCoins(favCoins, sortField, sortDir);
    const sortedTopCoins = sortCoins(topCoins, sortField, sortDir);

    const activeCoins = view === 'favorites' ? sortedFavs : sortedTopCoins;

    const safeDisplay = display ?? { show1h: true, show24h: true, show7d: true };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                {/* View Dropdown */}
                <View style={styles.viewToggle}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, view === 'coins' && styles.toggleBtnActive]}
                        onPress={() => setView('coins')}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[styles.toggleText, view === 'coins' && styles.toggleTextActive]}
                        >
                            Coins
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, view === 'favorites' && styles.toggleBtnActive]}
                        onPress={() => setView('favorites')}
                        activeOpacity={0.7}
                    >
                        <FavoritesIcon
                            focused={view === 'favorites'}
                            hasFavorites={coins.length > 0}
                        />
                        <Text
                            style={[
                                styles.toggleText,
                                view === 'favorites' && styles.toggleTextActive,
                            ]}
                        >
                            Favorites
                        </Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push('/search')}
                    activeOpacity={0.7}
                >
                    <SearchIcon focused={true} />
                </TouchableOpacity>
            </View>

            {/* Loading Bar — only for favorites */}
            {/* {view === 'favorites' && <LoadingBar loading={loading} />} */}

            <LoadingBar loading={view === 'favorites' ? loading : loadingCoins || loadingMore} />

            {/* Column Headers */}
            {activeCoins.length > 0 && (
                <View style={styles.columnRow}>
                    <View style={styles.leftLabels}>
                        <ColumnHeader
                            style={styles.rankLabel}
                            label="#"
                            field="rank"
                            currentField={sortField}
                            currentDir={sortDir}
                            onPress={handleSort}
                            align="left"
                        />
                        <ColumnHeader
                            style={styles.labelname}
                            label="Coin"
                            field="name"
                            currentField={sortField}
                            currentDir={sortDir}
                            onPress={handleSort}
                            align="left"
                        />
                    </View>
                    <View style={styles.rightLabels}>
                        <ColumnHeader
                            style={styles.label}
                            label="Price"
                            field="price"
                            currentField={sortField}
                            currentDir={sortDir}
                            onPress={handleSort}
                        />
                        {safeDisplay.show1h && (
                            <ColumnHeader
                                style={styles.label}
                                label="1H"
                                field="1h"
                                currentField={sortField}
                                currentDir={sortDir}
                                onPress={handleSort}
                            />
                        )}
                        {safeDisplay.show24h && (
                            <ColumnHeader
                                style={styles.label}
                                label="24H"
                                field="24h"
                                currentField={sortField}
                                currentDir={sortDir}
                                onPress={handleSort}
                            />
                        )}
                        {safeDisplay.show7d && (
                            <ColumnHeader
                                style={styles.label}
                                label="7D"
                                field="7d"
                                currentField={sortField}
                                currentDir={sortDir}
                                onPress={handleSort}
                            />
                        )}
                    </View>
                </View>
            )}

            {/* Coins View */}
            {view === 'coins' &&
                (loadingCoins ? (
                    <View style={styles.center}>
                        <ActivityIndicator color={theme.accent.blue} />
                    </View>
                ) : (
                    <FlatList
                        data={activeCoins}
                        keyExtractor={(item) => item.id}
                        onScrollBeginDrag={() => {
                            openCloseRef.current?.();
                            openCloseRef.current = null;
                            openIdRef.current = null;
                        }}
                        renderItem={({ item }) => (
                            <CoinRow
                                coin={item}
                                onPress={() => {
                                    usePriceStore.getState().setTempCoin(item);
                                    router.push(`/coin/${item.id}`);
                                }}
                                onLongPress={() => toggleFavorite(item)}
                                isFavorite={hasCoin(item.id)}
                                onSwipeStar={() => toggleFavorite(item)}
                                onSwipeBell={() => {
                                    usePriceStore.getState().setTempCoin(item);
                                    router.push(`/coin/${item.id}`);
                                }}
                                onSwipeOpen={handleSwipeOpen}
                                onSwipeClose={(id) => handleSwipeClose(id)}
                            />
                        )}
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.3}
                        ListFooterComponent={
                            loadingMore ? (
                                <View style={styles.footer}>
                                    <ActivityIndicator color={theme.accent.blue} />
                                </View>
                            ) : null
                        }
                    />
                ))}

            {/* Favorites View */}
            {view === 'favorites' &&
                (!hydrated ? (
                    <View style={styles.center}>
                        <Text style={styles.muted}>Loading...</Text>
                    </View>
                ) : sortedFavs.length === 0 ? (
                    <View style={styles.center}>
                        <Text style={styles.emptyTitle}>No favorites yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Switch to Coins and swipe left or long press on any coin to add it to
                            your favorites
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={sortedFavs}
                        keyExtractor={(item) => item.id}
                        onScrollBeginDrag={() => {
                            openCloseRef.current?.();
                            openCloseRef.current = null;
                            openIdRef.current = null;
                        }}
                        renderItem={({ item }) => (
                            <CoinRow
                                coin={item}
                                onPress={() => router.push(`/coin/${item.id}`)}
                                onLongPress={() => toggleFavorite(item)}
                                isFavorite={true}
                                onSwipeStar={() => toggleFavorite(item)}
                                onSwipeBell={() => {
                                    usePriceStore.getState().setTempCoin(item);
                                    router.push(`/coin/${item.id}`);
                                }}
                                onSwipeOpen={handleSwipeOpen}
                                onSwipeClose={(id) => handleSwipeClose(id)}
                            />
                        )}
                    />
                ))}

            <Toast message={toastMsg} visible={toastVisible} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.bg.primary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 50,
        paddingBottom: 8,
    },
    viewToggle: {
        flexDirection: 'row',
        backgroundColor: theme.bg.secondary,
        borderRadius: 20,
        padding: 3,
        borderWidth: 1,
        borderColor: theme.border,
    },
    toggleBtn: {
        paddingHorizontal: 16,
        paddingVertical: 2,
        borderRadius: 18,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    toggleBtnActive: {
        backgroundColor: theme.accent.blue,
    },
    toggleText: {
        color: theme.text.muted,
        fontSize: 13,
        fontWeight: '600',
    },

    toggleTextActive: {
        color: '#fff',
    },
    columnRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        // paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    leftLabels: {
        flexDirection: 'row',
        gap: 6,
    },
    addButton: {
        // backgroundColor: theme.accent.blue,
        paddingHorizontal: 8,
        paddingVertical: 6,
        // borderRadius: 20,
    },
    rankLabel: {
        color: theme.text.muted,
        fontSize: 12,
        fontWeight: '500',
        width: 26,
        textAlign: 'left',
    },
    labelname: {
        color: theme.text.muted,
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'left',
    },
    rightLabels: {
        flexDirection: 'row',
        gap: 8,
    },
    label: {
        color: theme.text.muted,
        fontSize: 12,
        fontWeight: '500',
        width: 45,
        textAlign: 'right',
    },
    labelActive: {
        color: theme.accent.blue,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    emptyTitle: {
        color: theme.text.primary,
        fontSize: 18,
        fontWeight: '600',
    },
    emptySubtitle: {
        color: theme.text.muted,
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    muted: {
        color: theme.text.muted,
        fontSize: 14,
    },
    footer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
});
