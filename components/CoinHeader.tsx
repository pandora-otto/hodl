import { View, Text, StyleSheet } from 'react-native';
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
      <Text style={styles.price}>{formatPrice(coin.current_price)}</Text>

      <View style={styles.row}>
        <Text style={[styles.change, { color: changeColor }]}>
          {formatPercent(change24h)} for 24H
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.lowHigh}>
          Low{' '}
          <Text style={{ color: theme.accent.down }}>
            {formatPrice(coin.low_24h)}
          </Text>
          {'  ·  '}
          High{' '}
          <Text style={{ color: theme.accent.up }}>
            {formatPrice(coin.high_24h)}
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  name: {
    color: theme.text.secondary,
    fontSize: 14,
    marginBottom: 4,
  },
  price: {
    color: theme.text.primary,
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  row: {
    marginBottom: 4,
  },
  change: {
    fontSize: 15,
    fontWeight: '600',
  },
  lowHigh: {
    color: theme.text.secondary,
    fontSize: 13,
  },
});