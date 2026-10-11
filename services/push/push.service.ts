import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

// expo-notifications throws on *import* in Expo Go (Android, SDK 53+), which
// would break every screen that imports this file. Load it lazily instead.
async function loadNotifications() {
  // Skip the import in Expo Go: it logs a red error even when caught.
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return null;
  try {
    const Notifications = await import('expo-notifications');
    // Show notifications while the app is foregrounded; without this they arrive
    // silently and only appear in the tray after the app is backgrounded.
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    return Notifications;
  } catch (error) {
    console.log('expo-notifications unavailable (Expo Go?)', error);
    return null;
  }
}

/**
 * Returns the native FCM registration token, or null if unavailable.
 *
 * The backend sends via firebase-admin (`admin.messaging().send({ token })`),
 * so it needs the *device* token. getExpoPushTokenAsync() returns an
 * `ExponentPushToken[...]` string, which firebase-admin rejects as an invalid
 * registration token — and the backend reacts to that by nulling the stored
 * token, so the mistake looks like an unsubscribe rather than a bug.
 */
export async function getFcmToken(): Promise<string | null> {
  // iOS Simulator has no APNs registration; Android emulators with Play
  // Services do get real FCM tokens, so only iOS is excluded here.
  if (Platform.OS === 'ios' && !Device.isDevice) return null;

  const Notifications = await loadNotifications();
  if (!Notifications) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  const granted =
    existing.status === 'granted' ||
    (await Notifications.requestPermissionsAsync()).status === 'granted';
  if (!granted) return null;

  try {
    const { data } = await Notifications.getDevicePushTokenAsync();
    return typeof data === 'string' ? data : null;
  } catch (error) {
    console.log('FCM token fetch failed', error);
    return null;
  }
}

/**
 * Calls `onReceive` when a push arrives while the app is open and `onTap` when the
 * user taps one (including the one that cold-started the app). Returns an unsubscribe.
 */
export function subscribeToPush(onReceive: () => void, onTap: () => void): () => void {
  let cancelled = false;
  const subs: { remove: () => void }[] = [];

  loadNotifications().then(async (Notifications) => {
    if (!Notifications || cancelled) return;
    subs.push(Notifications.addNotificationReceivedListener(onReceive));
    subs.push(Notifications.addNotificationResponseReceivedListener(onTap));
    // The tap that launched the app happened before any listener existed
    if (await Notifications.getLastNotificationResponseAsync()) {
      Notifications.clearLastNotificationResponse(); // or it would fire again on the next mount
      onTap();
    }
  });

  return () => {
    cancelled = true;
    subs.forEach((s) => s.remove());
  };
}
