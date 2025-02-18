import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import React from 'react'
import { Entypo, FontAwesome, Fontisto, Ionicons, SimpleLineIcons } from '@expo/vector-icons'
import { useFonts, Raleway_700Bold, Raleway_600SemiBold } from "@expo-google-fonts/raleway"
import { Nunito_400Regular, Nunito_700Bold, Nunito_500Medium, Nunito_600SemiBold } from "@expo-google-fonts/nunito"
import { useState, } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { ScrollView, TextInput } from 'react-native-gesture-handler'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { commonStyles } from '@/styles/common/common.styles'
import { router } from 'expo-router'
import ForgotPassword from '@/app/(routes)/login/forgot-password'
export default function LoginScreen() {
    const [isPasswordVisible, setPasswordVisible] = useState(false);
    const [buttonSpinner, setButtonSpinner] = useState(false);
    const [userInfo, setUserInfo] = useState({
        email: "",
        password: ""
    });


    const [required, setRequired] = useState(false);
    const [Error, setError] = useState({
        emailError: "",
        passwordError: "",
    });

    const handlePasswordValidation = (value: string) => {
        const password = value;
        const passwordSpecialCharacter = /(?=.*[!@#$%^&*])/;
        const passwordNumber = /(?=.*[0-9])/;
        const passwordEightValue = /(?=.{6,})/;
        if (!passwordSpecialCharacter.test(password)) {
            setError({
                ...Error,
                passwordError: "Password must contain at least one special character",
            });
            setUserInfo({ ...userInfo, password: "" });
        } else if (!passwordNumber.test(password)) {
            setError({
                ...Error,
                passwordError: "Password must contain at least one number",
            });
            setUserInfo({ ...userInfo, password: "" });
        } else if (!passwordEightValue.test(password)) {
            setError({
                ...Error,
                passwordError: "Password must contain at least 8 characters",
            });


            setUserInfo({ ...userInfo, password: "" });
        }


    };
    const handleSignIn = () => {
        if (userInfo.email === "" || userInfo.password === "") {
            setRequired(true);
        } else {
            setRequired(false);
            router.push("/(tabs)/home")
        }
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>

                {/* Top background Image  */}
                <Image source={require('../../../assets/signinback.jpg')} style={styles.signInImage} />

                {/* White Curved Form Area */}
                <View style={styles.formContainer}>

                    <Text style={[styles.title, { fontFamily: "Raleway_700Bold" }]}>Sign In</Text>

                    <View>
                        <TextInput
                            style={commonStyles.input}
                            keyboardType='email-address'
                            placeholder="example@gmail.com"
                            placeholderTextColor="#888"
                            value={userInfo.email}
                            onChangeText={(text) => setUserInfo({ ...userInfo, email: text })}
                        />
                    </View >
                    <View >
                        {required && (
                            <View style={commonStyles.errorContainer}>
                                <Entypo name="cross" size={24} color="red" />
                                <Text style={{ color: "red", fontSize: 14, marginTop: -1 }}>
                                    {Error.passwordError}
                                </Text>
                            </View>

                        )}
                    </View>
                    <View style={{ marginTop: 30 }}>

                        <TextInput
                            style={commonStyles.input}
                            keyboardType='default'
                            placeholder="Password"
                            placeholderTextColor="#888"
                            secureTextEntry={!isPasswordVisible}
                            defaultValue=""
                            onChangeText={handlePasswordValidation}
                        />
                        <TouchableOpacity
                            style={styles.visibleIcon}
                            onPress={() => setPasswordVisible(!isPasswordVisible)}>
                            {isPasswordVisible ? (
                                <Ionicons name="eye-off-outline" size={23} color="black" />) :
                                (<Ionicons name="eye-outline" size={23} color="black" />)}
                        </TouchableOpacity>
                    </View>
                    <View>
                        {Error.passwordError && (
                            <View style={commonStyles.errorContainer}>
                                <Entypo name="cross" size={24} color="red" />
                                <Text style={{ color: "red", fontSize: 14, marginTop: -1 }}>
                                    {Error.passwordError}
                                </Text>
                            </View>
                        )}

                    </View>
                    <View>
                        <TouchableOpacity onPress={() => router.push("/(routes)/login/forgot-password")}>
                            <Text
                                style={[styles.forgotSection,
                                { fontFamily: "Nunito_600SemiBold" },
                                ]}
                            >
                                Forgot Password?
                            </Text>
                        </TouchableOpacity>
                    </View>


                    <View>

                        <TouchableOpacity
                            style={styles.signUpButton}
                            onPress={() => router.push("/(tabs)/home")}
                        >
                            {buttonSpinner ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text
                                    style={{
                                        color: "white",
                                        textAlign: "center",
                                        fontSize: 16,
                                        fontFamily: "Raleway_700Bold",
                                    }}>
                                    Sign In
                                </Text>
                            )}

                        </TouchableOpacity>
                    </View>
                    <View style={{flexDirection:"row",justifyContent:"center",alignItems:"center",marginTop:20,gap:10}}>
                            <TouchableOpacity onPress={() => router.push("https://www.tiktok.com/@kauz64?_t=ZS-8tu51eNKGXp&_r=1")}>
                                <FontAwesome name="google" size={30} color="black" />
                                
                            </TouchableOpacity>
                            
                    </View>

                    <TouchableOpacity>
                        <View style={styles.signUpRedirect}>
                            <Text style={{ fontSize: 16, fontFamily: "Raleway_600SemiBold" }}
                             onPress={() => router.push("/(routes)/sign-up")}>
                                Don't have an account?
                                <Text
                                    style={{ fontFamily: "Raleway_700Bold", color: "#69bf70" }}
                                   
                                >
                                    {" "}Sign Up
                                </Text>
                            </Text>
                        </View>
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </GestureHandlerRootView>
    );
}




const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    signInImage: {
        width: "100%",
        height: 250,
        resizeMode: "cover",
    },
    formContainer: {
        backgroundColor: "white",
        flex: 1,
        padding: 20,
        marginTop: -40,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
    },
    
    
    visibleIcon: {
        position: "absolute",
        right: 30,
        top: "40%",
        transform: [{ translateY: -12 }], // Centers icon properly
    },
    forgotSection: {
        textAlign: "right",
        fontSize: 16,
        marginTop: 10,
        marginHorizontal: 16,

    },
    signUpButton: {
        padding: 15,
        borderRadius: 50,
        marginTop: 30,
        backgroundColor: "#69bf70",
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 16,

    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontFamily: "Raleway_700Bold",
    },

    errorText: {
        color: "red",
        fontSize: 19,
        marginLeft: 5,
        marginHorizontal: 16,
    },
    signUpRedirect: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 20,
        marginHorizontal: 16,
        marginTop: 20,
    }
});

