import { ErrorBoundary } from '../../components/ErrorBoundary';
import { useState, useCallback, useRef, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    FlatList,
    Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Svg, Path } from 'react-native-svg';
import { theme } from '../../constants/theme';
import { useAlertStore, AlertType } from '../../store/useAlertStore';
import { searchCoins } from '../../services/coingecko';
import { formatPrice } from '../../utils/formatters';
import { useSettingsStore, CURRENCIES } from '../../store/useSettingsStore';
import Toast from '../../components/Toast';

interface CoinResult {
    id: string;
    name: string;
    symbol: string;
    current_price?: number;
    thumb?: string;
}

export default function NewAlertScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        coinId?: string;
        coinName?: string;
        currentPrice?: string;
    }>();

    const { addAlert } = useAlertStore();
    const currency = useSettingsStore((state) => state.currency);
    const symbol = useMemo(
        () => CURRENCIES.find((c) => c.code === currency)?.symbol ?? '$',
        [currency],
    );

    // Coin state
    const preFilled = !!params.coinId;
    const [coinId, setCoinId] = useState(params.coinId ?? '');
    const [coinName, setCoinName] = useState(params.coinName ?? '');
    const [currentPrice, setCurrentPrice] = useState(
        params.currentPrice ? parseFloat(params.currentPrice) : null,
    );

    // Search state
    const [searchQuery, setSearchQuery] = useState(params.coinName ?? '');
    const [searchResults, setSearchResults] = useState<CoinResult[]>([]);
    const [searching, setSearching] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Alert fields
    const [type, setType] = useState<AlertType>('price');
    const [targetInput, setTargetInput] = useState('');
    const [percentageInput, setPercentageInput] = useState('');

    const [repeating, setRepeating] = useState(false);
    const [notes, setNotes] = useState('');

    // Toast
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

    // Auto direction based on typed price
    const targetPrice = parseFloat(targetInput);
    const direction =
        !isNaN(targetPrice) && currentPrice !== null
            ? targetPrice >= currentPrice
                ? 'above'
                : 'below'
            : null;
    const [percentageDirection, setPercentageDirection] = useState<'above' | 'below'>('above');

    // Live coin search
    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        setCoinId('');
        setCoinName('');
        setCurrentPrice(null);
        setSearchResults([]);

        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        if (!query.trim()) return;

        searchTimeout.current = setTimeout(async () => {
            setSearching(true);
            try {
                const results = await searchCoins(query);
                setSearchResults(results.slice(0, 8));
            } catch (e) {
                console.warn('Search failed:', e);
            } finally {
                setSearching(false);
            }
        }, 400);
    }, []);

    const handleSelectCoin = useCallback(
        async (coin: CoinResult) => {
            setCoinId(coin.id);
            setCoinName(coin.name);
            setSearchQuery(coin.name);
            setSearchResults([]);

            // Fetch current price if not available
            if (coin.current_price) {
                setCurrentPrice(coin.current_price);
            } else {
                try {
                    const { fetchMarkets } = await import('../../services/coingecko');
                    const data = await fetchMarkets([coin.id], currency);
                    if (data.length > 0) setCurrentPrice(data[0].current_price);
                } catch (e) {
                    console.warn('Price fetch failed:', e);
                }
            }
        },
        [currency],
    );

    const handleSave = useCallback(async () => {
        if (!coinId) {
            showToast('Please select a coin');
            return;
        }

        if (type === 'price') {
            const target = parseFloat(targetInput);
            if (isNaN(target) || target <= 0) {
                showToast('Please enter a valid target price');
                return;
            }
            if (currentPrice !== null && target === currentPrice) {
                showToast('Target price must differ from current price');
                return;
            }
            await addAlert({
                coinId,
                coinName,
                type: 'price',
                targetPrice: target,
                percentage: null,
                baselinePrice: currentPrice,
                direction: direction ?? 'above',
                repeating,
                notes: notes.trim() || null,
            });
        } else {
            const pct = parseFloat(percentageInput);
            if (isNaN(pct) || pct < 0.1 || pct > 100) {
                showToast('Percentage must be between 0.1 and 100');
                return;
            }
            if (currentPrice === null) {
                showToast('Could not determine current price');
                return;
            }
            await addAlert({
                coinId,
                coinName,
                type: 'percentage',
                targetPrice: null,
                percentage: pct,
                baselinePrice: currentPrice,
                direction: percentageDirection,
                repeating,
                notes: notes.trim() || null,
            });
        }

        router.back();
    }, [
        coinId,
        coinName,
        type,
        targetInput,
        percentageInput,
        currentPrice,
        direction,
        repeating,
        notes,
    ]);

    return (
        <ErrorBoundary>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backBtn}
                        activeOpacity={0.7}
                    >
                        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                            <Path
                                d="M15 18L9 12L15 6"
                                stroke={theme.accent.blue}
                                strokeWidth={3}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </Svg>
                    </TouchableOpacity>
                    <Text style={styles.title}>New Alert</Text>
                    <TouchableOpacity
                        onPress={handleSave}
                        style={styles.saveBtn}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.saveBtnText}>Save</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Coin Selector */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Coin</Text>
                        <View style={styles.card}>
                            <TextInput
                                style={styles.input}
                                placeholder="Search coin..."
                                placeholderTextColor={theme.text.muted}
                                value={searchQuery}
                                onChangeText={preFilled ? undefined : handleSearch}
                                editable={!preFilled}
                            />
                            {searching && (
                                <ActivityIndicator
                                    color={theme.accent.blue}
                                    style={styles.searchSpinner}
                                />
                            )}
                            {searchResults.length > 0 && (
                                <View style={styles.searchResults}>
                                    {searchResults.map((coin) => (
                                        <TouchableOpacity
                                            key={coin.id}
                                            style={styles.searchResult}
                                            onPress={() => handleSelectCoin(coin)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.searchResultName}>{coin.name}</Text>
                                            <Text style={styles.searchResultSymbol}>
                                                {coin.symbol.toUpperCase()}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Current price reference */}
                        {currentPrice !== null && (
                            <Text style={styles.currentPrice}>
                                Current price: {formatPrice(currentPrice, symbol)}
                            </Text>
                        )}
                    </View>

                    {/* Alert Type */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Type</Text>
                        <View style={[styles.card, styles.typeToggle]}>
                            <TouchableOpacity
                                style={[styles.typeBtn, type === 'price' && styles.typeBtnActive]}
                                onPress={() => setType('price')}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.typeBtnText,
                                        type === 'price' && styles.typeBtnTextActive,
                                    ]}
                                >
                                    Price
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.typeBtn,
                                    type === 'percentage' && styles.typeBtnActive,
                                ]}
                                onPress={() => setType('percentage')}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.typeBtnText,
                                        type === 'percentage' && styles.typeBtnTextActive,
                                    ]}
                                >
                                    Percentage
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Target Input */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>
                            {type === 'price' ? 'Target Price' : 'Percentage Change'}
                        </Text>
                        <View style={styles.card}>
                            <View style={styles.inputRow}>
                                <Text style={styles.inputPrefix}>
                                    {type === 'price' ? symbol : '%'}
                                </Text>
                                <TextInput
                                    style={styles.inputInline}
                                    placeholder={type === 'price' ? '0.00' : '0.0'}
                                    placeholderTextColor={theme.text.muted}
                                    keyboardType="numeric"
                                    value={type === 'price' ? targetInput : percentageInput}
                                    onChangeText={
                                        type === 'price' ? setTargetInput : setPercentageInput
                                    }
                                />
                            </View>
                        </View>

                        {/* Auto direction indicator */}
                        {type === 'price' && direction !== null && (
                            <Text
                                style={[
                                    styles.directionHint,
                                    {
                                        color:
                                            direction === 'above'
                                                ? theme.accent.up
                                                : theme.accent.down,
                                    },
                                ]}
                            >
                                {direction === 'above'
                                    ? '↑ Above current price'
                                    : '↓ Below current price'}
                            </Text>
                        )}

                        {/* Percentage hint */}
                        {type === 'percentage' &&
                            currentPrice !== null &&
                            parseFloat(percentageInput) > 0 && (
                                <View style={styles.pctHint}>
                                    {percentageDirection === 'above' ? (
                                        <Text
                                            style={[
                                                styles.directionHint,
                                                { color: theme.accent.up },
                                            ]}
                                        >
                                            ↑ Triggers at{' '}
                                            {formatPrice(
                                                currentPrice *
                                                    (1 + parseFloat(percentageInput) / 100),
                                                symbol,
                                            )}
                                        </Text>
                                    ) : (
                                        <Text
                                            style={[
                                                styles.directionHint,
                                                { color: theme.accent.down },
                                            ]}
                                        >
                                            ↓ Triggers at{' '}
                                            {formatPrice(
                                                currentPrice *
                                                    (1 - parseFloat(percentageInput) / 100),
                                                symbol,
                                            )}
                                        </Text>
                                    )}
                                </View>
                            )}
                    </View>

                    {type === 'percentage' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Direction</Text>
                            <View style={[styles.card, styles.typeToggle]}>
                                <TouchableOpacity
                                    style={[
                                        styles.typeBtn,
                                        percentageDirection === 'above' && styles.typeBtnActive,
                                    ]}
                                    onPress={() => setPercentageDirection('above')}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.typeBtnText,
                                            percentageDirection === 'above' &&
                                                styles.typeBtnTextActive,
                                        ]}
                                    >
                                        ↑ Increase
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.typeBtn,
                                        percentageDirection === 'below' && styles.typeBtnActive,
                                    ]}
                                    onPress={() => setPercentageDirection('below')}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.typeBtnText,
                                            percentageDirection === 'below' &&
                                                styles.typeBtnTextActive,
                                        ]}
                                    >
                                        ↓ Decrease
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Repeating */}
                    <View style={styles.section}>
                        <View style={styles.card}>
                            <View style={styles.switchRow}>
                                <View>
                                    <Text style={styles.switchLabel}>Repeating</Text>
                                    <Text style={styles.switchSubLabel}>
                                        Re-fires after price crosses back
                                    </Text>
                                </View>
                                <Switch
                                    value={repeating}
                                    onValueChange={setRepeating}
                                    trackColor={{
                                        false: theme.border,
                                        true: theme.accent.blue,
                                    }}
                                    thumbColor="#fff"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Notes */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Notes (optional)</Text>
                        <View style={styles.card}>
                            <TextInput
                                style={styles.notesInput}
                                placeholder="Add a note..."
                                placeholderTextColor={theme.text.muted}
                                value={notes}
                                onChangeText={(t) => setNotes(t.slice(0, 100))}
                                multiline
                                maxLength={100}
                            />
                            <Text style={styles.charCount}>{notes.length}/100</Text>
                        </View>
                    </View>

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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    backBtn: {
        padding: 4,
    },
    title: {
        color: theme.text.primary,
        fontSize: 18,
        fontWeight: '700',
    },
    saveBtn: {
        backgroundColor: theme.accent.blue,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    scroll: {
        flex: 1,
    },
    section: {
        paddingHorizontal: 16,
        paddingTop: 24,
        gap: 8,
    },
    sectionLabel: {
        color: theme.text.secondary,
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    card: {
        backgroundColor: theme.bg.secondary,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border,
        overflow: 'hidden',
    },
    input: {
        color: theme.text.primary,
        fontSize: 15,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    searchSpinner: {
        padding: 12,
    },
    searchResults: {
        borderTopWidth: 1,
        borderTopColor: theme.border,
    },
    searchResult: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    searchResultName: {
        color: theme.text.primary,
        fontSize: 14,
        fontWeight: '500',
    },
    searchResultSymbol: {
        color: theme.text.secondary,
        fontSize: 13,
    },
    currentPrice: {
        color: theme.text.secondary,
        fontSize: 16,
        paddingHorizontal: 4,
    },
    typeToggle: {
        flexDirection: 'row',
        padding: 4,
    },
    typeBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 12,
    },
    typeBtnActive: {
        backgroundColor: theme.accent.blue,
    },
    typeBtnText: {
        color: theme.text.muted,
        fontSize: 14,
        fontWeight: '600',
    },
    typeBtnTextActive: {
        color: '#fff',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    inputPrefix: {
        color: theme.text.muted,
        fontSize: 18,
        fontWeight: '600',
        marginRight: 8,
    },
    inputInline: {
        flex: 1,
        color: theme.text.primary,
        fontSize: 24,
        fontWeight: '700',
        paddingVertical: 14,
    },
    directionHint: {
        fontSize: 13,
        fontWeight: '600',
        paddingHorizontal: 4,
    },
    pctHint: {
        flexDirection: 'row',
        gap: 16,
        paddingHorizontal: 4,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    switchLabel: {
        color: theme.text.primary,
        fontSize: 15,
        fontWeight: '600',
    },
    switchSubLabel: {
        color: theme.text.muted,
        fontSize: 12,
        marginTop: 2,
    },
    notesInput: {
        color: theme.text.primary,
        fontSize: 15,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 8,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    charCount: {
        color: theme.text.muted,
        fontSize: 11,
        textAlign: 'right',
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
});
