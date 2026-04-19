import { View, Text, StyleSheet } from 'react-native';
import { CoinMarket } from '../services/coingecko';
import { formatMarketCap, formatSupply } from '../utils/formatters';
import { useTheme } from '../hooks/useTheme';
import { useSettingsStore, CURRENCIES } from '../store/useSettingsStore';
import { useMemo } from 'react';

interface Props {
    coin: CoinMarket;
}

function Row({ label, value, theme }: { label: string; value: string; theme: any }) {
    return (
        <View
            style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: theme.border,
            }}
        >
            <Text style={{ color: theme.text.secondary, fontSize: 14 }}>{label}</Text>
            <Text style={{ color: theme.text.primary, fontSize: 14, fontWeight: '500' }}>
                {value}
            </Text>
        </View>
    );
}

export default function CoinInfoTable({ coin }: Props) {
    const theme = useTheme();
    const styles = useMemo(() => makeStyles(theme), [theme]);
    const currency = useSettingsStore((state) => state.currency);
    const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? '$';

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Coin Info</Text>
            <Row label="Rank" value={`#${coin.market_cap_rank}`} theme={theme} />
            <Row
                label="Market Cap"
                value={formatMarketCap(coin.market_cap, symbol)}
                theme={theme}
            />
            <Row
                label="Volume (24H)"
                value={formatMarketCap(coin.total_volume, symbol)}
                theme={theme}
            />
            <Row
                label="Circulating Supply"
                value={formatSupply(coin.circulating_supply, coin.symbol)}
                theme={theme}
            />
            <Row
                label="Total Supply"
                value={coin.total_supply ? formatSupply(coin.total_supply, coin.symbol) : '∞'}
                theme={theme}
            />
        </View>
    );
}

function makeStyles(theme: any) {
    return StyleSheet.create({
        container: { paddingHorizontal: 16, paddingTop: 16 },
        heading: {
            color: theme.text.secondary,
            fontSize: 13,
            fontWeight: '600',
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 12,
        },
    });
}
