import { StyleSheet } from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const styles = StyleSheet.create({
    firstContainer: {
        alignItems: "center",
        flex: 1,
        justifyContent: "center",
        marginTop: 40
    },
    logo: {
        width: wp("23%"),
        height: hp("10%"),
    }, titleWrapper: {
        marginTop: 30,
        flexDirection: "row",
    },
    titleTextShape1: {
        position: "absolute",
        right: 10,
        top: 100,
    },
    titleText: {
        fontSize: hp("2.9%"),
        textAlign: "center",
        color: "#ffffff"
    },
    titleTextShape2: {
        position: "absolute",
        left: -20,
        bottom: 20
    },
    titleTextShape3: {
        position: "absolute",
        left: -80
    
    }, dscpWrapper: {
        marginTop: 5
    }
    ,
    dscpText: {
        fontSize: hp("1.7%"),
        textAlign: "center",
        color: "#ffffff"
    },
    buttonWrapper: {
        backgroundColor: "transparent", 
        borderWidth: 3,             // Thick border
        borderColor: "#69bf70",    // Button border color
        overflow: "hidden",
        width: wp("70%"),
        paddingVertical: 18,
        borderRadius: 50,
        marginTop: 40,
        height: hp("8%"),
        justifyContent: 'center',  // Centers vertically
        alignItems: 'center',
       position: "absolute",
        bottom: 50
    },
    buttonText: {
        color: "#ffffff",
        textAlign: "center",
        fontSize: hp("1.75%"),
        

    },
    backgroundImage: {
        flex: 1,
         width: "100%",
          height: "100%", 
          alignItems: "center", 
        justifyContent: "center"
    },
    overlay:{
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.5)"
    }
    

})

export default styles