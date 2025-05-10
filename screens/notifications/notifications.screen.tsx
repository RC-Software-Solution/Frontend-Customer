import { View, Text ,FlatList, StyleSheet, Image } from 'react-native'
import React from 'react'

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
    const renderItem = ({ item }: { item: Notification }) => (
        <View style={styles.card}>
            <Image source={require('../../assets/bell.png')} style={styles.icon} />
            <View>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.date}>{item.date}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={{ alignItems: 'flex-start', marginTop: 70, marginHorizontal: 15 }}>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0A0A0F' }}>RC Caterings</Text>
            </View>
            <View style={{ alignItems: 'flex-start', marginTop: 20, marginHorizontal: 15 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#69bf70',marginBottom:20 }}>Notifications</Text>
            </View>
            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    list: { paddingBottom: 20 },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 10,
        marginHorizontal: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        marginTop: 10,
    },
    icon: { width: 60, height: 60, marginRight: 20 },
    message: { fontSize: 16, fontWeight: 'bold', color: '#333', paddingBottom: 5 },
    date: { fontSize: 14, color: '#666' },
});


export default Notification