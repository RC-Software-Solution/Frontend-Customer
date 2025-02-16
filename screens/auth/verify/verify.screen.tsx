import { View, Text, StyleSheet, TextInput, TouchableOpacity, Button } from 'react-native'
import React from 'react'
import { useState, createRef, useRef } from 'react'
import CustomButton from "../../../components/button/button";
import { router } from 'expo-router';
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
    <View style={styles.container}>
      <Text style={styles.headerText}>
        Verification Code</Text>
      <Text style={styles.subText}>
        We have sent the verification code to your email address
      </Text>
      <View style={styles.inputContainer}>
        {code.map((_, index) => (
          <TextInput
            key={index}
            style={styles.inputBox}
            keyboardType="number-pad"
            maxLength={1}
            onChangeText={(text) => handleInput(text, index)}
            value={code[index]}
            ref={inputs.current[index]}
            autoFocus={index === 0}
          />
        ))}


      </View>
      <View>
        <CustomButton title="Submit"
          onPress={handleSubmit} />
      </View>

     <TouchableOpacity>
                             <View style={styles.signUpRedirect}>
                                 <Text style={{ fontSize: 16, fontFamily: "Raleway_600SemiBold" }}
                                  onPress={() => router.push("/(routes)/login")} >
                                     Go back to
                                     <Text
                                         style={{ fontFamily: "Raleway_700Bold", color: "#69bf70"}}
                                        
                                     >
                                         {" "}Sign In
                                     </Text>
                                 </Text>
                             </View>
                         </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  headerText: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10
  },
  subText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center"
  },
  inputContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  inputBox: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: "#ddd",
    textAlign: "center",
    marginRight: 10,
    borderRadius: 10,
    fontSize: 20,
  },
  loginLink: {
    flexDirection: "row",
    marginTop: 30,
  },
  loginText: {
    color: "#3876EE",
    marginLeft: 5,
    fontSize: 16,
  },
  backText: { fontSize: 16 },
  signUpRedirect: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    marginHorizontal: 16,
    marginTop: 20,
}
});