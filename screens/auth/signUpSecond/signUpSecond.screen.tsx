import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { Entypo, FontAwesome,Ionicons } from '@expo/vector-icons';
import { ScrollView, TextInput } from 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { commonStyles } from '@/styles/common/common.styles';
import { router, useLocalSearchParams } from 'expo-router';
import api from '@/services/api'; // Adjust the import path as necessary
export default function signUpSecondScreen() {
    const params = useLocalSearchParams(); // Retrieve user data from previous screen

    const [passwordInfo, setPasswordInfo] = useState({
        password: "",
        confirmPassword: ""
    });

    const [isPasswordVisible, setPasswordVisible] = useState(false);
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
    const response = await api.post('/users/signup', {
      full_name: params.name,
      email: params.email,
      password: passwordInfo.password,
      role: 'customer', // default role
      address: params.location,
      phone: params.phone,
      fcm_token: '', // if you don't have FCM yet
    });

    console.log("✅ Signup successful:", response.data);
    alert("Signup successful! Please log in.");
    router.replace('/(routes)/login'); // or next screen

  } catch (err: any) {
    console.error("❌ Signup failed:", err.response?.data || err.message);
    alert(err.response?.data?.error || "Signup failed.");
  } finally {
    setButtonSpinner(false);
  }
};


    return (
        <GestureHandlerRootView style={styles.container}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>

                {/* Top background Image  */}
                <Image source={require('../../../assets/signinback.jpg')} style={styles.signInImage} />

                {/* White Curved Form Area */}
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Create a Password</Text>

                    {/* Password Input */}
                    
                        <TextInput
                            style={commonStyles.input}
                            placeholder="Password"
                            placeholderTextColor="#888"
                            secureTextEntry={!isPasswordVisible}
                            value={passwordInfo.password}
                            onChangeText={(text) => setPasswordInfo({ ...passwordInfo, password: text })}
                        />
                        <TouchableOpacity onPress={() => setPasswordVisible(!isPasswordVisible)} style={[styles.eyeIcon,{top: 82}]}>
                            {isPasswordVisible ? (
                                <Ionicons name="eye-outline" size={23} color="black" />) :
                                (<Ionicons name="eye-off-outline" size={23} color="black" />)}
                        </TouchableOpacity>
                    
                    {Error.passwordError ? (
                        <View style={commonStyles.errorContainer}>
                            <Entypo name="cross" size={24} color="red" />
                            <Text style={styles.errorText}>{Error.passwordError}</Text>
                        </View>
                    ) : null}

                    {/* Confirm Password Input */}
                    
                        <TextInput
                            style={commonStyles.input}
                            placeholder="Confirm Password"
                            placeholderTextColor="#888"
                            secureTextEntry={!isPasswordVisible}
                            value={passwordInfo.confirmPassword}
                            onChangeText={(text) => setPasswordInfo({ ...passwordInfo, confirmPassword: text })}
                        />
                        <TouchableOpacity onPress={() => setPasswordVisible(!isPasswordVisible)} style={[styles.eyeIcon,{top: 152}]}>
                            {isPasswordVisible ? (
                                <Ionicons name="eye-outline" size={23} color="black" />) :
                                (<Ionicons name="eye-off-outline" size={23} color="black" />)}
                        </TouchableOpacity>
                   
                    {Error.confirmPasswordError ? (
                        <View style={commonStyles.errorContainer}>
                            <Entypo name="cross" size={24} color="red" />
                            <Text style={styles.errorText}>{Error.confirmPasswordError}</Text>
                        </View>
                    ) : null}

                    {/* Next Button */}
                    <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                        {buttonSpinner ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Text style={styles.buttonText}>Complete SignUp</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    signInImage: { width: "100%", height: 250, resizeMode: "cover" },
    formContainer: {
        backgroundColor: "white",
        flex: 1,
        padding: 20,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        shadowColor: "#000",
        marginTop: -40,
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
    errorText: { color: "red", fontSize: 14, marginTop: -1 },
    passwordContainer: { flexDirection: "row", alignItems: "center" },
    eyeIcon: { right: 15, position: "absolute", marginRight: 40 },
    nextButton: {
        padding: 15,
        borderRadius: 50,
        marginTop: 30,
        backgroundColor: "#69bf70",
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 16,
    },
    buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
