import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import MenuListScreen from '@/screens/menuList/menuList.screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

const index = () => {
  // raw values; MenuListScreen normalises missing, repeated or unknown ones
  const { meal, kind } = useLocalSearchParams()
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MenuListScreen meal={meal} kind={kind} />
    </GestureHandlerRootView>
  )
}

export default index
