import React from 'react'
import { Tabs, router } from 'expo-router'
import { TabBar } from '@/components/tabBar/tabBar'
import { StatusBar } from 'expo-status-bar'
import { AppState } from 'react-native'
import { useDispatch } from 'react-redux'
import { useAuth } from '@/services/hooks/useAuth'
import { subscribeToPush } from '@/services/push/push.service'
import { fetchUnread } from '@/services/push/unread'
import { setUnread } from '@/store/noticesSlice'

// Keeps the Notifications tab badge current and opens the tab when a push is tapped
function useNoticeBadge() {
  const dispatch = useDispatch();
  const userId = useAuth().user?.id;

  React.useEffect(() => {
    if (!userId) return;
    const refresh = () => {
      fetchUnread(userId).then((n) => dispatch(setUnread(n))).catch(() => {}); // badge is best-effort
    };
    refresh();
    const appState = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    const unsubscribe = subscribeToPush(refresh, () => router.navigate('/notification'));
    return () => {
      appState.remove();
      unsubscribe();
    };
  }, [userId, dispatch]);
}

export default function TabsLayout() {
  useNoticeBadge();
  return (
    <>
    {/* Tab screens are light, so the clock/battery icons must be dark */}
    <StatusBar style="dark" />
    <Tabs tabBar={props => <TabBar {...props} />}>
    <Tabs.Screen name="index" options={{ title: 'Home', headerShown: false }} />
    <Tabs.Screen name="order-status/index" options={{ title: 'Orders', headerShown: false  }} />
    <Tabs.Screen name="pending-payments/index" options={{ title: 'Payments', headerShown: false  }} />
    <Tabs.Screen name="notification/index" options={{ title: 'Notifications', headerShown: false  }} />
    <Tabs.Screen name="profile/index" options={{ title: 'Profile', headerShown: false  }} />
</Tabs>
    </>
  )
}