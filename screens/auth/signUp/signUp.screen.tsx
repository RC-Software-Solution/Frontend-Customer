import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import React from 'react'
import { Entypo, FontAwesome, Ionicons } from '@expo/vector-icons'
import { useState, } from 'react'
import { ScrollView, TextInput } from 'react-native-gesture-handler'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { commonStyles } from '@/styles/common/common.styles'
import { router } from 'expo-router'

export default function signUpScreen() {
    const [isPasswordVisible, setPasswordVisible] = useState(false);
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
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>

                {/* Top background Image  */}
                <Image source={require('../../../assets/signinback.jpg')} style={styles.signInImage} />

                {/* White Curved Form Area */}
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Sign Up</Text>

                    <TextInput style={commonStyles.input} placeholder="Full Name" value={userInfo.name} placeholderTextColor="#888" onChangeText={(text) => setUserInfo({ ...userInfo, name: text })} />
                    {Error.nameError ? (
                        <View style={[commonStyles.errorContainer, { marginTop: -10 }]}>
                            <Entypo name="cross" size={24} color="red"  /> 
                            <Text style={styles.errorText}> 
                                {Error.nameError}
                            </Text>
                        </View>
                    ) : null}

                    <TextInput style={[commonStyles.input, { marginTop: 30 }]} placeholder="Email" placeholderTextColor="#888" keyboardType='email-address' value={userInfo.email} onChangeText={(text) => setUserInfo({ ...userInfo, email: text })} />
                    {Error.emailError ? (
                        <View style={[commonStyles.errorContainer, { marginTop: -10 }]}>
                            <Entypo name="cross" size={24} color="red" /> 
                            <Text style={styles.errorText}>
                                {Error.emailError}
                            </Text>
                        </View>
                    ) : null}

                    <TextInput style={[commonStyles.input, { marginTop: 30 }]} placeholder="Phone Number" placeholderTextColor="#888" keyboardType='numeric' maxLength={10} value={userInfo.phone} onChangeText={(text) => setUserInfo({ ...userInfo, phone: text })} />
                    {Error.phoneError ? (
                        <View style={[commonStyles.errorContainer, { marginTop: -10 }]}>
                              <Entypo name="cross" size={24} color="red" /> 
                            <Text style={styles.errorText}>
                              {Error.phoneError}
                            </Text>
                        </View>
                    ) : null}

                    <TextInput style={[commonStyles.input, { marginTop: 30 }]} placeholder="Location" placeholderTextColor="#888" value={userInfo.location} onChangeText={(text) => setUserInfo({ ...userInfo, location: text })} />
                    {Error.locationError ? (
                        <View style={[commonStyles.errorContainer, { marginTop: -10 }]}>
                             <Entypo name="cross" size={24} color="red" />
                            <Text style={styles.errorText}>
                                {Error.locationError}
                            </Text>
                        </View>
                    ) : null}

                    <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
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
                                Next
                            </Text>
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
    formContainer:
    {
        backgroundColor: "white",
        flex: 1,
        padding: 20,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        shadowColor: "#000",
        marginTop: -40,
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5.
    },
    title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
    input: { backgroundColor: "#f2f2f2", borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 16 },
    errorText: { color: "red", fontSize: 14, marginTop: -1, },
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

