import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useWatchlistStore } from '../store/useWatchlistStore';
import { usePriceStore } from '../store/usePriceStore';
import { theme } from '../constants/theme';
import CoinRow from '../components/CoinRow';
import LoadingBar from '../components/LoadingBar';
import { CoinMarket } from '../services/coingecko';

type SortField = 'rank' | 'name' | 'price' | '1h' | '24h' | '7d';
type SortDir = 'asc' | 'desc';

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
        <TouchableOpacity onPress={() => onPress(field)}>
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

export default function WatchlistScreen() {
    const router = useRouter();
    const { coins, hydrated } = useWatchlistStore();
    const prices = usePriceStore((state) => state.prices);
    const loading = usePriceStore((state) => state.loading);

    const [sortField, setSortField] = useState<SortField>('rank');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    const handleSort = (field: SortField) => {
        if (field === sortField) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    const coinsWithPrices = coins.map((c) => prices[c.id]).filter(Boolean) as CoinMarket[];

    const sortedCoins = sortCoins(coinsWithPrices, sortField, sortDir);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>HODL</Text>
                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        style={styles.alertsButton}
                        onPress={() => router.push('/alerts')}
                    >
                        <Text style={styles.alertsButtonText}>🔔</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => router.push('/search')}
                    >
                        <Text style={styles.addButtonText}>+ Add</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Loading Bar */}
            <LoadingBar loading={loading} />

            {/* Column Labels */}
            {/* {coinsWithPrices.length > 0 && (
        <View style={styles.columnLabels}>
          <Text style={styles.labelname}>Coin</Text>
          <View style={styles.labelRight}>
            <Text style={styles.label}>Price</Text>
            <Text style={styles.label}> 1H</Text>
            <Text style={styles.label}>24H</Text>
            <Text style={styles.label}> 7D</Text>
          </View>
        </View>
      )} */}

            {/* Column Headers */}
            {sortedCoins.length > 0 && (
                <View style={styles.columnRow}>
                    <View style={styles.leftLabels}>
                        <ColumnHeader
                            style={styles.rank}
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
                        <ColumnHeader
                            style={styles.label}
                            label="1H"
                            field="1h"
                            currentField={sortField}
                            currentDir={sortDir}
                            onPress={handleSort}
                        />
                        <ColumnHeader
                            style={styles.label}
                            label="24H"
                            field="24h"
                            currentField={sortField}
                            currentDir={sortDir}
                            onPress={handleSort}
                        />
                        <ColumnHeader
                            style={styles.label}
                            label="7D"
                            field="7d"
                            currentField={sortField}
                            currentDir={sortDir}
                            onPress={handleSort}
                        />
                    </View>
                </View>
            )}

            {/* Coin List */}
            {!hydrated ? (
                <View style={styles.center}>
                    <Text style={styles.muted}>Loading...</Text>
                </View>
            ) : sortedCoins.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyTitle}>No coins yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Tap "+ Add" to search and add up to 10 coins
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={sortedCoins}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <CoinRow coin={item} onPress={() => router.push(`/coin/${item.id}`)} />
                    )}
                />
            )}
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
        paddingTop: 60,
        paddingBottom: 16,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    alertsButton: {
        backgroundColor: theme.bg.secondary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.border,
    },
    alertsButtonText: {
        fontSize: 16,
    },
    title: {
        color: theme.text.primary,
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    addButton: {
        backgroundColor: theme.accent.blue,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },

    columnRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    leftLabels: {
        flexDirection: 'row',
        gap: 6,
    },
    rank: {
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
        width: 'auto',
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

    columnLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    labelRight: {
        flexDirection: 'row',
        gap: 8,
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
});
