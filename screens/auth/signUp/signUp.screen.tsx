import React from 'react'
import { useState, } from 'react'
import { router } from 'expo-router'
import { Field } from '@/components/ui/Field'
import { AppButton } from '@/components/ui/AppButton'
import { AuthFooterLink, AuthLayout } from '@/components/ui/AuthLayout'

export default function signUpScreen() {
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
        <AuthLayout
            title="Sign Up"
            eyebrow="Step 1 of 2"
            subtitle="Create your account to start ordering."
        >
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

            <AuthFooterLink
                prompt="Already have an account?"
                action="Sign In"
                onPress={() => router.push("/(routes)/login")}
            />
        </AuthLayout>
    );
}
