import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { useAlertStore, PriceAlert } from '../../store/useAlertStore';
import { formatPrice } from '../../utils/formatters';
import { theme } from '../../constants/theme';
import { useRouter } from 'expo-router';

function AlertRow({ alert, onDelete }: { alert: PriceAlert; onDelete: () => void }) {
    return (
        <View style={[styles.row, alert.triggered && styles.rowTriggered]}>
            <View style={styles.rowLeft}>
                <Text style={styles.coinName}>{alert.coinName}</Text>
                <View style={styles.conditionRow}>
                    <Text style={styles.direction}>
                        {alert.direction === 'above' ? '▲ Above' : '▼ Below'}
                    </Text>
                    <Text style={styles.target}>{formatPrice(alert.targetPrice)}</Text>
                </View>
                {alert.triggered && <Text style={styles.triggeredBadge}>✓ Triggered</Text>}
            </View>
            <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
        </View>
    );
}

function AlertIcon({ focused }: { focused: boolean }) {
    const color = focused ? theme.text.primary : theme.text.secondary;
    return (
        <Svg width={16} height={16} viewBox="0 0 24 24" stroke={color} strokeWidth="2" fill="none">
            <Path d="M20.59,14.86V10.09A8.6,8.6,0,0,0,12,1.5h0a8.6,8.6,0,0,0-8.59,8.59v4.77L1.5,16.77v1.91h21V16.77Z"></Path>
            <Path d="M14.69,18.68a2.55,2.55,0,0,1,.17,1,2.86,2.86,0,0,1-5.72,0,2.55,2.55,0,0,1,.17-1"></Path>
        </Svg>
    );
}

export default function AlertsScreen() {
    const { alerts, removeAlert } = useAlertStore();

    const handleDelete = (alert: PriceAlert) => {
        Alert.alert(
            'Remove Alert',
            `Remove ${alert.direction} ${formatPrice(alert.targetPrice)} alert for ${alert.coinName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => removeAlert(alert.id),
                },
            ],
        );
    };

    const active = alerts.filter((a) => !a.triggered);
    const triggered = alerts.filter((a) => a.triggered);
    const router = useRouter();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                {/* <TouchableOpacity onPress={() => router.back()}>
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                        <Path
                            d="M15 18L9 12L15 6"
                            stroke={styles.back.color}
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </Svg>
                </TouchableOpacity> */}
                <Text style={styles.title}>Price Alerts</Text>
            </View>

            {alerts.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyTitle}>No alerts set</Text>
                    <Text style={styles.emptySubtitle}>
                        Open a coin and tap <AlertIcon focused={false} /> to set a price alert
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={[...active, ...triggered]}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <AlertRow alert={item} onDelete={() => handleDelete(item)} />
                    )}
                    ListHeaderComponent={
                        active.length > 0 ? (
                            <Text style={styles.sectionLabel}>Active ({active.length})</Text>
                        ) : null
                    }
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    contentContainerStyle={{ paddingBottom: 40 }}
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
    // header: {
    //   paddingHorizontal: 16,
    //   paddingTop: 60,
    //   paddingBottom: 16,
    //   borderBottomWidth: 1,
    //   borderBottomColor: theme.border,
    // },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 8,
        gap: 16,
    },
    back: {
        color: theme.accent.blue,
        fontSize: 16,
        fontWeight: '600',
    },
    title: {
        color: theme.text.primary,
        fontSize: 28,
        fontWeight: 'bold',
    },
    sectionLabel: {
        color: theme.text.muted,
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: theme.bg.card,
    },
    rowTriggered: {
        opacity: 0.5,
    },
    rowLeft: {
        flex: 1,
        gap: 4,
    },
    coinName: {
        color: theme.text.primary,
        fontSize: 15,
        fontWeight: '600',
    },
    conditionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    direction: {
        color: theme.text.secondary,
        fontSize: 13,
    },
    target: {
        color: theme.accent.blue,
        fontSize: 13,
        fontWeight: '600',
    },
    triggeredBadge: {
        color: theme.accent.up,
        fontSize: 12,
        fontWeight: '600',
    },
    deleteBtn: {
        padding: 8,
    },
    deleteText: {
        color: theme.text.muted,
        fontSize: 16,
    },
    separator: {
        height: 1,
        backgroundColor: theme.border,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        color: theme.text.primary,
        fontSize: 18,
        fontWeight: '600',
    },
    emptySubtitle: {
        color: theme.text.secondary,
        fontSize: 15,
        textAlign: 'center',
    },
});
