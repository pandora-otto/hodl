import * as Notifications from 'expo-notifications';
import { AlertDirection } from '../store/useAlertStore';
import { formatPrice } from '../utils/formatters';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
  // console.log('Notification permission requested (stubbed)');
  // return true;
}

export async function sendPriceAlert(
  coinName: string,
  currentPrice: number,
  targetPrice: number,
  direction: AlertDirection
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${coinName} Alert 🔔`,
      body: `Price is ${direction} your target of ${formatPrice(targetPrice)}. Current: ${formatPrice(currentPrice)}`,
      sound: true,
    },
    trigger: null, // fire immediately
  });
  // console.log(
  //   `ALERT: ${coinName} is ${direction} ${formatPrice(targetPrice)}. Current: ${formatPrice(currentPrice)}`
  // );
}