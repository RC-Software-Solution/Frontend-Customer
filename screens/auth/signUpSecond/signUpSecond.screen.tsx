import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { authService } from '@/services';
import { getFcmToken } from "@/services/push/push.service";
import { validateNewPassword } from "@/services/utils/validation";
import { Field } from '@/components/ui/Field';
import { AppButton } from '@/components/ui/AppButton';
import { AuthLayout } from '@/components/ui/AuthLayout';
export default function signUpSecondScreen() {
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

        const passwordProblem = validateNewPassword(passwordInfo.password);
        if (passwordProblem) {
            newErrors.passwordError = passwordProblem;
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
        <AuthLayout
            title="Create a Password"
            eyebrow="Step 2 of 2"
            subtitle="At least 8 characters, with a number and a special character."
            onBack={() => router.back()}
        >
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
                title="Create account"
                onPress={handleNext}
                loading={buttonSpinner}
            />
        </AuthLayout>
    );
}
