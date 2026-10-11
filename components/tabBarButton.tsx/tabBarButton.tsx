import { View, Text, StyleSheet } from 'react-native'
import { PlatformPressable } from 'expo-router/react-navigation'
import React, { useEffect } from 'react'
import { icon } from '@/constants/constants'
import Animated, { interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { withSpring } from 'react-native-reanimated';

const TabBarButton = ({
    onPress,
    onLongPress,
    isFocused,
    routeName,
    color,
    label,
    badge = 0,
}: {
    onPress: () => void;  // ✅ Updated type
    onLongPress: () => void;  // ✅ Updated type
    isFocused: boolean;
    routeName: string;
    color: string;
    badge?: number;
    label: string | ((props: { focused: boolean; color: string; position: any; children: string }) => React.ReactNode);
}) => {

    const scale = useSharedValue(0);
    useEffect(() => {

        scale.value = withSpring(
            typeof isFocused === "boolean" ? (isFocused ? 1 : 0) : isFocused,
            { duration: 450 });
    }, [scale, isFocused]);




    const animatedIconStyle = useAnimatedStyle(() => {
        const scaleValue = interpolate(scale.value, [0, 1], [1, 1.2]);
        const top = interpolate(scale.value, [0, 1], [0, 4]);
        return {
            transform: [{
                scale: scaleValue
            }],
            top
        }
    });

    const animatedTestStyle = useAnimatedStyle(() => {
        const opacity = interpolate(scale.value, [0, 1], [1, 0]);

        return {
            opacity,

        }
    });

    return (

        <PlatformPressable
            android_ripple={{ borderless: false, color: "transparent" }}
            onPress={onPress}
            onLongPress={onLongPress}

            style={styles.tabBarItem}
        >
            <Animated.View style={animatedIconStyle}>
                {icon[routeName]!({
                    color: isFocused ? "#fff" : "#222"
                })}
                {badge > 0 ? (
                    <View style={styles.badge} accessibilityLabel={`${badge} unread`}>
                        <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                    </View>
                ) : null}
            </Animated.View>
            {/* ✅ Updated to use labelContent */}
            <Animated.Text style={[{ color: isFocused ? '#69bf70' : "#222", fontSize: 11 }, animatedTestStyle]}>
                {typeof label === "function" ? label({ focused: isFocused, color: isFocused ? '#69bf70' : "#222", position: "below-icon", children: routeName }) : label}
            </Animated.Text>

        </PlatformPressable>

    );
}

export default TabBarButton

const styles = StyleSheet.create({
    tabBarItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -10,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        paddingHorizontal: 4,
        backgroundColor: '#d9534f',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
})
