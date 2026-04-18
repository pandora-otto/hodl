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
