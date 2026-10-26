import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import React, { useEffect } from 'react'
import { useState, } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { router } from 'expo-router'
import { useAuth } from '@/services';
import { getFcmToken } from "@/services/push/push.service";
import { Field } from '@/components/ui/Field';
import { KeyboardForm } from '@/components/ui/KeyboardForm';
import { AppButton } from '@/components/ui/AppButton';
import { color, space, shadow } from '@/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function LoginScreen() {
    const insets = useSafeAreaInsets();
    const { login, sessionExpired, dismissSessionExpired } = useAuth();

    useEffect(() => {
        if (!sessionExpired) return;
        Alert.alert('Session expired', 'For your security, please sign in again.');
        dismissSessionExpired();
    }, [sessionExpired, dismissSessionExpired]);
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
    // On success the route guard in app/_layout.tsx moves us into the app
    await login({
      email: userInfo.email,
      password: userInfo.password,
      fcm_token: (await getFcmToken()) ?? "",
    });

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
            <KeyboardForm>

                {/* Top background Image  */}
                <Image source={require('../../../assets/signinback.jpg')} style={styles.signInImage} />

                {/* White Curved Form Area */}
                <View style={[styles.formContainer, { flexGrow: 1, paddingBottom: insets.bottom + space.xl }]}>

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
                    {/* TODO(google-auth): "Sign in with Google" is not built yet. Needs a Google Cloud OAuth setup,
                        POST /api/users/google in user-service, @react-native-google-signin/google-signin and a dev build
                        (no Expo Go). Decide sign-in only vs sign-up too first. */}

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
                </KeyboardForm>
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
    },
    signUpRedirect: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 20,
        marginHorizontal: 16,
        marginTop: 20,
    }
});

