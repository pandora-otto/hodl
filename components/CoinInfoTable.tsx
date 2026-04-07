import { View, Text, StyleSheet } from 'react-native';
import { CoinMarket } from '../services/coingecko';
import { formatMarketCap, formatSupply } from '../utils/formatters';
import { theme } from '../constants/theme';
import { useSettingsStore, CURRENCIES } from '../store/useSettingsStore';

interface Props {
    coin: CoinMarket;
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
        </View>
    );
}

export default function CoinInfoTable({ coin }: Props) {
    const currency = useSettingsStore((state) => state.currency);
    const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? '$';

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Coin Info</Text>
            <Row label="Rank" value={`#${coin.market_cap_rank}`} />
            <Row label="Market Cap" value={formatMarketCap(coin.market_cap, symbol)} />
            <Row label="Volume (24H)" value={formatMarketCap(coin.total_volume, symbol)} />
            <Row
                label="Circulating Supply"
                value={formatSupply(coin.circulating_supply, coin.symbol)}
            />
            <Row
                label="Total Supply"
                value={coin.total_supply ? formatSupply(coin.total_supply, coin.symbol) : '∞'}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    heading: {
        color: theme.text.secondary,
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    label: {
        color: theme.text.secondary,
        fontSize: 14,
    },
    value: {
        color: theme.text.primary,
        fontSize: 14,
        fontWeight: '500',
    },
});
