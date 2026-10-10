import { View, Text, Image } from 'react-native'
import React from 'react'
import { Nunito_400Regular, Nunito_600SemiBold } from '@expo-google-fonts/nunito'
import { useFonts, Raleway_700Bold } from "@expo-google-fonts/raleway"
import { ActivityIndicator } from 'react-native'
import AppIntroSlider from 'react-native-app-intro-slider'
import { router } from 'expo-router'
import { onboardingSwiperData } from '@/constants/constants'
import { commonStyles } from '@/styles/common/common.styles'
import { space } from '@/theme'
import { useAuth } from '@/services'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function WelcomeIntroScreen() {
  let [fontsLoaded, fontsError] = useFonts({
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold
  });
  const insets = useSafeAreaInsets();
  const { markIntroSeen } = useAuth();

  if (!fontsLoaded && !fontsError) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  const renderItem = ({ item }: { item: onboardingSwiperDataType }) => (


      <View style={{ marginTop: insets.top + space.md, paddingHorizontal: space.md }}>
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
        markIntroSeen();
        router.push("/sign-up")
      }}
      onSkip={() => {
        markIntroSeen();
        router.push("/sign-up")
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

