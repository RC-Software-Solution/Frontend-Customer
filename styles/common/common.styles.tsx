import { StyleSheet } from "react-native";
import { responsiveWidth,responsiveHeight } from "react-native-responsive-dimensions";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
export const commonStyles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        
    },
    buttonContainer: {
        backgroundColor: "#25123EC",
        width: responsiveWidth(88),
        height: responsiveHeight(2.5),
        borderRadius:5,
        marginHorizontal:5,
        alignItems:"center",
        justifyContent: "center"
    
    },
    dotStyle:{
        backgroundColor: "#001100",
        width: responsiveWidth(2.25),
        height: responsiveHeight(1.15),
        borderRadius: 10,
        marginHorizontal:5,
        bottom: responsiveHeight(10), 
    },
    activeDotStyle:{
        backgroundColor: "#69bf70",
        width: responsiveWidth(2.25),
        height: responsiveHeight(1.15),
        borderRadius: 10,
        marginHorizontal:5,
        bottom: responsiveHeight(10), 
    },
    buttonText: {
        color: "white",
        textAlign: "center",
        fontSize: 20,
       
        textAlignVertical: "center",
        
        alignSelf:"center"
      },

      head:{
       
        fontSize: hp("3%"),
        textAlign:"center",
      },
      
    title:{
       
        fontSize: hp("3%"),
        textAlign:"center",
         fontWeight: "700"
    },
    slideImage: {
        marginTop: 50,
        alignSelf: "center",
        marginBottom: 10,
        width: responsiveWidth(80), // 80% of screen width for a better fit
        height: responsiveWidth(80) // Maintain aspect ratio (if necessary)
      },
      description: {
        marginHorizontal: 60,
        marginBottom:10,
        fontSize: hp("2.1%"),
        textAlign: "center",
        color: "#575758",
        
      },
      welcomeButtonContainer: {
        backgroundColor: "#69bf70",
        width: responsiveWidth(70),
        height: responsiveHeight(6.5),
        borderRadius: 50,
        alignSelf: "center",
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",  // Ensures it stays at the bottom
        bottom: responsiveHeight(5), // Adjust position for better touchability
        paddingHorizontal: 10, // Extra padding to prevent edge issues
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