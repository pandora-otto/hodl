import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_STORAGE_KEY = 'expo_push_token';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

async function requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
        console.warn('Push notifications require a physical device');
        return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    return finalStatus === 'granted';
}

async function getToken(): Promise<string | null> {
    try {
        const token = await Notifications.getExpoPushTokenAsync({
            projectId: process.env.EXPO_PUBLIC_PROJECT_ID, // from app.json > extra > eas > projectId
        });
        return token.data;
    } catch (e) {
        console.warn('Failed to get push token:', e);
        return null;
    }
}

async function saveTokenToSupabase(token: string): Promise<void> {
    const platform = Platform.OS as 'ios' | 'android';

    const { error } = await supabase
        .from('devices')
        .upsert(
            { push_token: token, platform, last_seen: new Date().toISOString() },
            { onConflict: 'push_token' },
        );

    if (error) console.warn('Failed to save push token:', error.message);
}

export async function registerPushToken(): Promise<string | null> {
    const granted = await requestPermissions();
    if (!granted) return null;

    const token = await getToken();
    if (!token) return null;

    // Save locally so other parts of the app can access it
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);

    // Save to Supabase
    await saveTokenToSupabase(token);

    return token;
}

export async function getStoredPushToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_STORAGE_KEY);
}
