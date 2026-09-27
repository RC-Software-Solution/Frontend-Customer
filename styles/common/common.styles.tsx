import { StyleSheet } from "react-native";
import { color, radius, space, type } from "@/theme";
export const commonStyles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",

    },
    dotStyle: {
        backgroundColor: color.border,
        width: 8,
        height: 8,
        borderRadius: radius.pill,
        marginHorizontal: space.xs,
        bottom: 24,
    },
    activeDotStyle: {
        backgroundColor: color.brand,
        width: 8,
        height: 8,
        borderRadius: radius.pill,
        marginHorizontal: space.xs,
        bottom: 24,
    },
    buttonText: {
        color: "white",
        textAlign: "center",
        fontSize: 20,

        textAlignVertical: "center",

        alignSelf:"center"
      },

      head:{

        fontSize: type.h2,
        textAlign:"center",
      },

    title:{

        fontSize: type.h2,
        textAlign:"center",
         fontWeight: "700"
    },
    slideImage: {
        marginTop: space.lg,
        alignSelf: 'center',
        marginBottom: space.sm,
        width: '70%',
        aspectRatio: 1,
        maxHeight: 260,
        resizeMode: 'contain',
    },
    description: {
        marginHorizontal: space.lg,
        marginBottom: space.sm,
        fontSize: type.caption,
        textAlign: 'center',
        color: color.muted,
    },
    welcomeButtonContainer: {
        backgroundColor: color.brand,
        width: '80%',
        maxWidth: 360,
        minHeight: 56,
        borderRadius: radius.pill,
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: space.xl,
    },
    input: {
      height: 55,
      marginHorizontal:16,
      backgroundColor: "#f5f5f5",
      paddingLeft: 25,
      fontSize: 16,
      borderRadius: 10,
      marginBottom: 15,

  },
    errorContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal:16,

      },

});