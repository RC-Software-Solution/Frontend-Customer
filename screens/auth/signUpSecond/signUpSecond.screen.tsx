import { View, Text, Image, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import React, { useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router, useLocalSearchParams } from 'expo-router';
import { authService } from '@/services';
import { getFcmToken } from "@/services/push/push.service";
import { Field } from '@/components/ui/Field';
import { AppButton } from '@/components/ui/AppButton';
import { color, space, shadow } from '@/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export default function signUpSecondScreen() {
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams(); // Retrieve user data from previous screen

    const [passwordInfo, setPasswordInfo] = useState({
        password: "",
        confirmPassword: ""
    });

    const [buttonSpinner, setButtonSpinner] = useState(false);
    const [Error, setError] = useState({ passwordError: "", confirmPasswordError: "" });

    const validatePassword = () => {
        let valid = true;
        let newErrors = { passwordError: "", confirmPasswordError: "" };

        if (!/(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/.test(passwordInfo.password)) {
            newErrors.passwordError = "Password must be at least 8 characters, contain a number and a special character";
            valid = false;
        }

        if (passwordInfo.confirmPassword !== passwordInfo.password) {
            newErrors.confirmPasswordError = "Passwords do not match";
            valid = false;
        }

        setError(newErrors);
        return valid;
    };

  const handleNext = async () => {
  if (!validatePassword()) return;
  setButtonSpinner(true);

  try {
    const response = await authService.signup({
      full_name: params.name as string,
      email: params.email as string,
      password: passwordInfo.password,
      role: 'customer', // default role
      address: params.location as string,
      phone: params.phone as string,
      fcm_token: (await getFcmToken()) ?? "",
    });

    console.log("✅ Signup successful:", response);
    alert("Signup successful! Please log in.");
    router.replace('/(routes)/login'); // or next screen

  } catch (err: any) {
    console.error("❌ Signup failed:", err);
    alert(err.message || "Signup failed.");
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
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >

                {/* Top background Image  */}
                <Image source={require('../../../assets/signinback.jpg')} style={styles.signInImage} />

                {/* White Curved Form Area */}
                <View style={[styles.formContainer, { flexGrow: 1, paddingBottom: insets.bottom + space.xl }]}>
                    <Text style={styles.title}>Create a Password</Text>

                    <Field
                        label="Password"
                        secure
                        placeholder="Password"
                        value={passwordInfo.password}
                        onChangeText={(text) => setPasswordInfo({ ...passwordInfo, password: text })}
                        error={Error.passwordError || undefined}
                    />

                    <Field
                        label="Confirm Password"
                        secure
                        placeholder="Confirm Password"
                        value={passwordInfo.confirmPassword}
                        onChangeText={(text) =>
                            setPasswordInfo({ ...passwordInfo, confirmPassword: text })
                        }
                        error={Error.confirmPasswordError || undefined}
                    />

                    <AppButton
                        title="Complete SignUp"
                        onPress={handleNext}
                        loading={buttonSpinner}
                    />
                </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    signInImage: { width: "100%", height: 250, resizeMode: "cover" },
    formContainer: {
        backgroundColor: color.surface,
        padding: space.lg,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        marginTop: -40,
        ...shadow.card,
    },
    title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
});
