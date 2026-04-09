import { useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated as RNAnimated } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import { CoinMarket } from '../services/coingecko';
import { formatPrice, formatPercent } from '../utils/formatters';
import { theme } from '../constants/theme';
import { useSettingsStore, CURRENCIES } from '../store/useSettingsStore';

interface Props {
    coin: CoinMarket;
    onPress: () => void;
    onLongPress?: () => void;
    isFavorite?: boolean;
    onSwipeStar?: () => void;
    onSwipeBell?: () => void;
    onSwipeOpen?: (closeFn: () => void, id: string) => void;
    onSwipeClose?: (id: string) => void;
}

function PercentCell({ value }: { value: number }) {
    const color = value >= 0 ? theme.accent.up : theme.accent.down;
    return <Text style={[styles.percent, { color }]}>{formatPercent(value)}</Text>;
}

function StarIcon({ filled }: { filled: boolean }) {
    return (
        <Svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill={filled ? '#F5A623' : 'none'}
            stroke="#F5A623"
            strokeWidth="2"
        >
            <Path d="M11.2691 4.41115C11.5006 3.89177 11.6164 3.63208 11.7776 3.55211C11.9176 3.48263 12.082 3.48263 12.222 3.55211C12.3832 3.63208 12.499 3.89177 12.7305 4.41115L14.5745 8.54808C14.643 8.70162 14.6772 8.77839 14.7302 8.83718C14.777 8.8892 14.8343 8.93081 14.8982 8.95929C14.9705 8.99149 15.0541 9.00031 15.2213 9.01795L19.7256 9.49336C20.2911 9.55304 20.5738 9.58288 20.6997 9.71147C20.809 9.82316 20.8598 9.97956 20.837 10.1342C20.8108 10.3122 20.5996 10.5025 20.1772 10.8832L16.8125 13.9154C16.6877 14.0279 16.6252 14.0842 16.5857 14.1527C16.5507 14.2134 16.5288 14.2807 16.5215 14.3503C16.5132 14.429 16.5306 14.5112 16.5655 14.6757L17.5053 19.1064C17.6233 19.6627 17.6823 19.9408 17.5989 20.1002C17.5264 20.2388 17.3934 20.3354 17.2393 20.3615C17.0619 20.3915 16.8156 20.2495 16.323 19.9654L12.3995 17.7024C12.2539 17.6184 12.1811 17.5765 12.1037 17.56C12.0352 17.5455 11.9644 17.5455 11.8959 17.56C11.8185 17.5765 11.7457 17.6184 11.6001 17.7024L7.67662 19.9654C7.18404 20.2495 6.93775 20.3915 6.76034 20.3615C6.60623 20.3354 6.47319 20.2388 6.40075 20.1002C6.31736 19.9408 6.37635 19.6627 6.49434 19.1064L7.4341 14.6757C7.46898 14.5112 7.48642 14.429 7.47814 14.3503C7.47081 14.2807 7.44894 14.2134 7.41394 14.1527C7.37439 14.0842 7.31195 14.0279 7.18708 13.9154L3.82246 10.8832C3.40005 10.5025 3.18884 10.3122 3.16258 10.1342C3.13978 9.97956 3.19059 9.82316 3.29993 9.71147C3.42581 9.58288 3.70856 9.55304 4.27406 9.49336L8.77835 9.01795C8.94553 9.00031 9.02911 8.99149 9.10139 8.95929C9.16534 8.93081 9.2226 8.8892 9.26946 8.83718C9.32241 8.77839 9.35663 8.70162 9.42508 8.54808L11.2691 4.41115Z" />
        </Svg>
    );
}

function BellIcon() {
    return (
        <Svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </Svg>
    );
}

