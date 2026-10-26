import { View, Image, TouchableOpacity, ImageBackground } from 'react-native'
import React from 'react'
import styles from "../../styles/onboarding/onboarding"
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { space } from '@/theme'
import { AppText } from '@/components/ui/AppText'

const onboarding = () => {
    const insets = useSafeAreaInsets();
    return (
        <ImageBackground
            source={require("@/assets/background.jpg")} style={styles.backgroundImage} resizeMode="cover" >
            <View style={styles.overlay} />
            <View style={styles.firstContainer}>
                <View>
                    <Image
                        source={require("@/assets/logo.png")} style={styles.logo}></Image>
                </View>

                <View style={styles.titleWrapper}>
                    <Image source={require("@/assets/title1.png")} style={styles.titleTextShape1}></Image>
                    <AppText variant="h2" weight="bold" tone="inverse" style={styles.titleText}>
                        Crave. Order. Enjoy!
                    </AppText>
                    <Image style={styles.titleTextShape2} source={require("@/assets/title2.png")}></Image>
                    <Image style={styles.titleTextShape3} source={require("@/assets/title3.png")}></Image>
                </View>

                <View style={styles.dscpWrapper}>
                    <AppText variant="caption" tone="inverse" style={styles.dscpText}>
                        Delicious meals, made with care and delivered fast.
                    </AppText>

                </View>
                <TouchableOpacity
                    style={[styles.buttonWrapper, { bottom: insets.bottom + space.lg }]}
                    onPress={() => router.push("/(routes)/welcome-intro")}>
                    <AppText variant="body" weight="bold" tone="inverse" style={styles.buttonText}>
                        Get Started</AppText>
                </TouchableOpacity>
            </View>

    </ImageBackground >
    )
}

export default onboarding