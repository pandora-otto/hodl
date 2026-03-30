import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { CoinMarket } from '../services/coingecko';
import { formatPrice, formatPercent } from '../utils/formatters';
import { theme } from '../constants/theme';

interface Props {
  coin: CoinMarket;
  onPress: () => void;
}

function PercentCell({ value }: { value: number }) {
  const color = value >= 0 ? theme.accent.up : theme.accent.down;
  return (
    <Text style={[styles.percent, { color }]}>
      {formatPercent(value)}
    </Text>
  );
}

export default function CoinRow({ coin, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.left}>
        {/* <Image source={{ uri: coin.image }} style={styles.image} /> */}
        <View>
          <Text style={styles.name}>{coin.name}</Text>
          <Text style={styles.symbol}>{coin.symbol.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.price}>{formatPrice(coin.current_price)}</Text>
        <View style={styles.percents}>
          <PercentCell value={coin.price_change_percentage_1h_in_currency} />
          <PercentCell value={coin.price_change_percentage_24h_in_currency} />
          <PercentCell value={coin.price_change_percentage_7d_in_currency} />
        </View>
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
    gap: 8,
    flex: 1,
  },
  image: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    alignItems: 'flex-end',
    gap: 4,
  },
  price: {
    color: theme.text.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  percents: {
    flexDirection: 'row',
    gap: 8,
  },
  percent: {
    fontSize: 12,
    fontWeight: '500',
  },
});