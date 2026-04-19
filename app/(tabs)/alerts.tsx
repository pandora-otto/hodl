import { ErrorBoundary } from '../../components/ErrorBoundary';
import { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useAlertStore, PriceAlert } from '../../store/useAlertStore';
import { formatPrice } from '../../utils/formatters';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore, CURRENCIES } from '../../store/useSettingsStore';
import { useMemo } from 'react';
import Toast from '../../components/Toast';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PUSH_FAILED_KEY } from '../../services/pushToken';

type TabType = 'active' | 'triggered';

function AlertRow({
    alert,
    symbol,
    onDelete,
}: {
    alert: PriceAlert;
    symbol: string;
    onDelete: () => void;
}) {
    const theme = useTheme();
    const styles = useMemo(() => makeStyles(theme), [theme]);
    const isPrice = alert.type === 'price';

    const conditionText = isPrice
        ? `${alert.direction === 'above' ? '↑ Above' : '↓ Below'} ${formatPrice(alert.targetPrice!, symbol)}`
        : `${alert.direction === 'above' ? '↑ Increase' : '↓ Decrease'} ${alert.percentage}% from ${formatPrice(alert.baselinePrice!, symbol)}`;

    const triggeredText = alert.triggeredCount > 1 ? `Fired ${alert.triggeredCount}×` : 'Triggered';

    return (
        <View style={styles.row}>
            <View style={styles.rowLeft}>
                <View style={styles.rowTop}>
                    <Text style={styles.coinName}>{alert.coinName}</Text>
                    {alert.repeating && (
                        <View style={styles.repeatBadge}>
                            <Text style={styles.repeatBadgeText}>↺ Repeat</Text>
                        </View>
                    )}
                    {alert.triggered && (
                        <View style={styles.triggeredBadge}>
                            <Text style={styles.triggeredBadgeText}>{triggeredText}</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.condition}>{conditionText}</Text>
                {alert.notes && (
                    <Text style={styles.notes} numberOfLines={1}>
                        {alert.notes}
                    </Text>
                )}
            </View>
            <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} activeOpacity={0.7}>
                <Svg
                    width={16}
                    height={16}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={theme.text.muted}
                    strokeWidth="2"
                >
                    <Path d="M18 6L6 18M6 6l12 12" />
                </Svg>
            </TouchableOpacity>
        </View>
    );
}

export default function AlertsScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = useMemo(() => makeStyles(theme), [theme]);
    const { alerts, removeAlert, hydrate } = useAlertStore();
    const currency = useSettingsStore((state) => state.currency);
    const symbol = useMemo(
        () => CURRENCIES.find((c) => c.code === currency)?.symbol ?? '$',
        [currency],
    );

    const [activeTab, setActiveTab] = useState<TabType>('active');

    const [toastMsg, setToastMsg] = useState('');
    const [toastVisible, setToastVisible] = useState(false);
    const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback((msg: string) => {
        if (toastTimeout.current) clearTimeout(toastTimeout.current);
        setToastMsg(msg);
        setToastVisible(true);
        toastTimeout.current = setTimeout(() => {
            setToastVisible(false);
            setTimeout(() => setToastMsg(''), 300);
        }, 4000);
    }, []);

    const activeAlerts = alerts.filter((a) => !a.triggered);
    const triggeredAlerts = alerts.filter((a) => a.triggered);
    const displayedAlerts = activeTab === 'active' ? activeAlerts : triggeredAlerts;

    const handleDelete = useCallback(
        async (alert: PriceAlert) => {
            await removeAlert(alert.id);
            showToast(`${alert.coinName} alert removed`);
        },
        [removeAlert],
    );

    const isEmpty = displayedAlerts.length === 0;

    const [pushFailed, setPushFailed] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(PUSH_FAILED_KEY).then((val) => {
            setPushFailed(val === 'true');
        });
    }, []);

    useFocusEffect(
        useCallback(() => {
            hydrate();
        }, []),
    );

    return (
        <ErrorBoundary>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Price Alerts</Text>
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => router.push('/alert/new')}
                        activeOpacity={0.7}
                    >
                        <Svg
                            width={20}
                            height={20}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#fff"
                            strokeWidth="2.5"
                        >
                            <Path d="M12 5v14M5 12h14" strokeLinecap="round" />
                        </Svg>
                    </TouchableOpacity>
                </View>

                {/* Banner */}
                {pushFailed && (
                    <View style={styles.warningBanner}>
                        <Text style={styles.warningText}>
                            ⚠️ Push notifications unavailable. Alerts won't fire until this is
                            resolved. Check your network or ad blocker settings.
                        </Text>
                    </View>
                )}

                {/* Tabs */}
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'active' && styles.tabActive]}
                        onPress={() => setActiveTab('active')}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}
                        >
                            Active
                            {activeAlerts.length > 0 && (
                                <Text style={styles.tabCount}> {activeAlerts.length}</Text>
                            )}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'triggered' && styles.tabActive]}
                        onPress={() => setActiveTab('triggered')}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === 'triggered' && styles.tabTextActive,
                            ]}
                        >
                            Triggered
                            {triggeredAlerts.length > 0 && (
                                <Text style={styles.tabCount}> {triggeredAlerts.length}</Text>
                            )}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* List */}
                {isEmpty ? (
                    <View style={styles.center}>
                        {activeTab === 'active' ? (
                            <>
                                <Text style={styles.emptyTitle}>No active alerts</Text>
                                <Text style={styles.emptySubtitle}>
                                    Tap + to set a new price alert
                                </Text>
                            </>
                        ) : (
                            <>
                                <Text style={styles.emptyTitle}>No triggered alerts</Text>
                                <Text style={styles.emptySubtitle}>
                                    Alerts that have fired will appear here
                                </Text>
                            </>
                        )}
                    </View>
                ) : (
                    <FlatList
                        data={displayedAlerts}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <AlertRow
                                alert={item}
                                symbol={symbol}
                                onDelete={() => handleDelete(item)}
                            />
                        )}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        contentContainerStyle={{ paddingBottom: 40 }}
                    />
                )}

                <Toast message={toastMsg} visible={toastVisible} />
            </View>
        </ErrorBoundary>
    );
}