function SwipeStarIcon({ isFavorite }: { isFavorite: boolean }) {
    return (
        <Svg
            width={22}
            height={22}
            viewBox="0 0 24 24"
            fill={isFavorite ? '#fff' : 'none'}
            stroke="#fff"
            strokeWidth="2"
        >
            <Path d="M11.2691 4.41115C11.5006 3.89177 11.6164 3.63208 11.7776 3.55211C11.9176 3.48263 12.082 3.48263 12.222 3.55211C12.3832 3.63208 12.499 3.89177 12.7305 4.41115L14.5745 8.54808C14.643 8.70162 14.6772 8.77839 14.7302 8.83718C14.777 8.8892 14.8343 8.93081 14.8982 8.95929C14.9705 8.99149 15.0541 9.00031 15.2213 9.01795L19.7256 9.49336C20.2911 9.55304 20.5738 9.58288 20.6997 9.71147C20.809 9.82316 20.8598 9.97956 20.837 10.1342C20.8108 10.3122 20.5996 10.5025 20.1772 10.8832L16.8125 13.9154C16.6877 14.0279 16.6252 14.0842 16.5857 14.1527C16.5507 14.2134 16.5288 14.2807 16.5215 14.3503C16.5132 14.429 16.5306 14.5112 16.5655 14.6757L17.5053 19.1064C17.6233 19.6627 17.6823 19.9408 17.5989 20.1002C17.5264 20.2388 17.3934 20.3354 17.2393 20.3615C17.0619 20.3915 16.8156 20.2495 16.323 19.9654L12.3995 17.7024C12.2539 17.6184 12.1811 17.5765 12.1037 17.56C12.0352 17.5455 11.9644 17.5455 11.8959 17.56C11.8185 17.5765 11.7457 17.6184 11.6001 17.7024L7.67662 19.9654C7.18404 20.2495 6.93775 20.3915 6.76034 20.3615C6.60623 20.3354 6.47319 20.2388 6.40075 20.1002C6.31736 19.9408 6.37635 19.6627 6.49434 19.1064L7.4341 14.6757C7.46898 14.5112 7.48642 14.429 7.47814 14.3503C7.47081 14.2807 7.44894 14.2134 7.41394 14.1527C7.37439 14.0842 7.31195 14.0279 7.18708 13.9154L3.82246 10.8832C3.40005 10.5025 3.18884 10.3122 3.16258 10.1342C3.13978 9.97956 3.19059 9.82316 3.29993 9.71147C3.42581 9.58288 3.70856 9.55304 4.27406 9.49336L8.77835 9.01795C8.94553 9.00031 9.02911 8.99149 9.10139 8.95929C9.16534 8.93081 9.2226 8.8892 9.26946 8.83718C9.32241 8.77839 9.35663 8.70162 9.42508 8.54808L11.2691 4.41115Z" />
        </Svg>
    );
}

