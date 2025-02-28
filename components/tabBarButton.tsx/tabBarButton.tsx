import { View, Text, StyleSheet } from 'react-native'
import { PlatformPressable } from '@react-navigation/elements'
import React, { useEffect } from 'react'
import { icon } from '@/constants/constants'
import Animated, { interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { AnimatedText } from 'react-native-reanimated/lib/typescript/component/Text'
import { withSpring } from 'react-native-reanimated';

const TabBarButton = ({
    onPress,
    onLongPress,
    isFocused,
    routeName,
    color,
    label,
}: {
    onPress: () => void;  // ✅ Updated type
    onLongPress: () => void;  // ✅ Updated type
    isFocused: boolean;
    routeName: string;
    color: string;
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
        const top = interpolate(scale.value, [0, 1], [0, 9]);
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
    }
})