function makeStyles(theme: any) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.bg.primary },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: 50,
            paddingBottom: 16,
        },
        title: { color: theme.text.primary, fontSize: 28, fontWeight: 'bold' },
        addBtn: {
            backgroundColor: theme.accent.blue,
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
        },
        warningBanner: {
            backgroundColor: '#3a2a00',
            borderWidth: 1,
            borderColor: '#f5a623',
            margin: 12,
            borderRadius: 12,
            padding: 12,
        },
        warningText: { color: '#f5a623', fontSize: 13, lineHeight: 18 },
        tabs: {
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
            paddingHorizontal: 16,
            gap: 24,
        },
        tab: {
            paddingVertical: 12,
            borderBottomWidth: 2,
            borderBottomColor: 'transparent',
        },
        tabActive: { borderBottomColor: theme.accent.blue },
        tabText: { color: theme.text.muted, fontSize: 14, fontWeight: '600' },
        tabTextActive: { color: theme.text.primary },
        tabCount: { color: theme.accent.blue, fontSize: 13, fontWeight: '700' },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: theme.bg.primary,
        },
        rowLeft: { flex: 1, gap: 4, marginRight: 12 },
        rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
        coinName: { color: theme.text.primary, fontSize: 15, fontWeight: '600' },
        repeatBadge: {
            backgroundColor: theme.bg.secondary,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 6,
            paddingHorizontal: 6,
            paddingVertical: 2,
        },
        repeatBadgeText: { color: theme.text.muted, fontSize: 11, fontWeight: '600' },
        triggeredBadge: {
            backgroundColor: theme.accent.up + '22',
            borderRadius: 6,
            paddingHorizontal: 6,
            paddingVertical: 2,
        },
        triggeredBadgeText: { color: theme.accent.up, fontSize: 11, fontWeight: '600' },
        condition: { color: theme.text.secondary, fontSize: 13 },
        notes: { color: theme.text.muted, fontSize: 12, fontStyle: 'italic' },
        deleteBtn: { padding: 8 },
        separator: { height: 1, backgroundColor: theme.border, marginLeft: 16 },
        center: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingHorizontal: 40,
        },
        emptyTitle: { color: theme.text.primary, fontSize: 18, fontWeight: '600' },
        emptySubtitle: { color: theme.text.muted, fontSize: 14, textAlign: 'center' },
    });
}
