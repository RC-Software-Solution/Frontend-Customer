import { View, Text, TouchableOpacity,StyleSheet } from 'react-native'
import React from 'react'
import { commonStyles } from '@/styles/common/common.styles'
import { responsiveWidth,responsiveHeight } from "react-native-responsive-dimensions";
export default function Button({title,onPress}:{title:string, onPress:()=>void}) {    
  return (
    <TouchableOpacity  style={Styles.Button}
    onPress={()=>onPress()}>
        <Text style={Styles.buttonText}>
           {title}</Text>
     </TouchableOpacity>
 
  )
}

const Styles = StyleSheet.create({
    Button:{
            width: responsiveWidth(88),
            height: responsiveHeight(6),
            padding: 15,
            borderRadius: 50,
            marginTop: 30,
            backgroundColor: "#69bf70",
            alignItems: "center",
            justifyContent: "center",
            marginHorizontal: 16,
        },
        buttonText:{
            color: "white",
            textAlign: "center",
            fontSize: 16,
            fontFamily: "Raleway_700Bold",
           
        }
    }
)