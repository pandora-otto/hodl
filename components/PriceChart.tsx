import { View, Text, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
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
        <Text style={styles.muted}>Chart unavailable</Text>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.retryBtn}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.1;
  const minVal = min - padding;

  // Normalize: shift all values down so chart fills the space
  const chartData = data.map(d => ({ value: d.value - minVal }));

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        width={width - 32}
        height={220}
        color={theme.accent.up}
        thickness={2}
        hideDataPoints
        areaChart
        startFillColor={theme.accent.up}
        startOpacity={0.2}
        endOpacity={0}
        backgroundColor={theme.bg.primary}
        xAxisColor={theme.border}
        yAxisColor={theme.border}
        yAxisTextStyle={{ color: theme.text.muted, fontSize: 10 }}
        adjustToWidth
        curved
        noOfSections={4}
        formatYLabel={(label) => {
          const actual = parseFloat(label) + minVal;
          if (actual >= 1000) return '$' + (actual / 1000).toFixed(1) + 'k';
          return '$' + actual.toFixed(2);
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