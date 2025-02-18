import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import { Image } from 'react-native'

export default function TabsLayout() {
  return (
    <Tabs screenOptions={({ route }) => ({
      tabBarIcon: ({ color }) => {
        let iconName : any;
        if (route.name === "home/index") {
          iconName = require('@/assets/navbarIcons/homeIcon.png')
        } else if (route.name === 'notification/index') {
          iconName = require('@/assets/navbarIcons/notify.png')
        } else if (route.name === 'order-status/index') {
          iconName = require('@/assets/navbarIcons/pendingIcon.png')
        } else if (route.name === 'pending-payments/index') {
          iconName = require('@/assets/navbarIcons/payUp.png')
        } else if (route.name === 'profile/index') {
          iconName = require('@/assets/navbarIcons/prof.png')
        }
        return <Image
        style={{width:25, height:25,tintColor:color}}
        source={iconName}/>
      },
      headerShown: false,
      tabBarShowLabel: false
    })}
    >
        <Tabs.Screen name="home/index"  />
        <Tabs.Screen name="order-status/index" />
        <Tabs.Screen name="pending-payments/index" />
        <Tabs.Screen name="notification/index"/>
        <Tabs.Screen name="profile/index" />
    </Tabs>
  )
}