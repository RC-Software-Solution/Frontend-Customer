import { View, Image } from 'react-native'
import React from 'react'
import AppIntroSlider from 'react-native-app-intro-slider'
import { router } from 'expo-router'
import { onboardingSwiperData } from '@/constants/constants'
import { commonStyles } from '@/styles/common/common.styles'
import { space } from '@/theme'
import { AppText } from '@/components/ui/AppText'
import { useAuth } from '@/services'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const centered = { textAlign: 'center' } as const

export default function WelcomeIntroScreen() {
  const insets = useSafeAreaInsets();
  const { markIntroSeen } = useAuth();

  const renderItem = ({ item }: { item: onboardingSwiperDataType }) => (


      <View style={{ marginTop: insets.top + space.md, paddingHorizontal: space.md }}>
        <AppText variant="h2" weight="bold" style={centered}>{item.head}</AppText>
        <Image
          source={item.image}
          style={commonStyles.slideImage} />
        <View style={{ marginTop: 3}}>
          <AppText variant="h2" weight="bold" style={centered}>{item.title}</AppText>
          <AppText variant="caption" tone="muted" style={[centered, commonStyles.description]}>{item.description}</AppText>
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
          
          <AppText variant="body" weight="bold" tone="onBrand" style={centered}>
            Next
          </AppText>
        </View>
      )}
      renderDoneButton={() => (
        <View style={commonStyles.welcomeButtonContainer}>
          <AppText variant="body" weight="bold" tone="onBrand" style={centered}>
            Done
          </AppText>
        </View>
      )}

      showSkipButton={false}
      dotStyle={commonStyles.dotStyle}
      bottomButton={true}
      activeDotStyle={commonStyles.activeDotStyle}
      
    />
  );
}

