import { View, Text ,FlatList, StyleSheet, Image } from 'react-native'
import React from 'react'
import { useScreenPadding } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { space } from '@/theme';

interface Notification {
    id: string;
    message: string;
    date: string;
}

const notifications: Notification[] = [
    { id: '1', message: 'Your order #5012 has been confirmed.', date: '2024/06/22' },
    { id: '2', message: 'Payment for order #5013 is pending.', date: '2024/06/23' },
];

const Notification = () => {
    const padding = useScreenPadding({ tabBar: true, gutters: false });
    const renderItem = ({ item }: { item: Notification }) => (
        <Card style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: space.md }}>
            <Image source={require('../../assets/bell.png')} style={styles.icon} />
            <View style={{ flex: 1 }}>
                <AppText variant="body" weight="bold" style={{ marginBottom: space.xs }}>
                    {item.message}
                </AppText>
                <AppText variant="caption" tone="muted">
                    {item.date}
                </AppText>
            </View>
        </Card>
    );

    return (
        <View style={[styles.container, { paddingTop: padding.paddingTop }]}>
            <View style={{ alignItems: 'flex-start', marginTop: 0, marginHorizontal: space.md }}>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0A0A0F' }}>RC Caterings</Text>
            </View>
            <View style={{ alignItems: 'flex-start', marginTop: 20, marginHorizontal: space.md }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#69bf70',marginBottom:20 }}>Notifications</Text>
            </View>
            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: padding.paddingBottom }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    icon: { width: 44, height: 44, marginRight: space.md },
});


export default Notification