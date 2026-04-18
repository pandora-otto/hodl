import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useWatchlistStore } from '../store/useWatchlistStore';
import { usePriceStore } from '../store/usePriceStore';
import { useAlertStore } from '../store/useAlertStore';
import { usePriceFetcher } from '../hooks/usePriceFetcher';
import { useSettingsStore } from '../store/useSettingsStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { registerPushToken, updateDeviceLastSeen } from '../services/pushToken';
import Constants from 'expo-constants';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// This is picked up by Expo Router automatically — catches route-level crashes
// (e.g. missing env vars, bad imports) instead of killing the whole app
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>{error.message}</Text>
            <TouchableOpacity style={styles.button} onPress={retry}>
                <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
        </View>
    );
}

export default function RootLayout() {
    const hydrateWatchlist = useWatchlistStore((state) => state.hydrate);
    const hydratePrices = usePriceStore((state) => state.hydrate);
    const hydrateAlerts = useAlertStore((state) => state.hydrate);
    const hydrateSettings = useSettingsStore((state) => state.hydrate);

    // Configure foreground notifications
    useEffect(() => {
        import('expo-notifications').then((Notifications) => {
            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowBanner: true,
                    shouldShowList: true,
                    shouldPlaySound: true,
                    shouldSetBadge: false,
                }),
            });
        });
    }, []);

    useEffect(() => {
        hydrateWatchlist();
        hydratePrices();
        hydrateAlerts();
        hydrateSettings();

        // Skip push token registration in Expo Go
        const isExpoGo = Constants.executionEnvironment === 'storeClient';
        if (!isExpoGo) {
            registerPushToken().catch(console.warn);
            updateDeviceLastSeen().catch(console.warn);
        }
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StatusBar style="light" />

            <Stack
                screenOptions={{
                    headerShown: false,
                    headerStyle: { backgroundColor: '#111827' },
                    headerTintColor: '#fff',
                    contentStyle: { backgroundColor: '#111827' },
                }}
            />
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B0F1A',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 12,
    },
    message: {
        color: '#9CA3AF',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 20,
    },
    button: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});
