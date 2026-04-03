import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { theme } from '../constants/theme';

interface Props {
    data: { timestamp: number; value: number }[];
    loading: boolean;
    onRetry?: () => void;
}

const { width } = Dimensions.get('window');

export default function PriceChart({ data, loading, onRetry }: Props) {
    if (loading) {
        return (
            <View style={styles.placeholder}>
                <ActivityIndicator color={theme.accent.blue} />
            </View>
        );
    }

    if (!data || data.length === 0) {
        return (
            <View style={styles.placeholder}>
                <Text style={styles.muted}>Chart unavailable right now</Text>
                {onRetry && (
                    <TouchableOpacity onPress={onRetry} style={styles.retryBtn}>
                        <Text style={styles.retryText}>Tap to retry</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    const values = data.map((d) => d.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const range = rawMax - rawMin;

    // Find a nice round step size
    const roughStep = range / 4; // we want ~4 sections
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const niceStep = Math.ceil(roughStep / magnitude) * magnitude;
    console.log({ rawMin, rawMax, roughStep, niceStep });

    // Round min down and max up to nearest step
    const niceMin = Math.floor(rawMin / niceStep) * niceStep;
    const niceMax = Math.ceil(rawMax / niceStep) * niceStep;
    const noOfSections = Math.round((niceMax - niceMin) / niceStep);
    const minVal = niceMin;

    // Old simpler approach: just add 10% padding on top and bottom
    // const min = Math.min(...values);
    // const max = Math.max(...values);
    // const padding = (max - min) * 0.1; // add 10% padding on top and bottom
    // const minVal = min - padding;

    // Normalize: shift all values down so chart fills the space
    const chartData = data.map((d) => ({ value: d.value - minVal }));

    const Y_AXIS_WIDTH = 50; // gifted-charts default is around 60

    return (
        <View style={styles.container}>
            <LineChart
                data={chartData}
                width={width - 32 - Y_AXIS_WIDTH}
                height={220}
                color={theme.accent.up}
                thickness={2}
                hideDataPoints
                areaChart
                startFillColor={theme.accent.up}
                startOpacity={0.3}
                endOpacity={0.05}
                backgroundColor={theme.bg.primary}
                initialSpacing={0}
                xAxisColor={theme.border}
                yAxisColor={theme.border}
                yAxisTextStyle={{ color: theme.text.muted, fontSize: 11 }}
                yAxisLabelWidth={Y_AXIS_WIDTH}
                adjustToWidth
                curved
                noOfSections={noOfSections}
                maxValue={niceMax - niceMin}
                formatYLabel={(label) => {
                    const actual = parseFloat(label) + minVal;
                    if (actual >= 1000) return '$' + (actual / 1000).toFixed(2) + 'k';
                    return '$' + parseFloat(actual.toPrecision(4)).toString();
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        marginVertical: 8,
    },
    placeholder: {
        height: 220,
        alignItems: 'center',
        justifyContent: 'center',
    },
    muted: {
        color: theme.text.muted,
        fontSize: 14,
    },
    retryBtn: {
        marginTop: 10,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: theme.bg.secondary,
        borderWidth: 1,
        borderColor: theme.border,
    },
    retryText: {
        color: theme.accent.blue,
        fontSize: 13,
        fontWeight: '600',
    },
});
