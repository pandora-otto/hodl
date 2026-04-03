import { View, Text, Image, StyleSheet } from 'react-native';
import { CoinMarket } from '../services/coingecko';
import { formatPrice, formatPercent } from '../utils/formatters';
import { theme } from '../constants/theme';

interface Props {
    coin: CoinMarket;
}

export default function CoinHeader({ coin }: Props) {
    const change24h = coin.price_change_percentage_24h_in_currency;
    const changeColor = change24h >= 0 ? theme.accent.up : theme.accent.down;

    return (
        <View style={styles.container}>
            <Text style={styles.name}>{coin.name}</Text>

            {/* <View
                style={[styles.row, styles.flex, styles.flexAlignCenter, styles.flexJustifyBetween]}
            > */}
            <Text style={styles.price}>{formatPrice(coin.current_price)}</Text>
            {/* <Text style={[styles.change, { color: changeColor }]}> */}
            {/* {formatPercent(change24h)} (24H) */}
            {/* </Text> */}
            {/* </View> */}

            <View
                style={[styles.row, styles.flex, styles.flexAlignCenter, styles.flexJustifyBetween]}
            >
                <View style={[styles.row, styles.flex, styles.flexAlignCenter]}>
                    <Text style={styles.lowHigh}>24H</Text>
                    <Text style={[styles.change, { color: changeColor }]}>
                        {' '}
                        {formatPercent(change24h)}
                    </Text>
                </View>

                <View style={[styles.row, styles.flex, styles.flexAlignCenter]}>
                    <Text style={styles.lowHigh}>
                        Low
                        <Text style={{ color: theme.accent.down }}>
                            {' '}
                            {formatPrice(coin.low_24h)}
                        </Text>
                    </Text>
                </View>

                <View style={[styles.row, styles.flex, styles.flexAlignCenter]}>
                    <Text style={styles.lowHigh}>
                        High
                        <Text style={{ color: theme.accent.up }}>
                            {' '}
                            {formatPrice(coin.high_24h)}
                        </Text>
                    </Text>
                </View>
            </View>

            {/* <View
                style={[styles.row, styles.flex, styles.flexAlignCenter, styles.flexJustifyBetween]}
            >
                <View style={[styles.row, styles.flex, styles.flexAlignCenter]}>
                    <Text style={styles.lowHigh}>24H</Text>
                    <Text style={[styles.change, { color: changeColor }]}>
                        {' '}
                        {formatPercent(change24h)}
                    </Text>
                </View>
                <View style={[styles.row, styles.flex, styles.flexAlignCenter]}>
                    <Text style={styles.lowHigh}>
                        Low{' '}
                        <Text style={{ color: theme.accent.down }}>
                            {formatPrice(coin.low_24h)}
                        </Text>
                        {'  '}
                        High{' '}
                        <Text style={{ color: theme.accent.up }}>{formatPrice(coin.high_24h)}</Text>
                    </Text>
                </View>
            </View> */}

            {/* <View style={styles.row}>
                <Text style={styles.lowHigh}>
                    Low{' '}
                    <Text style={{ color: theme.accent.down }}>{formatPrice(coin.low_24h)}</Text>
                    {'  ·  '}
                    High{' '}
                    <Text style={{ color: theme.accent.up }}>{formatPrice(coin.high_24h)}</Text>
                </Text>
            </View> */}
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
