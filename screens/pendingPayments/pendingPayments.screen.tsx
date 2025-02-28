import React from 'react';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';

interface PendingPayment {
    id: string;
    date: string;
    price: string;
}

const pendingPayments: PendingPayment[] = [
    { id: '5012', date: '2024/06/22', price: 'Rs. 560.00' },
    { id: '5013', date: '2024/06/23', price: 'Rs. 720.00' },
];

const PendingPaymentsScreen = () => {
    const renderItem = ({ item }: { item: PendingPayment }) => (
        <View style={styles.card}>
            <Image source={require('../../assets/pendPay.png')} style={styles.icon} />
            <View>
                <Text style={styles.orderId}>Order ID - {item.id}</Text>
                <Text style={styles.details}>Date: {item.date}</Text>
                <Text style={styles.price}>Price: {item.price}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={{ alignItems: 'flex-start', marginTop: 70, marginHorizontal: 15 }}>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0A0A0F' }}>RC Caterings</Text>
            </View>
             <View style={{ alignItems: 'flex-start', marginTop: 20, marginHorizontal: 15 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0A0A0F' }}>Pending Payments</Text>
                  </View>
                  <View style={{ alignItems: 'flex-start', marginTop: 20, marginHorizontal: 15 ,}}>
                    <Text style={{ fontSize: 14, color: '#666', marginBottom: 25 }}>
                    If you have two unpaid orders, you won't be able to place new ones. Clear payments to continue.
                    </Text>
                  </View>
            {/* <Text style={styles.description}>
                If you have two unpaid orders, you won't be able to place new ones. Clear payments to continue.
            </Text> */}
            <FlatList
                data={pendingPayments}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
    description: { fontSize: 14, color: '#666', marginBottom: 15 },
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
        borderColor: '#oaoaoa',
        // iOS Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        marginTop: 10,
    },
    icon: { width: 90, height: 90, marginRight: 35, marginLeft: 15 },
    orderId: { fontSize: 16, fontWeight: 'bold', color: '#69bf70' , paddingBottom:10},
    details: { fontSize: 14, color: '#oaoaoa' },
    price: { fontSize: 14, color: '#oaoaoa', fontWeight: 'bold' ,paddingTop:10},
});

export default PendingPaymentsScreen;
