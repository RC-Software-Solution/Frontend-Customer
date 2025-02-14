import { View, Text, Image, TouchableOpacity, ImageBackground } from 'react-native'
import React from 'react'
import { useFonts, Raleway_700Bold } from "@expo-google-fonts/raleway"
import { Nunito_400Regular, Nunito_700Bold } from "@expo-google-fonts/nunito"
import { ActivityIndicator } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import styles from "../../styles/onboarding/onboarding"
import { router } from 'expo-router'

const onboarding = () => {
    let [fontsLoaded, fontsError] = useFonts({
        Raleway_700Bold,
        Nunito_400Regular,
        Nunito_700Bold
    });
    if (!fontsLoaded && !fontsError) {
        return <ActivityIndicator size="large" color="#0000ff" />;
    }
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
                    <Text style={[styles.titleText, { fontFamily: "Raleway_700Bold" }]}>
                        Crave. Order. Enjoy!
                    </Text>
                    <Image style={styles.titleTextShape2} source={require("@/assets/title2.png")}></Image>
                    <Image style={styles.titleTextShape3} source={require("@/assets/title3.png")}></Image>
                </View>

                <View style={styles.dscpWrapper}>
                    <Text style={[styles.dscpText, { fontFamily: "Nunito_400Regular" }]}>
                        Delicious meals, made with care and delivered fast.
                    </Text>

                </View>
                <TouchableOpacity style={styles.buttonWrapper}
                    onPress={() => router.push("/(routes)/welcome-intro")}>
                    <Text style={[styles.buttonText, { fontFamily: "Nunito_700Bold" }]} >
                        Get Started</Text>
                </TouchableOpacity>
            </View>

    </ImageBackground >
    )
}

export default onboarding