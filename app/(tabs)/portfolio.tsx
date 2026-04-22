import { useState, useMemo, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Svg, Path } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useTheme } from '../../hooks/useTheme';
import { usePortfolioStore, PortfolioEntry } from '../../store/usePortfolioStore';
import { useSettingsStore, CURRENCIES } from '../../store/useSettingsStore';
import { fetchMarkets } from '../../services/coingecko';
import PortfolioDoughnutChart from '../../components/PortfolioDoughnutChart';
import PortfolioTimelineChart from '../../components/PortfolioTimelineChart';
import Toast from '../../components/Toast';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { formatPrice } from '../../utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Group entries by coinId
interface CoinGroup {
    coinId: string;
    coinName: string;
    coinSymbol: string;
    coinImage: string;
    entries: PortfolioEntry[];
    totalAmount: number;
    currentPrice: number | null;
    totalValue: number | null;
    totalCost: number | null;
    pnlValue: number | null;
    pnlPercent: number | null;
}

function groupEntries(
    entries: PortfolioEntry[],
    prices: Record<string, number>,
    currency: string,
): CoinGroup[] {
    const groups: Record<string, CoinGroup> = {};

    for (const entry of entries) {
        if (!groups[entry.coinId]) {
            groups[entry.coinId] = {
                coinId: entry.coinId,
                coinName: entry.coinName,
                coinSymbol: entry.coinSymbol,
                coinImage: entry.coinImage,
                entries: [],
                totalAmount: 0,
                currentPrice: prices[entry.coinId] ?? null,
                totalValue: null,
                totalCost: null,
                pnlValue: null,
                pnlPercent: null,
            };
        }
        groups[entry.coinId].entries.push(entry);
        groups[entry.coinId].totalAmount += entry.amount;
    }

    for (const group of Object.values(groups)) {
        const currentPrice = group.currentPrice;
        if (currentPrice !== null) {
            group.totalValue = group.totalAmount * currentPrice;
            const matchingEntries = group.entries.filter(
                (e) => e.purchaseCurrency.toLowerCase() === currency.toLowerCase(),
            );
            if (matchingEntries.length === group.entries.length) {
                group.totalCost = matchingEntries.reduce(
                    (sum, e) => sum + e.purchasePrice * e.amount,
                    0,
                );
                group.pnlValue = group.totalValue - group.totalCost;
                group.pnlPercent =
                    group.totalCost > 0 ? (group.pnlValue / group.totalCost) * 100 : null;
            }
        }
    }

    return Object.values(groups).sort((a, b) => (b.totalValue ?? 0) - (a.totalValue ?? 0));
}

