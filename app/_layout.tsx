import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useWatchlistStore } from '../store/useWatchlistStore';
import { usePriceStore } from '../store/usePriceStore';
import { useAlertStore } from '../store/useAlertStore';
import { usePriceFetcher } from '../hooks/usePriceFetcher';
import { useAlertChecker } from '../hooks/useAlertChecker';
import { requestNotificationPermission } from '../services/notifications';
import { useSettingsStore } from '../store/useSettingsStore';

function AppInitializer() {
    usePriceFetcher();
    useAlertChecker();
    return null;
}

export default function RootLayout() {
    const hydrateWatchlist = useWatchlistStore((state) => state.hydrate);
    const hydratePrices = usePriceStore((state) => state.hydrate);
    const hydrateAlerts = useAlertStore((state) => state.hydrate);
    const hydrateSettings = useSettingsStore((state) => state.hydrate);

    useEffect(() => {
        hydrateWatchlist();
        hydratePrices();
        hydrateAlerts();
        hydrateSettings();
        requestNotificationPermission();
    }, []);

    return (
        <>
            <AppInitializer />
            <Stack
                screenOptions={{
                    headerShown: false,
                    headerStyle: { backgroundColor: '#111827' },
                    headerTintColor: '#fff',
                    contentStyle: { backgroundColor: '#111827' },
                }}
            />
        </>
    );
}
