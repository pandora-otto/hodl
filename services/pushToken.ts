// import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_STORAGE_KEY = 'expo_push_token';

// Configure how notifications appear when app is in foreground
// Notifications.setNotificationHandler({
//     handleNotification: async () => ({
//         shouldShowAlert: true,
//         shouldPlaySound: true,
//         shouldSetBadge: false,
//         shouldShowBanner: true,
//         shouldShowList: true,
//     }),
// });

async function requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) return false;
    try {
        const Notifications = await import('expo-notifications');
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        console.log('Existing notification permissions:', existingStatus);
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        return finalStatus === 'granted';
    } catch {
        return false;
    }
}

async function getToken(): Promise<string | null> {
    try {
        const Notifications = await import('expo-notifications');
        const token = await Notifications.getExpoPushTokenAsync({
            projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
        });
        return token.data;
    } catch (e) {
        console.warn('Push token unavailable (Expo Go?):', e);
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
    if (!granted) {
        console.log('PUSH: permission denied');
        return null;
    }
    const token = await getToken();

    if (!token) {
        console.log('PUSH: token generation failed');
        return null;
    }
    console.log('PUSH TOKEN:', token);

    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    await saveTokenToSupabase(token);
    return token;
}

export async function getStoredPushToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_STORAGE_KEY);
}