function CoinGroupRow({
    group,
    symbol,
    theme,
    styles,
    onDeleteEntry,
    currency,
}: {
    group: CoinGroup;
    symbol: string;
    theme: any;
    styles: any;
    onDeleteEntry: (id: string) => void;
    currency: string;
}) {
    const [expanded, setExpanded] = useState(false);
    const pnlColor =
        group.pnlValue === null
            ? theme.text.muted
            : group.pnlValue >= 0
              ? theme.accent.up
              : theme.accent.down;

    return (
        <View style={styles.groupCard}>
            {/* Group Header */}
            <TouchableOpacity
                style={styles.groupHeader}
                onPress={() => setExpanded((v) => !v)}
                activeOpacity={0.7}
            >
                <View style={styles.groupLeft}>
                    <Text style={styles.groupSymbol}>{group.coinSymbol.toUpperCase()}</Text>
                    <Text style={styles.groupName}>{group.coinName}</Text>
                    {group.entries.length > 1 && (
                        <View style={styles.countBadge}>
                            <Text style={styles.countBadgeText}>{group.entries.length}</Text>
                        </View>
                    )}
                </View>
                <Svg
                    width={16}
                    height={16}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={theme.text.muted}
                    strokeWidth="2"
                >
                    <Path d={expanded ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} />
                </Svg>
            </TouchableOpacity>

            {/* Group Summary */}
            <View style={styles.groupSummary}>
                <View style={styles.groupSummaryRow}>
                    <Text style={styles.summaryLabel}>Holdings</Text>
                    <Text style={styles.summaryValue}>
                        {group.totalAmount.toLocaleString(undefined, {
                            maximumFractionDigits: 8,
                        })}{' '}
                        {group.coinSymbol.toUpperCase()}
                    </Text>
                </View>
                <View style={styles.groupSummaryRow}>
                    <Text style={styles.summaryLabel}>Current Price</Text>
                    <Text style={styles.summaryValue}>
                        {group.currentPrice !== null
                            ? formatPrice(group.currentPrice, symbol)
                            : '—'}
                    </Text>
                </View>
                <View style={styles.groupSummaryRow}>
                    <Text style={styles.summaryLabel}>Total Value</Text>
                    <Text style={[styles.summaryValue, { fontWeight: '700' }]}>
                        {group.totalValue !== null ? formatPrice(group.totalValue, symbol) : '—'}
                    </Text>
                </View>
                {group.pnlValue !== null && group.pnlPercent !== null && (
                    <View style={styles.groupSummaryRow}>
                        <Text style={styles.summaryLabel}>P&L</Text>
                        <Text style={[styles.summaryValue, { color: pnlColor, fontWeight: '700' }]}>
                            {group.pnlValue >= 0 ? '+' : ''}
                            {formatPrice(group.pnlValue, symbol)} (
                            {group.pnlPercent >= 0 ? '+' : ''}
                            {group.pnlPercent.toFixed(2)}%)
                        </Text>
                    </View>
                )}
                {group.pnlValue === null &&
                    group.entries.some(
                        (e) => e.purchaseCurrency.toLowerCase() !== currency.toLowerCase(),
                    ) && (
                        <Text style={styles.currencyNote}>
                            P&L unavailable — purchase currency differs from display currency
                        </Text>
                    )}
            </View>

            {/* Expanded individual entries */}
            {expanded && (
                <View style={styles.entriesList}>
                    <View style={styles.entriesDivider} />
                    {group.entries.map((entry) => {
                        const entryValue =
                            group.currentPrice !== null ? group.currentPrice * entry.amount : null;
                        const entryCost = entry.purchasePrice * entry.amount;
                        const entryPnl =
                            entryValue !== null &&
                            entry.purchaseCurrency.toLowerCase() === currency.toLowerCase()
                                ? entryValue - entryCost
                                : null;
                        const entryPnlPct =
                            entryPnl !== null && entryCost > 0
                                ? (entryPnl / entryCost) * 100
                                : null;
                        const entryPnlColor =
                            entryPnl === null
                                ? theme.text.muted
                                : entryPnl >= 0
                                  ? theme.accent.up
                                  : theme.accent.down;
                        const purchaseDate = new Date(
                            entry.purchaseDate ?? entry.createdAt,
                        ).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        });

                        return (
                            <View key={entry.id} style={styles.entryRow}>
                                <View style={styles.entryLeft}>
                                    <Text style={styles.entryAmount}>
                                        {entry.amount.toLocaleString(undefined, {
                                            maximumFractionDigits: 8,
                                        })}{' '}
                                        {group.coinSymbol.toUpperCase()}
                                    </Text>
                                    <Text style={styles.entryDetail}>
                                        @ {entry.purchaseCurrency.toUpperCase()}{' '}
                                        {entry.purchasePrice.toLocaleString()} · {purchaseDate}
                                    </Text>
                                    {entryPnl !== null && entryPnlPct !== null && (
                                        <Text style={[styles.entryPnl, { color: entryPnlColor }]}>
                                            {entryPnl >= 0 ? '+' : ''}
                                            {formatPrice(entryPnl, symbol)} (
                                            {entryPnlPct >= 0 ? '+' : ''}
                                            {entryPnlPct.toFixed(2)}%)
                                        </Text>
                                    )}
                                    {entry.notes ? (
                                        <Text style={styles.entryNotes}>{entry.notes}</Text>
                                    ) : null}
                                </View>
                                <TouchableOpacity
                                    style={styles.deleteBtn}
                                    onPress={() => onDeleteEntry(entry.id)}
                                    activeOpacity={0.7}
                                >
                                    <Svg
                                        width={16}
                                        height={16}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke={theme.text.muted}
                                        strokeWidth="2"
                                    >
                                        <Path d="M18 6L6 18M6 6l12 12" />
                                    </Svg>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>
            )}
        </View>
    );
}

// Swipeable chart container with dot indicators
function ChartCarousel({
    entries,
    groups,
    totalValue,
    theme,
    styles,
}: {
    entries: PortfolioEntry[];
    groups: CoinGroup[];
    totalValue: number;
    theme: any;
    styles: any;
}) {
    const [activeIndex, setActiveIndex] = useState(0);
    const translateX = useSharedValue(0);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const goToIndex = (index: number) => {
        setActiveIndex(index);
    };

    const swipeGesture = Gesture.Pan()
        .activeOffsetX([-10, 10])
        .onEnd((e) => {
            if (e.velocityX < -300 && activeIndex === 0) {
                translateX.value = withTiming(-SCREEN_WIDTH);
                // setActiveIndex(1);
                scheduleOnRN(() => goToIndex(1));
            } else if (e.velocityX > 300 && activeIndex === 1) {
                translateX.value = withTiming(0);
                // setActiveIndex(0);
                scheduleOnRN(() => goToIndex(0));
            }
        });

    return (
        <View style={styles.carouselContainer}>
            <GestureDetector gesture={swipeGesture}>
                <Animated.View style={[styles.carouselSlider, animStyle]}>
                    {/* Chart 1 — Doughnut */}
                    <View style={{ width: SCREEN_WIDTH }}>
                        <PortfolioDoughnutChart
                            groups={groups.map((g) => ({
                                coinId: g.coinId,
                                coinName: g.coinName,
                                coinSymbol: g.coinSymbol,
                                totalValue: g.totalValue,
                            }))}
                            totalValue={totalValue}
                        />
                    </View>

                    {/* Chart 2 — Timeline */}
                    <View style={{ width: SCREEN_WIDTH }}>
                        <PortfolioTimelineChart entries={entries} />
                    </View>
                </Animated.View>
            </GestureDetector>

            {/* Dot indicators */}
            <View style={styles.dots}>
                <View style={[styles.dot, activeIndex === 0 && styles.dotActive]} />
                <View style={[styles.dot, activeIndex === 1 && styles.dotActive]} />
            </View>
        </View>
    );
}

export default function PortfolioScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = useMemo(() => makeStyles(theme), [theme]);
    const { entries, removeEntry } = usePortfolioStore();
    const currency = useSettingsStore((state) => state.currency);
    const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? '$';

    const [prices, setPrices] = useState<Record<string, number>>({});
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

    const fetchPrices = useCallback(async () => {
        const uniqueIds = [...new Set(entries.map((e) => e.coinId))];
        if (uniqueIds.length === 0) return;
        try {
            const data = await fetchMarkets(uniqueIds, currency);
            const priceMap: Record<string, number> = {};
            for (const coin of data) {
                priceMap[coin.id] = coin.current_price;
            }
            setPrices(priceMap);
        } catch (e) {
            console.warn('Portfolio price fetch failed:', e);
        }
    }, [entries, currency]);

    useFocusEffect(
        useCallback(() => {
            fetchPrices();
        }, [fetchPrices]),
    );

    const groups = useMemo(
        () => groupEntries(entries, prices, currency),
        [entries, prices, currency],
    );

    const totalValue = groups.reduce((sum, g) => sum + (g.totalValue ?? 0), 0);
    const totalCost = groups.every((g) => g.totalCost !== null)
        ? groups.reduce((sum, g) => sum + (g.totalCost ?? 0), 0)
        : null;
    const totalPnl = totalCost !== null ? totalValue - totalCost : null;
    const totalPnlPct =
        totalPnl !== null && totalCost !== null && totalCost > 0
            ? (totalPnl / totalCost) * 100
            : null;
    const pnlColor =
        totalPnl === null ? theme.text.muted : totalPnl >= 0 ? theme.accent.up : theme.accent.down;

    const handleDeleteEntry = useCallback(
        (id: string) => {
            Alert.alert('Remove Holding', 'Are you sure you want to remove this holding?', [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        await removeEntry(id);
                        showToast('Holding removed');
                    },
                },
            ]);
        },
        [removeEntry],
    );

    const isEmpty = entries.length === 0;

    return (
        <ErrorBoundary>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Portfolio</Text>
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => router.push('/portfolio/new')}
                        activeOpacity={0.7}
                    >
                        <Svg
                            width={20}
                            height={20}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#fff"
                            strokeWidth="2.5"
                        >
                            <Path d="M12 5v14M5 12h14" strokeLinecap="round" />
                        </Svg>
                    </TouchableOpacity>
                </View>

                {isEmpty ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyTitle}>No holdings yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Tap + to add your first coin holding and start tracking your portfolio
                        </Text>
                        <TouchableOpacity
                            style={styles.emptyBtn}
                            onPress={() => router.push('/portfolio/new')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.emptyBtnText}>Add Holding</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Summary Card */}
                        <View style={[styles.container, styles.paddings, styles.summaryCard]}>
                            <Text style={styles.summaryCardLabel}>Total Value</Text>
                            <View
                                style={[
                                    styles.flexRow,
                                    styles.flexAlignRight,
                                    styles.flexJustifyBetween,
                                ]}
                            >
                                <Text style={styles.price}>{formatPrice(totalValue, symbol)}</Text>
                                <View
                                    style={[
                                        styles.flexColumn,
                                        styles.flexAlignRight,
                                        styles.flexJustifyBetween,
                                    ]}
                                >
                                    {totalPnl !== null && (
                                        <Text style={[styles.summaryCardPnl, { color: pnlColor }]}>
                                            {totalPnl >= 0 ? '+' : ''}
                                            {formatPrice(totalPnl, symbol)}
                                        </Text>
                                    )}
                                    {totalPnlPct !== null && (
                                        <Text style={[styles.summaryCardPnl, { color: pnlColor }]}>
                                            {totalPnlPct >= 0 ? '+' : ''}
                                            {totalPnlPct.toFixed(2)}%
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Swipeable Charts */}
                        <ChartCarousel
                            entries={entries}
                            groups={groups}
                            totalValue={totalValue}
                            theme={theme}
                            styles={styles}
                        />
                        {/* Holdings */}
                        <Text style={styles.holdingsTitle}>Holdings</Text>
                        {groups.map((group) => (
                            <CoinGroupRow
                                key={group.coinId}
                                group={group}
                                symbol={symbol}
                                theme={theme}
                                styles={styles}
                                onDeleteEntry={handleDeleteEntry}
                                currency={currency}
                            />
                        ))}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                )}

                <Toast message={toastMsg} visible={toastVisible} />
            </View>
        </ErrorBoundary>
    );
}

