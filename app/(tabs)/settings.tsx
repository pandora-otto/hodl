import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { theme } from '../../constants/theme';
import {
    useSettingsStore,
    CURRENCIES,
    Currency,
    DisplaySettings,
    DefaultView,
} from '../../store/useSettingsStore';

function SectionTitle({ title }: { title: string }) {
    return <Text style={styles.sectionTitle}>{title}</Text>;
}

function Divider() {
    return <View style={styles.divider} />;
}

export default function SettingsScreen() {
    const {
        currency,
        display: rawDisplay,
        defaultView,
        setCurrency,
        setDisplay,
        setDefaultView,
    } = useSettingsStore();

    const display = rawDisplay ?? {
        show1h: true,
        show24h: true,
        show7d: true,
        showImage: false,
        showTabLabels: true,
    };
    const toggleDisplay = (key: keyof DisplaySettings) => {
        const updated = { ...display, [key]: !display[key] };

        // If all 3 percentage columns are now on, force showImage off
        if (updated.show1h && updated.show24h && updated.show7d) {
            updated.showImage = false;
        }

        setDisplay(updated);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
            </View>

            {/* Default View */}
            <SectionTitle title="Default Screen" />
            <View style={styles.card}>
                <TouchableOpacity style={styles.row} onPress={() => setDefaultView('coins')}>
                    <Text style={styles.rowLabel}>All Coins</Text>
                    {defaultView === 'coins' && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
                <Divider />
                <TouchableOpacity style={styles.row} onPress={() => setDefaultView('favorites')}>
                    <Text style={styles.rowLabel}>Favorites</Text>
                    {defaultView === 'favorites' && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
            </View>

            {/* Currency */}
            <SectionTitle title="Currency" />
            <View style={styles.card}>
                {CURRENCIES.map((c, index) => (
                    <View key={c.code}>
                        <TouchableOpacity style={styles.row} onPress={() => setCurrency(c.code)}>
                            <View style={styles.rowLeft}>
                                <Text style={styles.currencySymbol}>{c.symbol}</Text>
                                <Text style={styles.rowLabel}>{c.label}</Text>
                            </View>
                            {currency === c.code && <Text style={styles.check}>✓</Text>}
                        </TouchableOpacity>
                        {index < CURRENCIES.length - 1 && <Divider />}
                    </View>
                ))}
            </View>

            {/* Display */}
            <SectionTitle title="Show Columns" />
            <View style={styles.card}>
                <View style={styles.row}>
                    <Text style={styles.rowLabel}>1H Change</Text>
                    <Switch
                        value={display.show1h}
                        onValueChange={() => toggleDisplay('show1h')}
                        trackColor={{ true: theme.accent.blue }}
                        thumbColor="#fff"
                    />
                </View>
                <Divider />
                <View style={styles.row}>
                    <Text style={styles.rowLabel}>24H Change</Text>
                    <Switch
                        value={display.show24h}
                        onValueChange={() => toggleDisplay('show24h')}
                        trackColor={{ true: theme.accent.blue }}
                        thumbColor="#fff"
                    />
                </View>
                <Divider />
                <View style={styles.row}>
                    <Text style={styles.rowLabel}>7D Change</Text>
                    <Switch
                        value={display.show7d}
                        onValueChange={() => toggleDisplay('show7d')}
                        trackColor={{ true: theme.accent.blue }}
                        thumbColor="#fff"
                    />
                </View>
                <Divider />
                <View style={styles.row}>
                    <View>
                        <Text style={styles.rowLabel}>Coin Images</Text>
                        {display.show1h && display.show24h && display.show7d && (
                            <Text style={styles.hint}>Turn off a % column to enable</Text>
                        )}
                    </View>
                    <Switch
                        value={
                            display.showImage &&
                            !(display.show1h && display.show24h && display.show7d)
                        }
                        onValueChange={() => toggleDisplay('showImage')}
                        disabled={display.show1h && display.show24h && display.show7d}
                        trackColor={{ true: theme.accent.blue }}
                        thumbColor="#fff"
                    />
                </View>
            </View>

            {/* Display */}
            <SectionTitle title="Tab Bar" />
            <View style={styles.card}>
                <View style={styles.row}>
                    <Text style={styles.rowLabel}>Show Labels</Text>
                    <Switch
                        value={display.showTabLabels}
                        onValueChange={() => toggleDisplay('showTabLabels')}
                        trackColor={{ true: theme.accent.blue }}
                        thumbColor="#fff"
                    />
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.bg.primary,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
    },
    title: {
        color: theme.text.primary,
        fontSize: 28,
        fontWeight: 'bold',
    },
    sectionTitle: {
        color: theme.text.muted,
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    card: {
        backgroundColor: theme.bg.secondary,
        marginHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
        marginBottom: 24,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    rowLabel: {
        color: theme.text.primary,
        fontSize: 15,
    },
    hint: {
        color: theme.text.muted,
        fontSize: 11,
        marginTop: 2,
    },
    currencySymbol: {
        color: theme.accent.blue,
        fontSize: 15,
        fontWeight: '700',
        width: 24,
        textAlign: 'center',
    },
    check: {
        color: theme.accent.blue,
        fontSize: 16,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: theme.border,
        marginHorizontal: 16,
    },
});
