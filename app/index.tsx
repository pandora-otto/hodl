import { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWatchlistStore } from '../store/useWatchlistStore';
import { usePriceStore } from '../store/usePriceStore';
import { theme } from '../constants/theme';
import CoinRow from '../components/CoinRow';

export default function WatchlistScreen() {
  const router = useRouter();
  const { coins, hydrated } = useWatchlistStore();
  const prices = usePriceStore(state => state.prices);

  const coinsWithPrices = coins
    .map(c => prices[c.id])
    .filter(Boolean);

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

      {/* Column Labels */}
      {coinsWithPrices.length > 0 && (
        <View style={styles.columnLabels}>
          <Text style={styles.labelname}>Coin</Text>
          <View style={styles.labelRight}>
            <Text style={styles.label}>Price</Text>
            <Text style={styles.label}> 1H</Text>
            <Text style={styles.label}>24H</Text>
            <Text style={styles.label}> 7D</Text>
          </View>
        </View>
      )}

      {/* Coin List */}
      {!hydrated ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Loading...</Text>
        </View>
      ) : coinsWithPrices.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No coins yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap "+ Add" to search and add up to 10 coins
          </Text>
        </View>
      ) : (
        <FlatList
          data={coinsWithPrices}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <CoinRow
              coin={item}
              onPress={() => router.push(`/coin/${item.id}`)}
            />
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
  labelname: {
    color: theme.text.muted,
    fontSize: 12,
    fontWeight: '500',
    width: 50,
    textAlign: 'left',
  },
  label: {
    color: theme.text.muted,
    fontSize: 12,
    fontWeight: '500',
    width: 45,
    textAlign: 'right',
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