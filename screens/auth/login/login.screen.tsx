import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import React from 'react'
import { Entypo, FontAwesome, Fontisto, Ionicons, SimpleLineIcons } from '@expo/vector-icons'
import { useFonts, Raleway_700Bold, Raleway_600SemiBold } from "@expo-google-fonts/raleway"
import { Nunito_400Regular, Nunito_700Bold, Nunito_500Medium, Nunito_600SemiBold } from "@expo-google-fonts/nunito"
import { useState, } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { ScrollView } from 'react-native-gesture-handler'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { commonStyles } from '@/styles/common/common.styles'
import { router } from 'expo-router'
import ForgotPassword from '@/app/(routes)/login/forgot-password'
import { authService } from '@/services';
import { getFcmToken } from "@/services/push/push.service";
import { Field } from '@/components/ui/Field';
import { AppButton } from '@/components/ui/AppButton';
import { color, space, shadow } from '@/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function LoginScreen() {
    const insets = useSafeAreaInsets();
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
const handleSignIn = async () => {
  setButtonSpinner(true);

  if (userInfo.email === "" || userInfo.password === "") {
    setRequired(true);
    setButtonSpinner(false);
    return;
  }

  try {
    const response = await authService.login({
      email: userInfo.email,
      password: userInfo.password,
      fcm_token: (await getFcmToken()) ?? "",
    });

    console.log("✅ Login successful:", response);

    // 👉 Navigate to main app
    router.push("/(tabs)");

  } catch (error: any) {
    console.log("❌ Login error:", error);
    setError({
      ...Error,
      passwordError: error.message || "Login failed",
    });
  } finally {
    setButtonSpinner(false);
  }
};


    return (
        <GestureHandlerRootView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + space.xl }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >

                {/* Top background Image  */}
                <Image source={require('../../../assets/signinback.jpg')} style={styles.signInImage} />

                {/* White Curved Form Area */}
                <View style={styles.formContainer}>

                    <Text style={[styles.title, { fontFamily: "Raleway_700Bold" }]}>Sign In</Text>

                    <Field
                        label="Email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholder="example@gmail.com"
                        value={userInfo.email}
                        onChangeText={(text) => setUserInfo({ ...userInfo, email: text })}
                        error={required && !userInfo.email ? 'Email is required' : undefined}
                    />

                    <Field
                        label="Password"
                        secure
                        placeholder="Password"
                        value={userInfo.password}
                        onChangeText={(text) => setUserInfo({ ...userInfo, password: text })}
                        error={Error.passwordError || undefined}
                    />
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
                        <AppButton title="Sign In" onPress={handleSignIn} loading={buttonSpinner} />
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
            </KeyboardAvoidingView>
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
        backgroundColor: color.surface,
        padding: space.lg,
        marginTop: -40,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        ...shadow.card,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
    },
    forgotSection: {
        textAlign: "right",
        fontSize: 16,
        marginTop: 10,
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

