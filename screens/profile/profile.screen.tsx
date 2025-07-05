import { View, Text, TextInput, StyleSheet, Image, TouchableOpacity } from 'react-native';
import React from 'react'
import CancelModal from '@/components/popupmodel/popupModel';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Profile = () => {

    const [user, setUser] = useState<any>(null); // or use a proper type

useEffect(() => {
  const loadUser = async () => {
    const storedUser = await AsyncStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  };

  loadUser();
}, []);


     const [modalVisible, setModalVisible] = useState(false);
    return (
        <View style={styles.container}>
            <View style={{ alignItems: 'flex-start', marginTop: 70, marginHorizontal: 15 }}>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0A0A0F' }}>RC Caterings</Text>
            </View>
            <View style={{ alignItems: 'flex-start', marginTop: 20, marginHorizontal: 15 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#69bf70' }}>Profile</Text>
            </View>
            <View style={styles.header}>
                <View style={styles.profileImageContainer}>
                    <Image source={require('../../assets/propic.png')} style={styles.profileImage} />
                </View>
               <Text style={styles.name}>{user?.full_name || "Loading..."}</Text>

            </View>

           <View style={styles.fieldContainer}>
  <Text style={styles.label}>User ID</Text>
  <TextInput style={styles.input} value={user?.id || ""} editable={false} />
</View>

<View style={styles.fieldContainer}>
  <Text style={styles.label}>Email</Text>
  <TextInput style={styles.input} value={user?.email || ""} editable={false} />
</View>

<View style={styles.fieldContainer}>
  <Text style={styles.label}>Location</Text>
  <TextInput style={styles.input} value={user?.address || ""} editable={false} />
</View>

<View style={styles.fieldContainer}>
  <Text style={styles.label}>Phone Number</Text>
  <TextInput style={styles.input} value={user?.phone || ""} editable={false} />
</View>

            <TouchableOpacity style={styles.deleteButton}onPress={() => setModalVisible(true)}>
                <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
            <CancelModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onConfirm={() => {
          setModalVisible(false);
          // Handle cancellation logic
        }} 
        title="Delete Account"
        message="Are you sure you want to delete the account?"
        confirmText="Yes"
        cancelText="No"
      />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { alignItems: 'center', marginVertical: 30 },
    profileImage: {
        width: 125, height: 125, borderRadius: 60, marginBottom: 10, top: -12, // Move it slightly upwards
        left: -5, position: "absolute",
    },
    name: { fontSize: 24, fontWeight: 'bold', color: '#4A4A4A', marginTop: 12 },
    role: { fontSize: 16, color: '#777' },
    fieldContainer: { marginBottom: 16 },
    label: { fontSize: 14, color: '#oaoaoa', marginBottom: 7, marginHorizontal: 16, },
    input: {
        backgroundColor: '#f0f0f0',
        padding: 17,
        borderRadius: 20,
        fontSize: 16,
        color: '#333',
        marginHorizontal: 16
    },
    profileImageContainer: {
        width: 109,  // Slightly larger than the image
        height: 109, // Keep it circular
        borderRadius: 55,
        overflow: "visible",  // Keeps part of the image inside
        alignItems: "center",
        justifyContent: "center",
        position: "relative",

        backgroundColor: '#69bf70',
        elevation: 5,

        // iOS Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        marginTop: 10,
    },

    // profileImage: {
    //     width: 120,  // Slightly bigger than container
    //     height: 120,
    //     borderRadius: 60, // Make it larger than the container
    //     position: "absolute",
    //     top: -5, // Move it slightly upwards
    //     left: -5, // Move it slightly left
    // },
    deleteButton: {
        backgroundColor: 'black',
        padding: 15,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 20,
        marginHorizontal: 16,
        elevation: 5,

        // iOS Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,


        width: 200,
        alignSelf: 'flex-end',
    },
    deleteButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', },
});

export default Profile