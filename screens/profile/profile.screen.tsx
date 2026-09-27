import { View, Text, TextInput, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import React from 'react'
import CancelModal from '@/components/popupmodel/popupModel';
import { useEffect, useState } from 'react';
import { authService } from '@/services';
import { User } from '@/services/types/api.types';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { AppButton } from '@/components/ui/AppButton';
import { color, space, shadow } from '@/theme';

const Profile = () => {
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
        <Screen scroll tabBar>
            <View style={{ alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0A0A0F' }}>RC Caterings</Text>
            </View>
            <View style={{ alignItems: 'flex-start', marginTop: 20 }}>
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
                        <View style={styles.profileImageShadow}>
                            <View style={styles.profileImageContainer}>
                                <Image source={require('../../assets/propic.png')} style={styles.profileImage} />
                            </View>
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
                    <AppButton title="Logout" onPress={handleLogout} />
                    <AppButton
                        title="Delete Account"
                        variant="danger"
                        onPress={() => setModalVisible(true)}
                        style={{ marginTop: space.md }}
                    />
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
        </Screen>
    );
};

const styles = StyleSheet.create({
    header: { alignItems: 'center', marginVertical: 30 },
    profileImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    name: { fontSize: 24, fontWeight: 'bold', color: '#4A4A4A', marginTop: 12 },
    role: { fontSize: 16, color: '#777' },
    fieldContainer: { marginBottom: 16 },
    label: { fontSize: 14, color: color.muted, marginBottom: 7 },
    input: {
        backgroundColor: '#f0f0f0',
        padding: 17,
        borderRadius: 20,
        fontSize: 16,
        color: '#333',
    },
    profileImageShadow: {
        width: 112,
        height: 112,
        borderRadius: 56,
        backgroundColor: color.brand,
        ...shadow.card,
    },
    profileImageContainer: {
        width: 112,
        height: 112,
        borderRadius: 56,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
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
