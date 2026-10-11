import { View, FlatList, StyleSheet, Image, ActivityIndicator, Pressable } from 'react-native'
import React, { useCallback, useRef, useState } from 'react'
import { useFocusEffect } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useScreenPadding } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { color, space } from '@/theme';
import { authService } from '@/services/instances';
import { Notice } from '@/services/types/api.types';
import { useAuth } from '@/services/hooks/useAuth';
import { markSeen } from '@/services/push/unread';
import { setUnread } from '@/store/noticesSlice';

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Colombo' });

const Notification = () => {
    const padding = useScreenPadding({ tabBar: true, gutters: false });
    const dispatch = useDispatch();
    const userId = useAuth().user?.id;
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [failed, setFailed] = useState(false);
    const hasLoaded = useRef(false);

    const load = useCallback(async () => {
        try {
            const list = await authService.getNotices();
            setNotices(list);
            // Opening the tab is what clears the badge
            if (userId) await markSeen(userId, list);
            dispatch(setUnread(0));
            setFailed(false);
            hasLoaded.current = true;
        } catch (error) {
            console.error('Failed to load notices:', error);
            // Keep showing the last good list on a refresh failure
            if (!hasLoaded.current) setFailed(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userId, dispatch]);

    // Reload whenever the tab is focused (also runs on first mount)
    useFocusEffect(useCallback(() => { load(); }, [load]));

    const retry = () => { setFailed(false); setLoading(true); load(); };

    const renderItem = ({ item }: { item: Notice }) => (
        <Card style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: space.md }}>
            <Image source={require('../../assets/bell.png')} style={styles.icon} />
            <View style={{ flex: 1 }}>
                <AppText variant="body" weight="bold" style={{ marginBottom: space.xs }}>
                    {item.title}
                </AppText>
                <AppText variant="caption" style={{ marginBottom: space.xs }}>
                    {item.body}
                </AppText>
                <AppText variant="caption" tone="muted">
                    {formatDate(item.createdAt)}
                </AppText>
            </View>
        </Card>
    );

    const renderEmpty = () => {
        if (loading) return <ActivityIndicator size="large" color={color.brand} style={styles.center} />;
        if (failed) {
            return (
                <Pressable onPress={retry} style={styles.center} accessibilityRole="button">
                    <AppText tone="muted">Could not load notifications.</AppText>
                    <AppText weight="bold" style={{ color: color.brand, marginTop: space.sm }}>Tap to retry</AppText>
                </Pressable>
            );
        }
        return <AppText tone="muted" style={styles.center}>No notifications yet.</AppText>;
    };

    return (
        <View style={[styles.container, { paddingTop: padding.paddingTop }]}>
            <View style={{ alignItems: 'flex-start', marginTop: 0, marginHorizontal: space.md }}>
                <AppText variant="h1" weight="bold">RC Caterings</AppText>
            </View>
            <View style={{ alignItems: 'flex-start', marginTop: 20, marginHorizontal: space.md }}>
                <AppText variant="h2" weight="bold" style={{ color: color.brand, marginBottom: 20 }}>Notifications</AppText>
            </View>
            <FlatList
                data={notices}
                renderItem={renderItem}
                keyExtractor={(item) => String(item.id)}
                ListEmptyComponent={renderEmpty}
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); load(); }}
                contentContainerStyle={{ paddingBottom: padding.paddingBottom }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    icon: { width: 44, height: 44, marginRight: space.md },
    center: { marginTop: 80, alignItems: 'center', textAlign: 'center' },
});


export default Notification