function makeStyles(theme: any) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.bg.primary },
        paddings: { paddingHorizontal: 16, paddingVertical: 10 },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: 50,
            // paddingBottom: 16,
        },
        title: { color: theme.text.primary, fontSize: 28, fontWeight: 'bold' },
        addBtn: {
            backgroundColor: theme.accent.blue,
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
        },
        emptyState: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 40,
            gap: 12,
        },
        emptyTitle: {
            color: theme.text.primary,
            fontSize: 20,
            fontWeight: '700',
        },
        emptySubtitle: {
            color: theme.text.muted,
            fontSize: 14,
            textAlign: 'center',
            lineHeight: 20,
        },
        emptyBtn: {
            marginTop: 8,
            backgroundColor: theme.accent.blue,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 20,
        },
        emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
        name: { color: theme.text.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
        price: {
            color: theme.text.primary,
            fontSize: 36,
            fontWeight: 'bold',
            lineHeight: 36,
        },

        flexRow: { flexDirection: 'row' },
        flexColumn: { flexDirection: 'column' },
        flexAlignRight: { alignItems: 'flex-end' },
        flexJustifyBetween: { justifyContent: 'space-between' },
        summaryCard: {
            margin: 16,
            padding: 20,
            backgroundColor: theme.bg.secondary,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.border,
            gap: 4,
        },
        summaryCardLabel: {
            color: theme.text.secondary,
            fontSize: 13,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
        },
        summaryCardValue: {
            color: theme.text.primary,
            fontSize: 36,
            fontWeight: 'bold',
            lineHeight: 42,
        },
        summaryCardPnl: { fontSize: 14, fontWeight: '600' },
        carouselContainer: {
            overflow: 'hidden',
            marginBottom: 8,
        },
        carouselSlider: {
            flexDirection: 'row',
            width: SCREEN_WIDTH * 2,
        },
        dots: {
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 8,
        },
        dot: {
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: theme.border,
        },
        dotActive: {
            backgroundColor: theme.accent.blue,
            width: 18,
        },
        holdingsTitle: {
            color: theme.text.muted,
            fontSize: 12,
            fontWeight: '600',
            letterSpacing: 1,
            textTransform: 'uppercase',
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 8,
        },
        groupCard: {
            marginHorizontal: 16,
            marginBottom: 12,
            backgroundColor: theme.bg.secondary,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.border,
            overflow: 'hidden',
        },
        groupHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
        },
        groupLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        groupSymbol: {
            color: theme.text.primary,
            fontSize: 16,
            fontWeight: '700',
        },
        groupName: { color: theme.text.muted, fontSize: 13 },
        countBadge: {
            backgroundColor: theme.accent.blue + '33',
            borderRadius: 10,
            paddingHorizontal: 7,
            paddingVertical: 2,
        },
        countBadgeText: {
            color: theme.accent.blue,
            fontSize: 11,
            fontWeight: '700',
        },
        groupSummary: { paddingHorizontal: 16, paddingBottom: 12, gap: 6 },
        groupSummaryRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        summaryLabel: { color: theme.text.secondary, fontSize: 13 },
        summaryValue: { color: theme.text.primary, fontSize: 13 },
        currencyNote: {
            color: theme.text.muted,
            fontSize: 11,
            fontStyle: 'italic',
            marginTop: 4,
        },
        entriesDivider: {
            height: 1,
            backgroundColor: theme.border,
            marginHorizontal: 16,
            marginBottom: 8,
        },
        entriesList: { paddingBottom: 8 },
        entryRow: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: theme.border,
        },
        entryLeft: { flex: 1, gap: 3 },
        entryAmount: {
            color: theme.text.primary,
            fontSize: 14,
            fontWeight: '600',
        },
        entryDetail: { color: theme.text.secondary, fontSize: 12 },
        entryPnl: { fontSize: 12, fontWeight: '600' },
        entryNotes: {
            color: theme.text.muted,
            fontSize: 11,
            fontStyle: 'italic',
        },
        deleteBtn: { padding: 8 },
    });
}
