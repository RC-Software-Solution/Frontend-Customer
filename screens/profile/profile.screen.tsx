import { View, Text, TextInput, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import React from 'react'
import CancelModal from '@/components/popupmodel/popupModel';
import { useEffect, useState } from 'react';
import { authService } from '@/services';
import { User } from '@/services/types/api.types';
import { router, useFocusEffect } from 'expo-router';
import { useScreenPadding } from '@/components/ui/Screen';

const Profile = () => {
    const padding = useScreenPadding({ tabBar: true, gutters: false });
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCurrentUser();
    }, []);

    // Refresh user data when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            loadCurrentUser();
        }, [])
    );

    const loadCurrentUser = async () => {
        try {
            setLoading(true);
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
        } catch (error) {
            console.error('Failed to load user:', error);
            // If user is not authenticated, redirect to login
            router.replace('/(routes)/login');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await authService.deleteAccount();
            Alert.alert(
                'Account Deleted',
                'Your account has been successfully deleted.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setModalVisible(false);
                            router.replace('/(routes)/login');
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Failed to delete account:', error);
            Alert.alert('Error', 'Failed to delete account. Please try again.');
        }
    };

    const handleLogout = async () => {
        try {
            await authService.logout();
            router.replace('/(routes)/login');
        } catch (error) {
            console.error('Failed to logout:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
        }
    };


     const [modalVisible, setModalVisible] = useState(false);
    return (
        <View style={[styles.container, { paddingTop: padding.paddingTop }]}>
            <View style={{ alignItems: 'flex-start', marginTop: 0, marginHorizontal: 15 }}>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0A0A0F' }}>RC Caterings</Text>
            </View>
            <View style={{ alignItems: 'flex-start', marginTop: 20, marginHorizontal: 15 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#69bf70' }}>Profile</Text>
            </View>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#69bf70" />
                    <Text style={styles.loadingText}>Loading profile...</Text>
                </View>
            ) : (
                <>
                    <View style={styles.header}>
                        <View style={styles.profileImageContainer}>
                            <Image source={require('../../assets/propic.png')} style={styles.profileImage} />
                        </View>
                        <Text style={styles.name}>{user?.full_name || "Unknown User"}</Text>
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
                </>
            )}

            {!loading && (
                <>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutButtonText}>Logout</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.deleteButton} onPress={() => setModalVisible(true)}>
                        <Text style={styles.deleteButtonText}>Delete Account</Text>
                    </TouchableOpacity>
                </>
            )}
            <CancelModal 
                visible={modalVisible} 
                onClose={() => setModalVisible(false)} 
                onConfirm={handleDeleteAccount}
                title="Delete Account"
                message="Are you sure you want to delete your account? This action cannot be undone."
                confirmText="Yes, Delete"
                cancelText="Cancel"
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
    logoutButton: {
        backgroundColor: '#69bf70',
        padding: 15,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 20,
        marginHorizontal: 16,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        width: 200,
        alignSelf: 'flex-end',
    },
    logoutButtonText: { 
        color: '#fff', 
        fontSize: 16, 
        fontWeight: 'bold' 
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#69bf70',
        fontWeight: '500',
    },
});

export default Profile