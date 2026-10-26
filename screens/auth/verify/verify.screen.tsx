import { View } from 'react-native'
import React from 'react'
import { useState, createRef, useRef } from 'react'
import { router } from 'expo-router';
import { Field } from '@/components/ui/Field';
import { AppButton } from '@/components/ui/AppButton';
import { AuthFooterLink, AuthLayout } from '@/components/ui/AuthLayout';
import { space } from '@/theme';
export default function VerifyScreen() {

  const [code, setcCode] = React.useState(new Array(4).fill(''));
  const inputs = useRef<any>([...Array(4)].map(() => createRef()));
  const handleInput = (text: any, index: any) => {
    const newCode = [...code];
    newCode[index] = text;
    setcCode(newCode);
    if (text && index < 3) {
      inputs.current[index + 1].current.focus();
    }
    if (text === '' && index > 0) {
      inputs.current[index - 1].current.focus();
    }
  }

  const handleSubmit = () => { }
  return (
    <AuthLayout title="Verification Code" subtitle="We have sent the verification code to your email address">
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {code.map((_, index) => (
          <View key={index} style={{ flex: 1 }}>
            <Field
              keyboardType="number-pad"
              maxLength={1}
              onChangeText={(text) => handleInput(text, index)}
              value={code[index]}
              ref={inputs.current[index]}
              autoFocus={index === 0}
              accessibilityLabel={`Digit ${index + 1} of 4`}
              style={{ textAlign: 'center', paddingHorizontal: 0 }}
            />
          </View>
        ))}
      </View>

      <AppButton title="Submit" onPress={handleSubmit} />

      <AuthFooterLink prompt="Go back to" action="Sign In" onPress={() => router.push("/(routes)/login")} />
    </AuthLayout>
  );
}
