import { View, Text, StyleSheet, Image,TouchableOpacity } from 'react-native'
import React from 'react'
import { Nunito_400Regular, Nunito_600SemiBold } from '@expo-google-fonts/nunito'
import { useFonts, Raleway_700Bold } from "@expo-google-fonts/raleway"
import { ActivityIndicator } from 'react-native'
import AppIntroSlider from 'react-native-app-intro-slider'
import { router } from 'expo-router'
import { onboardingSwiperData } from '@/constants/constants'
import { commonStyles } from '@/styles/common/common.styles'
import Styles from '@/styles/onboarding/onboarding'
import { LinearGradient } from 'expo-linear-gradient'
import { responsiveWidth,responsiveHeight } from "react-native-responsive-dimensions";

export default function WelcomeIntroScreen() {
  let [fontsLoaded, fontsError] = useFonts({
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold
  });

  if (!fontsLoaded && !fontsError) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  const renderItem = ({ item }: { item: onboardingSwiperDataType }) => (

   
      <View style={{ marginTop: 90 }}>
        <Text style={[commonStyles.head, { fontFamily: "Raleway_700Bold" }]}>{item.head}</Text>
        <Image
          source={item.image}
          style={commonStyles.slideImage} />
        <View style={{ marginTop: 3}}>
          <Text style={[commonStyles.title, { fontFamily: "Nunito_400Regular" }]}>{item.title}</Text>
          <Text style={[commonStyles.description, { fontFamily: "Nunito_400Regular" }]}>{item.description}</Text>
          </View>
      </View>
    
  )


  return (
    <AppIntroSlider
    
      renderItem={renderItem}
      data={onboardingSwiperData}
      onDone={() => {
        console.log("Done button pressehhhhd");
        router.push("/login")
      }}
      onSkip={() => {
        console.log("Done button pressellllld");
        router.push("/login")
      }}
      renderNextButton={() => (
        <View style={commonStyles.welcomeButtonContainer}>
          
          <Text
            style={[commonStyles.buttonText, { fontFamily: "Nunito_600SemiBold" }]}>
            Next
          </Text>
        </View>
      )}
      renderDoneButton={() => (
        <View style={commonStyles.welcomeButtonContainer}>
          <Text
            style={[commonStyles.buttonText, { fontFamily: "Nunito_600SemiBold" }]}>
            Done
          </Text>
        </View>
      )}

      showSkipButton={false}
      dotStyle={commonStyles.dotStyle}
      bottomButton={true}
      activeDotStyle={commonStyles.activeDotStyle}
      
    />
  );
}

