import { StyleSheet } from "react-native";
import { color, radius, space } from "@/theme";
export const commonStyles = StyleSheet.create({
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

});