// Move this OUTSIDE of the CoinRow function, at module level
function RightActions({
    prog,
    isFavoriteRef,
    onStar,
    onBell,
}: {
    prog: SharedValue<number>;
    isFavoriteRef: React.RefObject<boolean>;
    onStar: () => void;
    onBell: () => void;
}) {
    const ACTIONS_WIDTH = 140;
    const styleAnimation = useAnimatedStyle(() => {
        const translateX = interpolate(prog.value, [0, 1], [ACTIONS_WIDTH, 0], Extrapolation.CLAMP);
        return { transform: [{ translateX }] };
    });

    return (
        <Animated.View style={[styles.swipeActions, styleAnimation]}>
            <TouchableOpacity style={styles.swipeActionStar} onPress={onStar} activeOpacity={0.7}>
                <SwipeStarIcon isFavorite={isFavoriteRef.current} />
                <Text style={styles.swipeLabel}>{isFavoriteRef.current ? 'Unfav' : 'Fav'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.swipeActionBell} onPress={onBell} activeOpacity={0.7}>
                <BellIcon />
                <Text style={styles.swipeLabel}>Alert</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function CoinRow({
    coin,
    onPress,
    onLongPress,
    isFavorite = false,
    onSwipeStar,
    onSwipeBell,
    onSwipeOpen,
    onSwipeClose,
}: Props) {
    const swipeableRef = useRef<React.ComponentRef<typeof ReanimatedSwipeable>>(null);

    const flashAnim = useRef(new RNAnimated.Value(0)).current;
    const prevPrice = useRef(coin.current_price);
    const flashColor = useRef(theme.accent.up);

    useEffect(() => {
        if (coin.current_price !== prevPrice.current) {
            flashColor.current =
                coin.current_price > prevPrice.current ? theme.accent.up : theme.accent.down;
            prevPrice.current = coin.current_price;
            flashAnim.setValue(1);
            RNAnimated.timing(flashAnim, {
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

    const display = useSettingsStore((state) => state.display) ?? {
        show1h: true,
        show24h: true,
        show7d: true,
    };

    const currency = useSettingsStore((state) => state.currency);
    const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? '$';

    // Stable refs for callbacks and isFavorite
    const onSwipeStarRef = useRef(onSwipeStar);
    const onSwipeBellRef = useRef(onSwipeBell);
    const isFavoriteRef = useRef(isFavorite);

    // Keep refs in sync without causing re-renders
    useEffect(() => {
        onSwipeStarRef.current = onSwipeStar;
    }, [onSwipeStar]);
    useEffect(() => {
        onSwipeBellRef.current = onSwipeBell;
    }, [onSwipeBell]);
    useEffect(() => {
        isFavoriteRef.current = isFavorite;
    }, [isFavorite]);

    // Stable handlers — empty deps, read from refs
    const handleSwipeStar = useCallback(() => {
        swipeableRef.current?.close();
        onSwipeStarRef.current?.();
    }, []);

    const handleSwipeBell = useCallback(() => {
        swipeableRef.current?.close();
        onSwipeBellRef.current?.();
    }, []);

    // renderRightActions never changes identity again
    const renderRightActions = useCallback(
        (prog: SharedValue<number>, _drag: SharedValue<number>) => (
            <RightActions
                prog={prog}
                isFavoriteRef={isFavoriteRef}
                onStar={handleSwipeStar}
                onBell={handleSwipeBell}
            />
        ),
        [], // empty — nothing inside changes
    );

    return (
        <ReanimatedSwipeable
            ref={swipeableRef}
            renderRightActions={renderRightActions}
            friction={2}
            overshootRight={false}
            rightThreshold={40}
            onSwipeableWillOpen={() => {
                onSwipeOpen?.(() => swipeableRef.current?.close(), coin.id);
            }}
            onSwipeableWillClose={() => {
                onSwipeClose?.(coin.id);
            }}
        >
            <TouchableOpacity
                style={styles.row}
                onPress={onPress}
                onLongPress={onLongPress}
                delayLongPress={400}
                activeOpacity={0.7}
            >
                <View style={styles.left}>
                    <Text style={[styles.rank, { fontSize: rankFontSize }]}>
                        {coin.market_cap_rank}
                    </Text>
                    <View style={styles.nameContainer}>
                        <View style={styles.symbolRow}>
                            {isFavorite && (
                                <View style={styles.starIndicator}>
                                    <StarIcon filled />
                                </View>
                            )}
                            <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
                                {coin.symbol.toUpperCase()}
                            </Text>
                        </View>
                        <Text style={styles.symbol} numberOfLines={1} ellipsizeMode="tail">
                            {coin.name}
                        </Text>
                    </View>
                </View>

                <View style={styles.right}>
                    <RNAnimated.Text style={[styles.price, { color: priceColor }]}>
                        {formatPrice(coin.current_price, symbol)}
                    </RNAnimated.Text>
                    {display.show1h && (
                        <PercentCell value={coin.price_change_percentage_1h_in_currency} />
                    )}
                    {display.show24h && (
                        <PercentCell value={coin.price_change_percentage_24h_in_currency} />
                    )}
                    {display.show7d && (
                        <PercentCell value={coin.price_change_percentage_7d_in_currency} />
                    )}
                </View>
            </TouchableOpacity>
        </ReanimatedSwipeable>
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
        backgroundColor: theme.bg.primary,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
        overflow: 'hidden',
    },
    rank: {
        color: theme.text.muted,
        fontWeight: '500',
        width: 26,
        textAlign: 'center',
    },
    nameContainer: {
        flex: 1,
        paddingEnd: 8,
    },
    symbolRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    starIndicator: {
        marginTop: 1,
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
    percent: {
        fontSize: 12,
        fontWeight: '500',
        width: 45,
        textAlign: 'right',
    },
    swipeActions: {
        flexDirection: 'row',
    },
    swipeActionStar: {
        backgroundColor: '#F5A623',
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        gap: 4,
    },
    swipeActionBell: {
        backgroundColor: theme.accent.blue,
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        gap: 4,
    },
    swipeLabel: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
});
