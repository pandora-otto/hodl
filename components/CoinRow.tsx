import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { CoinMarket } from '../services/coingecko';
import { formatPrice, formatPercent } from '../utils/formatters';
import { theme } from '../constants/theme';

interface Props {
    coin: CoinMarket;
    onPress: () => void;
}

function PercentCell({ value }: { value: number }) {
    const color = value >= 0 ? theme.accent.up : theme.accent.down;
    return <Text style={[styles.percent, { color }]}>{formatPercent(value)}</Text>;
}

export default function CoinRow({ coin, onPress }: Props) {
    const flashAnim = useRef(new Animated.Value(0)).current;
    const prevPrice = useRef(coin.current_price);
    const flashColor = useRef(theme.accent.up);

    useEffect(() => {
        if (coin.current_price !== prevPrice.current) {
            flashColor.current =
                coin.current_price > prevPrice.current ? theme.accent.up : theme.accent.down;
            prevPrice.current = coin.current_price;

            flashAnim.setValue(1);
            Animated.timing(flashAnim, {
                toValue: 0,
                duration: 3000,
                useNativeDriver: false,
            }).start();
        }
    }, [coin.current_price]);

    const priceColor = flashAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [theme.text.primary, flashColor.current],
    });

    const rankFontSize = coin.market_cap_rank >= 10000 ? 9 : coin.market_cap_rank >= 1000 ? 10 : 12;

    return (
        <TouchableOpacity style={styles.row} onPress={onPress}>
            <View style={styles.left}>
                {/* <Image source={{ uri: coin.image }} style={styles.image} /> */}
                <Text style={[styles.rank, { fontSize: rankFontSize }]}>
                    {coin.market_cap_rank}
                </Text>
                <View>
                    <Text style={styles.name}>{coin.name}</Text>
                    <Text style={styles.symbol}>{coin.symbol.toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.right}>
                <Animated.Text style={[styles.price, { color: priceColor }]}>
                    {formatPrice(coin.current_price)}
                </Animated.Text>
                <PercentCell value={coin.price_change_percentage_1h_in_currency} />
                <PercentCell value={coin.price_change_percentage_24h_in_currency} />
                <PercentCell value={coin.price_change_percentage_7d_in_currency} />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    // image: {
    //   width: 24,
    //   height: 24,
    //   borderRadius: 12,
    // },
    rank: {
        color: theme.text.muted,
        // fontSize: 12,
        fontWeight: '500',
        width: 26,
        textAlign: 'center',
    },
    name: {
        color: theme.text.primary,
        fontSize: 15,
        fontWeight: '600',
    },
    symbol: {
        color: theme.text.secondary,
        fontSize: 12,
        marginTop: 2,
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    price: {
        color: theme.text.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    percents: {
        flexDirection: 'row',
        gap: 8,
    },
    percent: {
        fontSize: 12,
        fontWeight: '500',
        width: 45,
        textAlign: 'right',
    },
});
