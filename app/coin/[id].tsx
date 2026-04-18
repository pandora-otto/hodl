import { ErrorBoundary } from '../../components/ErrorBoundary';
import { useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchChartData } from '../../services/coingecko';
import { usePriceStore } from '../../store/usePriceStore';
import { useWatchlistStore } from '../../store/useWatchlistStore';
import { useAlertStore } from '../../store/useAlertStore';
import { theme } from '../../constants/theme';
import CoinHeader from '../../components/CoinHeader';
import PriceChart from '../../components/PriceChart';
import TimeRangeSelector, { TimeRange } from '../../components/TimeRangeSelector';
import CoinInfoTable from '../../components/CoinInfoTable';
import { formatPrice } from '../../utils/formatters';
import { useEffect } from 'react';
import { useSettingsStore, CURRENCIES } from '../../store/useSettingsStore';
import { fetchMarkets } from '../../services/coingecko';
// import { CoinMarket } from '../../services/coingecko';
import Toast from '../../components/Toast';
import { config } from '../../constants/config';

function FavoritesIcon({ filled }: { filled: boolean }) {
    return (
        <Svg
            width={24}
            height={24}
            viewBox="0 0 24 24"
            stroke={theme.accent.star}
            strokeWidth="2"
            fill={filled ? theme.accent.star : 'none'}
        >
            <Path d="M11.2691 4.41115C11.5006 3.89177 11.6164 3.63208 11.7776 3.55211C11.9176 3.48263 12.082 3.48263 12.222 3.55211C12.3832 3.63208 12.499 3.89177 12.7305 4.41115L14.5745 8.54808C14.643 8.70162 14.6772 8.77839 14.7302 8.83718C14.777 8.8892 14.8343 8.93081 14.8982 8.95929C14.9705 8.99149 15.0541 9.00031 15.2213 9.01795L19.7256 9.49336C20.2911 9.55304 20.5738 9.58288 20.6997 9.71147C20.809 9.82316 20.8598 9.97956 20.837 10.1342C20.8108 10.3122 20.5996 10.5025 20.1772 10.8832L16.8125 13.9154C16.6877 14.0279 16.6252 14.0842 16.5857 14.1527C16.5507 14.2134 16.5288 14.2807 16.5215 14.3503C16.5132 14.429 16.5306 14.5112 16.5655 14.6757L17.5053 19.1064C17.6233 19.6627 17.6823 19.9408 17.5989 20.1002C17.5264 20.2388 17.3934 20.3354 17.2393 20.3615C17.0619 20.3915 16.8156 20.2495 16.323 19.9654L12.3995 17.7024C12.2539 17.6184 12.1811 17.5765 12.1037 17.56C12.0352 17.5455 11.9644 17.5455 11.8959 17.56C11.8185 17.5765 11.7457 17.6184 11.6001 17.7024L7.67662 19.9654C7.18404 20.2495 6.93775 20.3915 6.76034 20.3615C6.60623 20.3354 6.47319 20.2388 6.40075 20.1002C6.31736 19.9408 6.37635 19.6627 6.49434 19.1064L7.4341 14.6757C7.46898 14.5112 7.48642 14.429 7.47814 14.3503C7.47081 14.2807 7.44894 14.2134 7.41394 14.1527C7.37439 14.0842 7.31195 14.0279 7.18708 13.9154L3.82246 10.8832C3.40005 10.5025 3.18884 10.3122 3.16258 10.1342C3.13978 9.97956 3.19059 9.82316 3.29993 9.71147C3.42581 9.58288 3.70856 9.55304 4.27406 9.49336L8.77835 9.01795C8.94553 9.00031 9.02911 8.99149 9.10139 8.95929C9.16534 8.93081 9.2226 8.8892 9.26946 8.83718C9.32241 8.77839 9.35663 8.70162 9.42508 8.54808L11.2691 4.41115Z"></Path>
        </Svg>
    );
}

