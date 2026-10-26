import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import MenuListScreen from '@/screens/menuList/menuList.screen'
import { MealType } from '@/services/menu/todayMenu'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

const index = () => {
  const { meal, kind } = useLocalSearchParams<{ meal: MealType; kind: 'veg' | 'nonveg' }>()
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MenuListScreen meal={meal} kind={kind} />
    </GestureHandlerRootView>
  )
}

export default index
