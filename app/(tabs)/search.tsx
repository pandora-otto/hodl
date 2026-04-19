import { useState, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { searchCoins, CoinSearchResult } from '../../services/coingecko';
import { useWatchlistStore } from '../../store/useWatchlistStore';
import { useTheme } from '../../hooks/useTheme';
import { config } from '../../constants/config';
import { Svg, Path } from 'react-native-svg';

export default function SearchScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = useMemo(() => makeStyles(theme), [theme]);

    const { addCoin, removeCoin, hasCoin, coins } = useWatchlistStore();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<CoinSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

    const MAX_FAVORITES = config.MAX_FAVORITES;
    const SEARCH_DEBOUNCE_MS = config.SEARCH_DEBOUNCE_MS;
    const SEARCH_MIN_CHARS = config.SEARCH_MIN_CHARS;

    const handleSearch = (text: string) => {
        setQuery(text);
        setError('');

        if (searchTimeout) clearTimeout(searchTimeout);

        if (text.trim().length < SEARCH_MIN_CHARS) {
            setResults([]);
            return;
        }

        // Debounce — wait 500ms after user stops typing before calling API
        const timeout = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await searchCoins(text.trim());
                setResults(data);
            } catch (e) {
                setError('Search failed. Check your connection.');
            } finally {
                setLoading(false);
            }
        }, SEARCH_DEBOUNCE_MS);

        setSearchTimeout(timeout);
    };

    const handleToggle = (coin: CoinSearchResult) => {
        if (hasCoin(coin.id)) {
            removeCoin(coin.id);
        } else {
            if (coins.length >= MAX_FAVORITES) {
                setError(`You can only track up to ${MAX_FAVORITES} coins.`);
                return;
            }
            addCoin({
                id: coin.id,
                name: coin.name,
                symbol: coin.symbol,
                thumb: coin.thumb,
            });
        }
    };

    const renderItem = ({ item }: { item: CoinSearchResult }) => {
        const added = hasCoin(item.id);
        return (
            <TouchableOpacity
                style={styles.item}
                onPress={() => router.push(`/coin/${item.id}`)}
                activeOpacity={0.7}
            >
                <View style={styles.itemLeft}>
                    {item.thumb ? (
                        <Image source={{ uri: item.thumb }} style={styles.thumb} />
                    ) : (
                        <View style={[styles.thumb, styles.thumbPlaceholder]} />
                    )}
                    <View>
                        <Text style={styles.itemName}>{item.symbol}</Text>
                        <Text style={styles.itemSymbol}>{item.name.toUpperCase()}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={[styles.badge, added ? styles.badgeRemove : styles.badgeAdd]}
                    onPress={(e) => {
                        e.stopPropagation();
                        handleToggle(item);
                    }}
                    activeOpacity={0.7}
                >
                    <Text style={styles.badgeText}>{added ? '− Remove' : '+ Add'}</Text>
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                {/* <TouchableOpacity onPress={() => router.back()}>
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                        <Path
                            d="M15 18L9 12L15 6"
                            stroke={styles.back.color}
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </Svg>
                </TouchableOpacity> */}
                <Text style={styles.title}>Search Coins</Text>
            </View>

            {/* Search Input */}
            <View style={styles.searchBar}>
                <TextInput
                    style={styles.input}
                    placeholder="Search by name or ticker..."
                    placeholderTextColor={theme.text.secondary}
                    value={query}
                    onChangeText={handleSearch}
                    autoFocus
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {query.length > 0 && (
                    <TouchableOpacity
                        onPress={() => {
                            setQuery('');
                            setResults([]);
                        }}
                    >
                        <Text style={styles.clearBtn}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Watchlist count */}
            <Text style={styles.countLabel}>
                {coins.length}/{MAX_FAVORITES} coins in favorites
            </Text>

            {/* Error */}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Loading */}
            {loading && <ActivityIndicator color={theme.accent.blue} style={{ marginTop: 24 }} />}

            {/* Results */}
            {!loading && results.length > 0 && (
                <FlatList
                    data={results}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    keyboardShouldPersistTaps="handled"
                />
            )}

            {/* Empty state */}
            {!loading && query.length >= 2 && results.length === 0 && !error && (
                <View style={styles.center}>
                    <Text style={styles.secondary}>No results for "{query}"</Text>
                </View>
            )}

            {/* Initial hint */}
            {query.length < 2 && !loading && (
                <View style={styles.center}>
                    <Text style={styles.secondary}>Type at least 2 characters to search</Text>
                </View>
            )}
        </View>
    );
}

function makeStyles(theme: any) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.bg.primary },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: 50,
            paddingBottom: 8,
            gap: 16,
        },
        title: { color: theme.text.primary, fontSize: 28, fontWeight: 'bold' },
        searchBar: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.bg.secondary,
            margin: 16,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: theme.border,
        },
        input: { flex: 1, color: theme.text.primary, fontSize: 16 },
        clearBtn: { color: theme.text.muted, fontSize: 16, paddingLeft: 8 },
        countLabel: {
            color: theme.text.secondary,
            fontSize: 12,
            paddingHorizontal: 16,
            marginBottom: 8,
        },
        error: { color: theme.accent.down, fontSize: 13, paddingHorizontal: 16, marginBottom: 8 },
        item: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
        thumb: { width: 36, height: 36, borderRadius: 18 },
        thumbPlaceholder: { backgroundColor: theme.bg.secondary },
        itemName: { color: theme.text.primary, fontSize: 15, fontWeight: '600' },
        itemSymbol: { color: theme.text.secondary, fontSize: 12, marginTop: 2 },
        badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
        badgeAdd: { backgroundColor: theme.accent.blue },
        badgeRemove: {
            backgroundColor: theme.bg.secondary,
            borderWidth: 1,
            borderColor: theme.border,
        },
        badgeText: { color: theme.text.primary, fontSize: 13, fontWeight: '600' },
        center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
        secondary: { color: theme.text.secondary, fontSize: 15 },
    });
}
