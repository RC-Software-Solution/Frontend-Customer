import { StyleSheet } from "react-native";
import { color, radius, space } from "@/theme";

const styles = StyleSheet.create({
    firstContainer: {
        alignItems: "center",
        flex: 1,
        justifyContent: "center",
        marginTop: 40
    },
    logo: {
        width: 96,
        height: 96,
        resizeMode: 'contain',
    },
    titleWrapper: {
        marginTop: space.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleTextShape1: { position: 'absolute', right: -8, top: -18, width: 40, height: 40, resizeMode: 'contain' },
    titleText: {
        textAlign: "center",
    },
    titleTextShape2: { position: 'absolute', left: -8, bottom: -14, width: 36, height: 36, resizeMode: 'contain' },
    titleTextShape3: { position: 'absolute', left: -4, top: -20, width: 28, height: 28, resizeMode: 'contain' },
    dscpWrapper: {
        marginTop: 5
    }
    ,
    dscpText: {
        textAlign: "center",
    },
    buttonWrapper: {
        backgroundColor: "transparent",
        borderWidth: 3,             // Thick border
        borderColor: color.brand,    // Button border color
        width: '80%',
        maxWidth: 360,
        paddingVertical: space.md,
        minHeight: 56,
        borderRadius: radius.pill,
        justifyContent: 'center',  // Centers vertically
        alignItems: 'center',
       position: "absolute",
        bottom: 50
    },
    buttonText: {
        textAlign: "center",
    },
    backgroundImage: {
        flex: 1,
         width: "100%",
          height: "100%",
          alignItems: "center",
        justifyContent: "center"
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: color.scrim,
    }


})

export default styles