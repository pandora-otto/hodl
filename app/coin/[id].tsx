import { useState } from 'react';
import {
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Modal,
    TextInput,
} from 'react-native';
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

export default function CoinDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const coin = usePriceStore((state) => state.prices[id]);
    const { removeCoin, hasCoin } = useWatchlistStore();
    const { addAlert } = useAlertStore();

    const [range, setRange] = useState<TimeRange>('1');
    const [chartData, setChartData] = useState<{ timestamp: number; value: number }[]>([]);
    const [chartLoading, setChartLoading] = useState(true);

    // Alert modal state
    const [alertModalVisible, setAlertModalVisible] = useState(false);
    const [alertPrice, setAlertPrice] = useState('');

    const [chartChange, setChartChange] = useState<number | null>(null);
    const [chartLow, setChartLow] = useState<number | null>(null);
    const [chartHigh, setChartHigh] = useState<number | null>(null);

    useEffect(() => {
        loadChart();
    }, [id, range]);

    const loadChart = async () => {
        setChartLoading(true);
        setChartChange(null);
        setChartLow(null);
        setChartHigh(null);
        try {
            const apiRange = range === '4H' ? '1' : range;
            const raw = await fetchChartData(id, apiRange);
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

    const handleRemove = () => {
        Alert.alert('Remove Coin', `Remove ${coin?.name} from your watchlist?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: () => {
                    removeCoin(id);
                    router.back();
                },
            },
        ]);
    };

    const handleConfirmAlert = () => {
        const target = parseFloat(alertPrice);
        if (isNaN(target) || target <= 0) {
            Alert.alert('Invalid Price', 'Please enter a valid price.');
            return;
        }
        if (target === coin.current_price) {
            Alert.alert('Invalid Price', 'Target price must be different from current price.');
            return;
        }
        const direction = target > coin.current_price ? 'above' : 'below';
        addAlert({
            id: Date.now().toString(),
            coinId: id,
            coinName: coin.name,
            targetPrice: target,
            direction,
            triggered: false,
        });
        setAlertModalVisible(false);
        setAlertPrice('');
        Alert.alert(
            'Alert Set ✓',
            `You'll be notified when ${coin.name} goes ${direction} ${formatPrice(target)}`,
        );
    };

    if (!coin) {
        return (
            <View style={styles.center}>
                <Text style={styles.muted}>Loading coin data...</Text>
            </View>
        );
    }

    return (
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
                        onPress={() => setAlertModalVisible(true)}
                    >
                        <Text style={styles.alertBtnText}>🔔 Alert</Text>
                    </TouchableOpacity>
                    {hasCoin(id) && (
                        <TouchableOpacity style={styles.removeBtn} onPress={handleRemove}>
                            <Text style={styles.removeBtnText}>Remove</Text>
                        </TouchableOpacity>
                    )}
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

            {/* Alert Modal */}
            <Modal
                visible={alertModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setAlertModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Set Price Alert</Text>
                        <Text style={styles.modalSubtitle}>
                            Current price: {formatPrice(coin.current_price)}
                        </Text>

                        {/* Price input */}
                        <TextInput
                            style={styles.input}
                            placeholder="Enter target price..."
                            placeholderTextColor={theme.text.muted}
                            keyboardType="numeric"
                            value={alertPrice}
                            onChangeText={setAlertPrice}
                            autoFocus
                        />

                        {/* Buttons */}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => {
                                    setAlertModalVisible(false);
                                    setAlertPrice('');
                                }}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmBtn}
                                onPress={handleConfirmAlert}
                            >
                                <Text style={styles.confirmBtnText}>Set Alert</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
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
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.border,
    },
    alertBtnText: {
        color: theme.text.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    removeBtn: {
        backgroundColor: theme.bg.secondary,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.accent.down,
    },
    removeBtnText: {
        color: theme.accent.down,
        fontSize: 13,
        fontWeight: '600',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: theme.bg.secondary,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        gap: 16,
    },
    modalTitle: {
        color: theme.text.primary,
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalSubtitle: {
        color: theme.text.secondary,
        fontSize: 14,
    },
    input: {
        backgroundColor: theme.bg.primary,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: theme.text.primary,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
        marginBottom: 16,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: theme.bg.primary,
        borderWidth: 1,
        borderColor: theme.border,
    },
    cancelBtnText: {
        color: theme.text.secondary,
        fontWeight: '600',
        fontSize: 15,
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: theme.accent.blue,
    },
    confirmBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
});
