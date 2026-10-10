import { View, Text, Image, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import React from 'react'
import { useState, } from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { router } from 'expo-router'
import { Field } from '@/components/ui/Field'
import { AppButton } from '@/components/ui/AppButton'
import { color, space, shadow } from '@/theme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function signUpScreen() {
    const insets = useSafeAreaInsets();
    const [buttonSpinner, setButtonSpinner] = useState(false);
    const [userInfo, setUserInfo] = useState({
        name: "",
        email: "",
        phone: "",
        location: ""
    });


    const [required, setRequired] = useState(false);
    const [Error, setError] = useState({
        nameError: "",
        emailError: "",
        phoneError: "",
        locationError: ""

    });

    const validateInputs = () => {
        let valid = true;
        let newErrors = { nameError: "", emailError: "", phoneError: "", locationError: "" };

        if (userInfo.name.trim() === "") {
            newErrors.nameError = "Name is required";
            valid = false;
        }
        if (userInfo.email.trim() === "" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInfo.email)) {
            newErrors.emailError = "Valid email is required";
            valid = false;
        }
        if (userInfo.phone.trim().length !== 10 || !/^[0-9]{10}$/.test(userInfo.phone)) {
            newErrors.phoneError = "Phone number must be 10 digits";
            valid = false;
        }
        if (userInfo.location.trim() === "") {
            newErrors.locationError = "Location is required";
            valid = false;
        }

        setError(newErrors);
        return valid;
    };
    const handleNext = () => {
        if (validateInputs()) {
            router.push({ pathname: '/sign-up/signUpSecond', params: userInfo });
        }
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >

                {/* Top background Image  */}
                <Image source={require('../../../assets/signinback.jpg')} style={styles.signInImage} />

                {/* White Curved Form Area */}
                <View style={[styles.formContainer, { flexGrow: 1, paddingBottom: insets.bottom + space.xl }]}>
                    <Text style={styles.title}>Sign Up</Text>

                    <Field
                        label="Full Name"
                        placeholder="Full Name"
                        value={userInfo.name}
                        onChangeText={(text) => setUserInfo({ ...userInfo, name: text })}
                        error={Error.nameError || undefined}
                    />

                    <Field
                        label="Email"
                        placeholder="Email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={userInfo.email}
                        onChangeText={(text) => setUserInfo({ ...userInfo, email: text })}
                        error={Error.emailError || undefined}
                    />

                    <Field
                        label="Phone Number"
                        placeholder="Phone Number"
                        keyboardType="numeric"
                        maxLength={10}
                        value={userInfo.phone}
                        onChangeText={(text) => setUserInfo({ ...userInfo, phone: text })}
                        error={Error.phoneError || undefined}
                    />

                    <Field
                        label="Location"
                        placeholder="Location"
                        value={userInfo.location}
                        onChangeText={(text) => setUserInfo({ ...userInfo, location: text })}
                        error={Error.locationError || undefined}
                    />

                    <AppButton title="Next" onPress={handleNext} loading={buttonSpinner} />

                    <TouchableOpacity>
                                            <View style={styles.signUpRedirect}>
                                                <Text style={{ fontSize: 16, fontFamily: "Raleway_600SemiBold" }}
                                                 onPress={() => router.push("/(routes)/login")}>
                                                   Already have an account?
                                                    <Text
                                                        style={{ fontFamily: "Raleway_700Bold", color: "#69bf70" }}
                                                       
                                                    >
                                                        {" "}Sign In
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
    container: { flex: 1 },
    signInImage: { width: "100%", height: 250, resizeMode: "cover" },
    formContainer:
    {
        backgroundColor: color.surface,
        padding: space.lg,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        marginTop: -40,
        ...shadow.card,
    },
    title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
     signUpRedirect: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 20,
        marginHorizontal: 16,
        marginTop: 20,
    }

});

