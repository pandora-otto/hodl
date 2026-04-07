import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { CoinMarket } from '../services/coingecko';
import { formatPrice, formatPercent } from '../utils/formatters';
import { theme } from '../constants/theme';
import { useSettingsStore, CURRENCIES } from '../store/useSettingsStore';

interface Props {
    coin: CoinMarket;
    change: number | null;
    low: number | null;
    high: number | null;
    loading: boolean;
    range: string;
}

function rangeLabel(range: string): string {
    const map: Record<string, string> = {
        '4H': '4H',
        '1': '24H',
        '7': '7D',
        '30': '1M',
        '90': '3M',
        '365': '1Y',
        max: 'All',
    };
    return map[range] ?? range;
}

export default function CoinHeader({ coin, change, low, high, loading, range }: Props) {
    const changeColor =
        change === null ? theme.text.muted : change >= 0 ? theme.accent.up : theme.accent.down;

    const currency = useSettingsStore((state) => state.currency);
    const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? '$';

    return (
        <View style={styles.container}>
            <Text style={styles.name}>{coin.name}</Text>

            <Text style={styles.price}>{formatPrice(coin.current_price, symbol)}</Text>

            {loading ? (
                <ActivityIndicator
                    color={theme.accent.blue}
                    size="small"
                    style={{ marginTop: 8 }}
                />
            ) : (
                <View
                    style={[
                        styles.row,
                        styles.flex,
                        styles.flexAlignCenter,
                        styles.flexJustifyBetween,
                    ]}
                >
                    <View style={[styles.row, styles.flex, styles.flexAlignCenter]}>
                        <Text style={styles.lowHigh}>{loading ? ' ' : rangeLabel(range)}</Text>
                        <Text style={[styles.change, { color: changeColor }]}>
                            {' '}
                            {change !== null ? formatPercent(change) : '--'}
                        </Text>
                    </View>

                    <View style={[styles.row, styles.flex, styles.flexAlignCenter]}>
                        <Text style={styles.lowHigh}>
                            Low
                            <Text style={{ color: theme.accent.down }}>
                                {' '}
                                {low !== null ? formatPrice(low, symbol) : '--'}
                            </Text>
                        </Text>
                    </View>

                    <View style={[styles.row, styles.flex, styles.flexAlignCenter]}>
                        <Text style={styles.lowHigh}>
                            High
                            <Text style={{ color: theme.accent.up }}>
                                {' '}
                                {high !== null ? formatPrice(high, symbol) : '--'}
                            </Text>
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    name: {
        color: theme.text.primary,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    row: {
        marginBottom: 4,
    },
    flex: {
        flexDirection: 'row',
    },
    flexAlignCenter: {
        alignItems: 'center',
    },
    flexJustifyBetween: {
        justifyContent: 'space-between',
    },
    flexGap8: {
        gap: 8,
    },
    price: {
        color: theme.text.primary,
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
        lineHeight: 36,
    },
    change: {
        fontSize: 15,
    },
    lowHigh: {
        color: theme.text.secondary,
        fontSize: 15,
    },
});
