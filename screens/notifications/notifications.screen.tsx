import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import React, { useCallback, useRef, useState } from 'react'
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useScreenPadding } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { color, space } from '@/theme';
import { authService } from '@/services/instances';
import { Notice } from '@/services/types/api.types';
import { useAuth } from '@/services/hooks/useAuth';
import { markSeen, readSeen } from '@/services/push/unread';
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
    // The watermark as it was when the tab was opened: cards above it stay highlighted until the tab is left and reopened.
    const seenAtOpen = useRef(0);

    const load = useCallback(async (fromFocus: boolean) => {
        try {
            const list = await authService.getNotices();
            // Read before markSeen moves it; a pull-to-refresh keeps the value from when the tab opened
            if (fromFocus && userId) seenAtOpen.current = await readSeen(userId);
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
    useFocusEffect(useCallback(() => { load(true); }, [load]));

    const retry = () => { setFailed(false); setLoading(true); load(true); };

    const renderItem = ({ item }: { item: Notice }) => {
        const unread = Number(item.id) > seenAtOpen.current;
        return (
            <Card
                testID={`notice-${item.id}`}
                style={[styles.notice, unread ? styles.unread : styles.read]}
            >
                <View style={[styles.disc, { backgroundColor: unread ? color.brandSoft : color.field }]}>
                    <Ionicons name="megaphone-outline" size={20} color={unread ? color.brandStrong : color.muted} />
                </View>
                <View style={{ flex: 1 }}>
                    <AppText variant="body" weight={unread ? 'bold' : 'semibold'} tone={unread ? 'ink' : 'muted'}>
                        {item.title}
                    </AppText>
                    <AppText variant="caption" tone="muted" style={{ marginTop: space.xs }}>
                        {item.body}
                    </AppText>
                    <AppText variant="micro" tone="muted" style={{ marginTop: space.sm - 2 }}>
                        {formatDate(item.createdAt)}
                    </AppText>
                </View>
                {unread ? <View style={styles.dot} accessible accessibilityLabel="Unread" /> : null}
            </Card>
        );
    };

    const renderEmpty = () => {
        if (loading) return <ActivityIndicator size="large" color={color.brandStrong} />;
        if (failed) {
            return (
                <EmptyState
                    icon="cloud-offline-outline"
                    title="Could not load notifications."
                    actionLabel="Tap to retry"
                    onAction={retry}
                />
            );
        }
        return (
            <EmptyState
                icon="notifications-outline"
                title="No notifications yet."
                message="Announcements from RC Caterings appear here."
            />
        );
    };

    return (
        <View style={[styles.container, { paddingTop: padding.paddingTop }]}>
            <View style={{ alignItems: 'flex-start', marginTop: 0, marginHorizontal: space.md }}>
                <AppText variant="h1" weight="bold">RC Caterings</AppText>
            </View>
            <View style={{ alignItems: 'flex-start', marginTop: space.sm + space.xs, marginBottom: space.sm + space.xs, marginHorizontal: space.md }}>
                <AppText variant="h2" weight="bold">Notifications</AppText>
            </View>
            <FlatList
                testID="notices-list"
                data={notices}
                renderItem={renderItem}
                keyExtractor={(item) => String(item.id)}
                ListEmptyComponent={renderEmpty}
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); load(false); }}
                contentContainerStyle={[
                    { paddingBottom: padding.paddingBottom },
                    notices.length === 0 && styles.emptyContent,
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: color.bg },
    emptyContent: { flexGrow: 1, justifyContent: 'center' },
    notice: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: space.sm + space.xs,
        marginHorizontal: space.md,
        marginBottom: space.sm + space.xs,
        borderWidth: 2,
    },
    unread: { borderColor: color.brandSoft },
    read: { backgroundColor: 'transparent', borderColor: color.border, shadowOpacity: 0, elevation: 0 },
    disc: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: color.brandStrong, marginTop: 5 },
});


export default Notification