export default function CoinDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const storedCoin = usePriceStore((state) => state.prices[id]);
    const tempCoin = usePriceStore((state) => state.tempCoin);
    const [localCoin, setLocalCoin] = useState(storedCoin ?? tempCoin ?? null);
    const coin = storedCoin ?? localCoin;
    const removeCoin = useWatchlistStore((state) => state.removeCoin);
    const addCoin = useWatchlistStore((state) => state.addCoin);
    const hasCoin = useWatchlistStore((state) => state.hasCoin);
    const coinsCount = useWatchlistStore((state) => state.coins.length);
    const isFavorite = hasCoin(id);

    const [range, setRange] = useState<TimeRange>('1');
    const [chartData, setChartData] = useState<{ timestamp: number; value: number }[]>([]);
    const [chartLoading, setChartLoading] = useState(true);

    const [chartChange, setChartChange] = useState<number | null>(null);
    const [chartLow, setChartLow] = useState<number | null>(null);
    const [chartHigh, setChartHigh] = useState<number | null>(null);

    const currency = useSettingsStore((state) => state.currency);
    const symbol = useMemo(
        () => CURRENCIES.find((c) => c.code === currency)?.symbol ?? '$',
        [currency],
    );

    const [toastMsg, setToastMsg] = useState('');
    const [toastVisible, setToastVisible] = useState(false);
    const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback((msg: string) => {
        if (toastTimeout.current) clearTimeout(toastTimeout.current);
        setToastMsg(msg);
        setToastVisible(true);
        toastTimeout.current = setTimeout(() => {
            setToastVisible(false);
            setTimeout(() => setToastMsg(''), 300);
        }, 4000);
    }, []);

    useEffect(() => {
        loadChart();
    }, [id, range]);

    useEffect(() => {
        // Only fetch if we have nothing at all
        if (!storedCoin && !tempCoin) {
            fetchMarkets([id], currency)
                .then((data) => {
                    if (data.length > 0) setLocalCoin(data[0]);
                })
                .catch((e) => console.warn('Coin fetch failed:', e));
        }
    }, [id, currency]);

    const loadChart = async () => {
        setChartLoading(true);
        setChartChange(null);
        setChartLow(null);
        setChartHigh(null);
        try {
            const apiRange = range === '4H' ? '1' : range;
            const raw = await fetchChartData(id, apiRange, currency);
            let prices = raw.prices;

            // If 4H selected, slice to last 4 hours of data
            if (range === '4H') {
                const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;
                prices = prices.filter(([timestamp]) => timestamp >= fourHoursAgo);
            }

            const formatted = prices.map(([timestamp, value]) => ({
                timestamp,
                value,
            }));
            setChartData(formatted);

            // Calculate low, high, change from chart data
            const priceValues = formatted.map((d) => d.value);
            const low = Math.min(...priceValues);
            const high = Math.max(...priceValues);
            const first = priceValues[0];
            const last = priceValues[priceValues.length - 1];
            const change = ((last - first) / first) * 100;

            setChartLow(low);
            setChartHigh(high);
            setChartChange(change);
        } catch (e) {
            console.warn('Chart fetch failed:', e);
        } finally {
            setChartLoading(false);
        }
    };

    const handleToggleFavorite = useCallback(() => {
        if (isFavorite) {
            removeCoin(id);
            showToast(`${coin?.name} removed from favorites`);
        } else {
            if (coinsCount >= config.MAX_FAVORITES) {
                showToast(`Favorites full — max ${config.MAX_FAVORITES} reached`);
                return;
            }
            addCoin({ id: coin.id, name: coin.name, symbol: coin.symbol, thumb: coin.image });
            showToast(`${coin?.name} added to favorites`);
        }
    }, [isFavorite, coin, coinsCount, showToast]);

    if (!coin) {
        return (
            <View style={styles.center}>
                <Text style={styles.muted}>Loading coin data...</Text>
            </View>
        );
    }

    return (
        <ErrorBoundary>
            <View style={styles.container}>
                {/* Top action bar */}
                <View style={styles.actionBar}>
                    <View style={styles.image_symbol}>
                        <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 8 }}>
                            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                                <Path
                                    d="M15 18L9 12L15 6"
                                    stroke={styles.back.color}
                                    strokeWidth={3}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </Svg>
                        </TouchableOpacity>
                        <Image source={{ uri: coin.image }} style={styles.image} />
                        <Text style={styles.symbol}>{coin.symbol.toUpperCase()}</Text>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.alertBtn}
                            onPress={() =>
                                router.push({
                                    pathname: '/alert/new',
                                    params: {
                                        coinId: coin.id,
                                        coinName: coin.name,
                                        currentPrice: coin.current_price.toString(),
                                    },
                                })
                            }
                            activeOpacity={0.7}
                        >
                            <Svg
                                width={24}
                                height={24}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={theme.text.primary}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </Svg>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.starBtn}
                            onPress={handleToggleFavorite}
                            activeOpacity={0.7}
                        >
                            <FavoritesIcon filled={isFavorite} />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <CoinHeader
                        coin={coin}
                        change={chartChange}
                        low={chartLow}
                        high={chartHigh}
                        loading={chartLoading}
                        range={range}
                    />
                    <PriceChart data={chartData} loading={chartLoading} onRetry={loadChart} />
                    <TimeRangeSelector selected={range} onSelect={setRange} />
                    <CoinInfoTable coin={coin} />
                    <View style={{ height: 40 }} />
                </ScrollView>

                <Toast message={toastMsg} visible={toastVisible} />
            </View>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.bg.primary,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.bg.primary,
    },
    muted: {
        color: theme.text.muted,
        fontSize: 14,
    },
    actionBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        // paddingBottom: 12,
    },
    back: {
        color: theme.accent.blue,
    },
    image_symbol: {
        flexDirection: 'row',
        alignItems: 'center',
        // gap: 8,
    },
    image: {
        width: 24,
        height: 24,
        marginRight: 8,
        marginLeft: 8,
    },
    symbol: {
        color: theme.text.primary,
        fontSize: 20,
        fontWeight: 'bold',
        // marginBottom: 2,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    alertBtn: {
        backgroundColor: theme.bg.secondary,
        padding: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.border,
    },

    starBtn: {
        backgroundColor: theme.bg.secondary,
        padding: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.border,
    },
});
