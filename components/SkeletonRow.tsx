import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { useSettingsStore } from '../store/useSettingsStore';

function SkeletonBox({
    width,
    height = 12,
    borderRadius = 6,
}: {
    width: number;
    height?: number;
    borderRadius?: number;
}) {
    const theme = useTheme();
    const opacity = useSharedValue(0);

    useEffect(() => {
        opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        opacity: interpolate(opacity.value, [0, 1], [0.3, 0.7]),
    }));

    return (
        <Animated.View
            style={[
                animStyle,
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: theme.bg.secondary,
                },
            ]}
        />
    );
}

function SkeletonRow() {
    const theme = useTheme();
    const display = useSettingsStore((state) => state.display);
    const activeCount = [display?.show1h, display?.show24h, display?.show7d].filter(Boolean).length;
    const percentWidth = activeCount === 1 ? 60 : activeCount === 2 ? 52 : 45;

    return (
        <View
            style={[
                styles.row,
                { borderBottomColor: theme.border, backgroundColor: theme.bg.primary },
            ]}
        >
            {/* Left side */}
            <View style={styles.left}>
                {/* Rank */}
                <SkeletonBox width={20} height={10} />
                {/* Image (if enabled) */}
                {display?.showImage && <SkeletonBox width={24} height={24} borderRadius={12} />}
                {/* Name + symbol */}
                <View style={styles.nameContainer}>
                    <SkeletonBox width={48} height={13} />
                    <View style={{ marginTop: 6 }}>
                        <SkeletonBox width={72} height={10} />
                    </View>
                </View>
            </View>

            {/* Right side */}
            <View style={styles.right}>
                {/* Price */}
                <SkeletonBox width={64} height={13} />
                {/* % columns */}
                {display?.show1h && <SkeletonBox width={percentWidth} height={11} />}
                {display?.show24h && <SkeletonBox width={percentWidth} height={11} />}
                {display?.show7d && <SkeletonBox width={percentWidth} height={11} />}
            </View>
        </View>
    );
}

export function SkeletonList({ count = 12 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonRow key={i} />
            ))}
        </>
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
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    nameContainer: {
        gap: 2,
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
});
