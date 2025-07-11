import { JSX } from 'react';
import { Image } from 'react-native';
export const onboardingSwiperData: onboardingSwiperDataType[] = [
    {
        id: 1,
        head:"RC Caterings",
        title: "Welcome",
        description: "It’s a pleasure to meet you. We are excited that you’re here so let’s get started!",
        image: require("../assets/swiperImages/image1.png")
    },
    {
        id: 2,
        head:"RC Caterings",
        title: "Choose your food",
        description: "Easily find the food you crave, with options to satisfy every taste.",
        image: require("../assets/swiperImages/image2.png")
    },
    {
        id: 3,
        head:"RC Caterings",
        title: "Fast, reliable delivery",
        description: "ensuring your favorite meals arrive fresh and on time, every time",
        image: require("../assets/swiperImages/image3.png")
    },
]

export const icon: Record<string, (props: any) => JSX.Element> = {
    index: (props) => (
        <Image
            style={{ width: 25, height: 25, tintColor: props.color }}
            source={require('@/assets/navbarIcons/homeIcon.png')}
            {...props}
        /> 
    ),
    "order-status/index": (props) => (
        <Image
            style={{ width: 25, height: 25, tintColor: props.color }}
            source={require('@/assets/navbarIcons/orderStatus.png')}
            {...props}
        /> 
    ),
    "pending-payments/index": (props) => (
        <Image
            style={{ width: 25, height: 25, tintColor: props.color }}
            source={require('@/assets/navbarIcons/payUp.png')}
            {...props}
        /> 
    ),
    "notification/index": (props) => (
        <Image
            style={{ width: 25, height: 25, tintColor: props.color }}
            source={require('@/assets/navbarIcons/notify.png')}
            {...props}
        /> 
    ),
    "profile/index": (props) => (
        <Image
            style={{ width: 25, height: 25, tintColor: props.color }}
            source={require('@/assets/navbarIcons/prof.png')}
            {...props}
        /> 
    ),
};