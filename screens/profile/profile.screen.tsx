import { View, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React from 'react'
import CancelModal from '@/components/popupmodel/popupModel';
import { useEffect, useState } from 'react';
import { authService, useAuth } from '@/services';
import { User } from '@/services/types/api.types';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { AppButton } from '@/components/ui/AppButton';
import { EditProfileForm } from '@/components/profile/EditProfileForm';
import { ChangePasswordModal } from '@/components/profile/ChangePasswordModal';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { initials } from './initials';
import { color, space } from '@/theme';

const Profile = () => {
    const { logout, deleteAccount, refreshUser } = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

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
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            // Route guard sends us to login once the session is cleared
            await deleteAccount();
            Alert.alert('Account Deleted', 'Your account has been successfully deleted.');
        } catch (error) {
            console.error('Failed to delete account:', error);
            Alert.alert('Error', 'Failed to delete account. Please try again.');
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Failed to logout:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
        }
    };


     const [modalVisible, setModalVisible] = useState(false);

    if (editing && user) {
        return (
            <EditProfileForm
                user={user}
                onCancel={() => setEditing(false)}
                onSaved={async (updated) => {
                    setUser(updated);
                    setEditing(false);
                    await refreshUser();
                }}
            />
        );
    }

    return (
        <Screen scroll tabBar background={color.bg}>
            <AppText variant="h1" weight="bold">Profile</AppText>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={color.brandStrong} />
                    <AppText tone="brand" style={{ marginTop: space.sm }}>Loading profile...</AppText>
                </View>
            ) : (
                <>
                    <View style={styles.header}>
                        <View style={styles.avatar}>
                            <AppText variant="h1" weight="bold" tone="brand">{initials(user?.full_name)}</AppText>
                        </View>
                        <AppText variant="h2" weight="bold" style={{ marginTop: space.sm + 2 }}>{user?.full_name || "Unknown User"}</AppText>
                        <AppText variant="caption" tone="muted">{user?.email || ""}</AppText>
                    </View>

                    <Card style={styles.group}>
                        <View style={styles.row}>
                            <Ionicons name="location-outline" size={20} color={color.muted} />
                            <View style={{ flex: 1 }}>
                                <AppText variant="micro" tone="muted">Location</AppText>
                                <AppText variant="body" weight="semibold">{user?.address || "Not set"}</AppText>
                            </View>
                        </View>
                        <View style={[styles.row, styles.rowDivider]}>
                            <Ionicons name="call-outline" size={20} color={color.muted} />
                            <View style={{ flex: 1 }}>
                                <AppText variant="micro" tone="muted">Phone Number</AppText>
                                <AppText variant="body" weight="semibold">{user?.phone || "Not set"}</AppText>
                            </View>
                        </View>
                    </Card>

                    <Card style={styles.group}>
                        <TouchableOpacity
                            style={styles.row}
                            onPress={() => setEditing(true)}
                            disabled={!user}
                            accessibilityRole="button"
                            accessibilityLabel="Edit Profile"
                            accessibilityState={{ disabled: !user }}
                        >
                            <Ionicons name="create-outline" size={20} color={color.ink} />
                            <AppText variant="body" weight="semibold" style={{ flex: 1 }}>Edit Profile</AppText>
                            <Ionicons name="chevron-forward" size={18} color={color.subtle} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.row, styles.rowDivider]}
                            onPress={() => setChangingPassword(true)}
                            accessibilityRole="button"
                            accessibilityLabel="Change Password"
                        >
                            <Ionicons name="lock-closed-outline" size={20} color={color.ink} />
                            <AppText variant="body" weight="semibold" style={{ flex: 1 }}>Change Password</AppText>
                            <Ionicons name="chevron-forward" size={18} color={color.subtle} />
                        </TouchableOpacity>
                    </Card>

                    <AppButton title="Logout" variant="outline" onPress={handleLogout} />

                    <View style={styles.dangerZone}>
                        <AppText variant="micro" tone="muted">Danger zone</AppText>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => setModalVisible(true)}
                            accessibilityRole="button"
                            accessibilityLabel="Delete Account"
                        >
                            <AppText variant="caption" weight="bold" tone="danger">Delete Account</AppText>
                        </TouchableOpacity>
                    </View>
                </>
            )}
            <ChangePasswordModal visible={changingPassword} onClose={() => setChangingPassword(false)} />
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
    header: { alignItems: 'center', marginTop: space.md, marginBottom: space.lg - 4 },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: color.brandSoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    group: { padding: 0, marginBottom: space.md },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm + space.xs,
        paddingVertical: 10,
        paddingHorizontal: 14,
        minHeight: 56,
    },
    rowDivider: { borderTopWidth: 1, borderTopColor: color.border },
    dangerZone: {
        marginTop: space.lg + 4,
        borderTopWidth: 1,
        borderTopColor: color.border,
        paddingTop: space.sm + space.xs,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    deleteButton: { minHeight: 48, paddingHorizontal: space.xs, justifyContent: 'center' },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
});

export default Profile
